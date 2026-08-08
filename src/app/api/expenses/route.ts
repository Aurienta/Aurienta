import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceExpenseAuthority,
  enforceNotFrozen,
} from "@/lib/aurienta/cre";
import { expenseSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import {
  checkIdempotency,
  getIdempotencyContext,
  storeIdempotency,
} from "@/lib/aurienta/idempotency";
import {
  aggregateExpensesByCategory,
  buildViewerContext,
  isSalaryLikeCategory,
  sanitizeExpenseForViewer,
  type ViewerContext,
} from "@/lib/aurienta/transparency";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";

// GET /api/expenses?enterpriseId=xxx
// Returns the sanitized expense list for the authenticated viewer.
// Per §8.14.2:
//   - Board members see ALL individual expense lines (including salaries).
//   - Non-board enterprise members / Capital Partners see individual lines for
//     every category EXCEPT salary-like categories (salaries, payroll, wages).
//     For salary-like categories they see AGGREGATED totals only — never
//     individual salary line items.
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId query parameter is required", code: "missing_enterprise_id" },
        { status: 400 },
      );
    }

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true },
    });
    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found", code: "not_found" }, { status: 404 });
    }

    const expenses = await db.expense.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        description: true,
        vendor: true,
        amountEgp: true,
        status: true,
        createdAt: true,
        approver1Id: true,
      },
    });

    // Build the viewer context from the user's memberships in this enterprise.
    let viewer: ViewerContext | null = buildViewerContext(
      user.memberships,
      user.id,
      enterpriseId,
    );
    if (!viewer) {
      // External viewer — sees the public expense summary only (non-salary
      // individual lines + aggregated salary totals). Treat them as an
      // external capital_partner.
      viewer = {
        role: "capital_partner",
        userId: user.id,
        enterpriseId: "__external_viewer__",
        isBoardMember: false,
        isManager: false,
      };
    }

    // Partition expenses into salary-like (aggregated only for non-board) and
    // other categories (individual lines visible to all enterprise members).
    const salaryLike: typeof expenses = [];
    const otherExpenses: typeof expenses = [];
    for (const exp of expenses) {
      if (isSalaryLikeCategory(exp.category)) {
        salaryLike.push(exp);
      } else {
        otherExpenses.push(exp);
      }
    }

    // Sanitize each non-salary expense. Non-board viewers get the line item
    // with `amountEgp` visible; this is consistent with §8.14.2 which lists
    // every non-salary category as "All shareholders".
    const sanitizedExpenses = otherExpenses
      .map((exp) => sanitizeExpenseForViewer(exp, viewer!))
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // For salary-like categories: board members see individual lines; everyone
    // else sees aggregated totals only.
    const isBoard = viewer.isBoardMember || viewer.role === "board_member";
    const salaryLines = isBoard
      ? salaryLike
          .map((exp) => sanitizeExpenseForViewer(exp, viewer!))
          .filter((e): e is NonNullable<typeof e> => e !== null)
      : [];
    const aggregatedSalary = !isBoard
      ? aggregateExpensesByCategory(salaryLike)
      : [];

    return NextResponse.json({
      enterprise: { id: enterprise.id, name: enterprise.name, slug: enterprise.slug },
      expenses: [...salaryLines, ...sanitizedExpenses],
      aggregatedByCategory: aggregatedSalary,
      total: salaryLines.length + sanitizedExpenses.length,
    });
  } catch (error) {
    logger.error("Expense list fetch failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch expenses", code: "internal_error" },
      { status: 500 },
    );
  }
}

// POST /api/expenses — submit a new expense.
// CRE authority is enforced: <1% → manager-only, 1-10% → dual signature, >10% → board.
// The submitter may NOT self-approve (only the <1% solo path allows auto-approval,
// and only if the submitter's own role satisfies the CRE; otherwise the expense
// is held for a different approver).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.expenses(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, expenseSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, amountEgp, category, description, vendorName, receiptCid } = body;
  // The schema permits an optional vendorName + receiptCid; the Expense model
  // column is `vendor` (required, no default) + `receiptNote` (optional).
  const vendor = vendorName ?? "unspecified";

  // ── Idempotency (replay-safe POST for money-moving endpoint) ──
  // If the client sends an Idempotency-Key header, we replay the cached
  // response on retry. Without the header, the request is treated as a
  // normal non-idempotent POST (backward-compatible).
  const idemCtx = await getIdempotencyContext(req, user.id, body);
  if (idemCtx) {
    const cached = await checkIdempotency(idemCtx, "expenses");
    if (cached) return cached;
  }

  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found", code: "not_found" }, { status: 404 });
  }

  // ── CRE: enterprise must not be frozen ──
  const freeze = enforceNotFrozen(enterprise);
  if (!freeze.allowed) {
    await audit({
      actorId: user.id,
      action: "expense.submit",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: freeze.reason,
      metadata: { policy: freeze.policy },
    });
    return NextResponse.json(
      {
        error: freeze.reason ?? "Enterprise is frozen",
        code: "cre_denied",
        policy: freeze.policy,
        decisionToken: freeze.decisionToken,
      },
      { status: 400 }
    );
  }

  // The user must be a member of this enterprise.
  const userMemberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
  if (userMemberships.length === 0) {
    return NextResponse.json(
      { error: "Not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  // Try the CRE against each role the user holds in this enterprise; pick the most permissive.
  const capital = enterprise.totalEquityUnits * enterprise.equityUnitPriceEgp;
  const roles = userMemberships.map((m) => m.role);
  const verdicts = roles.map((r) => ({ role: r, verdict: enforceExpenseAuthority(amountEgp, capital, r) }));
  const winning = verdicts.find((v) => v.verdict.allowed) ?? verdicts[0];

  // Derive status from the capital percentage and the CRE requiredApproverRoles.
  const pct = (amountEgp / capital) * 100;
  const requiredApproverRoles = winning.verdict.requiredApproverRoles ?? [];

  // <1% expenses: auto-approve is allowed ONLY when the submitter's role is the
  // sole required approver (manager or founding_operator). Otherwise the
  // expense still needs an external signature — submitters can't self-approve.
  let status: string;
  let approver1Id: string | null = null;
  let approvedAt: Date | null = null;

  if (pct < 1 && winning.verdict.allowed && requiredApproverRoles.length === 1 && roles.includes(requiredApproverRoles[0])) {
    status = "approved";
    approver1Id = user.id;
    approvedAt = new Date();
  } else if (pct <= 10) {
    // 1–10% — DUAL SIGNATURE required.
    status = "dual_signature_pending";
  } else {
    // >10% — board approval required.
    status = "pending";
  }

  // For non-auto-approved expenses, the CRE verdict may still indicate a
  // single-role requirement the submitter doesn't satisfy. We don't reject
  // submission — we just queue it for the right approver. But if the winning
  // verdict explicitly disallows (e.g. role not permitted for the bracket),
  // reject at submit time so the user gets immediate feedback.
  if (
    status !== "approved" &&
    !winning.verdict.allowed &&
    // If at least one of the user's roles is in the required approver list, the
    // submission can still be queued for their own later signature or someone
    // else's — don't hard-reject.
    !roles.some((r) => requiredApproverRoles.includes(r))
  ) {
    await audit({
      actorId: user.id,
      action: "expense.submit",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: winning.verdict.reason ?? "expense_authority_rego",
      metadata: { policy: winning.verdict.policy, pct, roles },
    });
    return NextResponse.json(
      {
        error: winning.verdict.reason ?? "Expense denied by CRE",
        code: "cre_denied",
        decision: winning.verdict,
        policy: winning.verdict.policy,
      },
      { status: 400 }
    );
  }

  // ── Persist expense + ledger event inside ONE transaction ──
  const expense = await db.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        enterpriseId,
        category,
        description,
        vendor,
        amountEgp: Math.round(amountEgp),
        status,
        submittedById: user.id,
        receiptNote: receiptCid ?? null,
        aiRiskFlag: "none",
        approver1Id,
        approvedAt,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: status === "approved" ? "expense_approved" : "expense_submitted",
      payload: {
        expenseId: created.id,
        category,
        vendor,
        amount: created.amountEgp,
        capitalPct: Number(pct.toFixed(4)),
        status,
        decisionToken: winning.verdict.decisionToken,
        policy: winning.verdict.policy,
        approverRole: winning.role,
        requiredApproverRoles,
        selfApproved: status === "approved",
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "expense.submit",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      expenseId: expense.id,
      amountEgp: expense.amountEgp,
      status,
      pct: Number(pct.toFixed(4)),
    },
  });

  const responseBody = { ok: true, expense };
  const httpStatus = 200;
  if (idemCtx) {
    await storeIdempotency(idemCtx, "expenses", user.id, httpStatus, responseBody);
  }
  return NextResponse.json(responseBody, { status: httpStatus });
}

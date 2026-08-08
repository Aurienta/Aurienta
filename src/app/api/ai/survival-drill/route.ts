import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/survival-drill
 * Body: { enterpriseId }
 *
 * Runs a 7-day platform-outage simulation against a graduated enterprise's
 * self-hosted CRE. Returns pass/fail/warning + findings; persists a
 * SurvivalDrill record (certificateExpiry = now+1y if passed).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

    // Rate limit — AI bucket.
    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const enterpriseId: string = (body?.enterpriseId ?? "").toString();
    if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });

    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });

    const ent = await db.enterprise.findUnique({ where: { id: enterpriseId } });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });
    if (ent.stage !== "graduated") {
      return NextResponse.json(
        { error: "Survival drills are for graduated enterprises only" },
        { status: 400 }
      );
    }

    const ctx = await buildEnterpriseContext(enterpriseId);

    // The deterministic test battery — every drill runs the same 5 checks so
    // the pass/fail per test can be parsed out and rendered as a checklist.
    const tests = [
      {
        key: "cre_self_host",
        name: "Self-hosted CRE availability",
        detail: "Can the enterprise's self-hosted Constitutional Runtime Engine enforce Rego policies for 168 hours without the AURIENTA mothership?",
      },
      {
        key: "paper_ballot",
        name: "Paper-ballot governance",
        detail: "Can the board call, record, and ratify a vote using paper ballots + Ed25519 signatures while the platform is offline?",
      },
      {
        key: "offline_ledger",
        name: "Offline ledger reconciliation",
        detail: "Can the enterprise append ledger events locally and reconcile them into the canonical hash chain on platform restoration?",
      },
      {
        key: "emergency_board",
        name: "Emergency board protocol",
        detail: "Did the board follow the SEV1 runbook within 30 minutes of the simulated outage (page on-call, declare SEV1, activate read-only mode)?",
      },
      {
        key: "treasury_continuity",
        name: "Treasury continuity",
        detail: "Can the enterprise meet payroll + vendor obligations from its own treasury for 7 days without Law Firm Client Account access?",
      },
    ];

    const systemPrompt = `You are the AURIENTA Sovereign Survival Drill — a quarterly stress-test protocol that simulates a 7-day AURIENTA Constitutional Infrastructure outage against a graduated enterprise's self-hosted CRE.

You receive the enterprise's context and a fixed battery of 5 survival tests. For EACH test, you must return:
- A PASS / FAIL / WARNING verdict (deterministic, grounded in the enterprise's actual maturity).
- A one-sentence finding explaining the verdict (what was checked, what held or broke).

Then return an overall DRILL RESULT: PASSED (5/5 or 4/5 pass with no FAIL), WARNING (any single FAIL on a non-critical test), or FAILED (any FAIL on cre_self_host OR emergency_board OR 2+ FAILs).

OUTPUT FORMAT (strict — the UI parses this):
## Drill Result
**RESULT:** <PASSED | WARNING | FAILED>
**Duration:** 168 hours (7 days simulated)
**Tests passed:** <n>/5

## Test Findings
For each of the 5 tests, output a bullet of the exact form:
- **<Test name>** — **PASS** | **FAIL** | **WARNING**. <One-sentence finding grounded in the enterprise's actual numbers>.

## Recommendations
3 bullets — concrete next-quarter hardening actions, grounded in the verdict.

RULES:
- Be conservative: if a capability is uncertain, mark WARNING (not PASS).
- Never invent metrics. If a number is needed and missing, mark WARNING and note the gap.
- Reference constitutional concepts: self-hosted CRE, Ed25519 signatures, hash-chain reconciliation, Oracle Mirror protocol.
- Egyptian institutional voice: precise, dignified, no hype, no emojis.
- Length: 350–500 words.`;

    const userMessage = `Run the 7-day Sovereign Survival Drill now. Output ONLY the formatted response described above.`;

    // Enterprise context + financials + the 5 test definitions → UNTRUSTED-DATA
    // delimiters (enterprise name and financial figures are user-controlled).
    const userContext = `Enterprise context (from the immutable ledger + CRE):
${ctx}

Stage: ${ent.stage} (graduated — drill applies).
Sovereign Trust Score (Founding Operator): ${ent.healthScore}/100.
Health rating: ${ent.healthRating ?? "—"}.
Law Firm Client Account balance: ${ent.lawFirmClientAccountBalanceEgp} EGP (note: graduated enterprises keep their own treasury; the Law Firm Client Account balance has been released to the enterprise).
Monthly revenue: ${ent.monthlyRevenueEgp} EGP.
Monthly burn: ${ent.monthlyBurnEgp} EGP.
Employees: ${ent.employeeCount}.

The 5 survival tests you must report on (use these EXACT test names in your output bullets):
${tests.map((t, i) => `${i + 1}. ${t.name} — ${t.detail}`).join("\n")}`;

    const aiResult = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "survival_drill",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.82,
    });
    const content = aiResult.content;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.survival-drill",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: aiResult.fellBack, latencyMs: aiResult.latencyMs },
    });

    // Parse the result verdict out of the AI text (defensive — defaults to WARNING).
    const resultMatch = /\*\*RESULT:\*\*\s*(PASSED|WARNING|FAILED)/i.exec(content);
    const result = (resultMatch?.[1] ?? "WARNING").toUpperCase();

    // Parse per-test findings (also defensive — leaves empty if AI text differs).
    const findings = tests.map((t) => {
      const re = new RegExp(
        `\\*\\*${escapeRegex(t.name)}\\*\\*[^|]*\\|?\\s*\\*\\*(PASS|FAIL|WARNING)\\*\\*\\.?\\s*([^\\n]+)`,
        "i"
      );
      const m = re.exec(content);
      return {
        key: t.key,
        name: t.name,
        detail: t.detail,
        verdict: (m?.[2] ?? "WARNING").toUpperCase() as "PASS" | "FAIL" | "WARNING",
        finding: (m?.[3] ?? "Not detailed in AI response — review the full drill report.").trim(),
      };
    });

    const passedCount = findings.filter((f) => f.verdict === "PASS").length;
    const overallVerdict =
      result === "PASSED" && passedCount >= 4
        ? "passed"
        : result === "FAILED" || findings.some((f) => f.key === "cre_self_host" && f.verdict === "FAIL") || findings.some((f) => f.key === "emergency_board" && f.verdict === "FAIL") || passedCount <= 2
        ? "failed"
        : "warning";

    const certificateExpiry =
      overallVerdict === "passed"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : null;

    const drill = await db.survivalDrill.create({
      data: {
        enterpriseId,
        drillDate: new Date(),
        result: overallVerdict,
        durationHours: 168,
        findings: JSON.stringify(findings),
        certificateExpiry,
      },
    });

    await appendLedgerEvent(db, {
      enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "survival_drill",
        result: overallVerdict,
        drillId: drill.id,
        certificateExpiry: certificateExpiry?.toISOString() ?? null,
        passedTests: passedCount,
        totalTests: findings.length,
      },
      actorId: user.id,
    });

    return NextResponse.json({
      content,
      drill: {
        id: drill.id,
        result: overallVerdict,
        passedCount,
        totalCount: findings.length,
        certificateExpiry: certificateExpiry?.toISOString() ?? null,
        drillDate: drill.drillDate.toISOString(),
        findings,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[survival-drill] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

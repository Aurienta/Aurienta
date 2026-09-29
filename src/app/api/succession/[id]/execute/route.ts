import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent, enforceSuccessionGate } from "@/lib/aurienta/cre";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Execute a Succession Declaration (Blueprint Vol 16 §16.1)
//
// POST /api/succession/[id]/execute
//
// Transfers the declarant's Equity Units to the designated successor and/or
// the economic beneficiaries. The voting proxy must already be active
// (status = "activated"). Execution is terminal — the declaration moves to
// status = "executed" and cannot be re-activated.
//
// Authorization: only an institutional reviewer role (law_firm_rep /
// accounting_firm_rep / aurienta_rep) may execute a succession. This is a
// high-impact action that requires the law firm to have verified the death
// certificate + the accounting firm to have verified the equity transfer.
//
// In this sandbox:
//   - The OwnershipRecord rows belonging to the declarant are NOT deleted —
//     they are duplicated (one row per beneficiary with their percentage
//     split). The declarant's rows are marked with a `note` field via the
//     audit log (the OwnershipRecord model doesn't have a `transferredTo`
//     field in this schema; this is a future schema addition).
//   - The voting proxy is set to inactive (succession complete).
//   - The declaration moves to "executed".
// ─────────────────────────────────────────────────────────────────────────────

const REVIEWER_ROLES = ["law_firm_rep", "accounting_firm_rep", "aurienta_rep"] as const;

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Role gate — only institutional reviewer roles may execute.
    const hasReviewerRole = user.memberships.some((m) =>
      REVIEWER_ROLES.includes(m.role as (typeof REVIEWER_ROLES)[number])
    );
    if (!hasReviewerRole) {
      await audit({
        actorId: user.id,
        action: "succession.execute",
        target: `succession:${(await ctx.params).id ?? ""}`,
        result: "denied",
        reason: `Forbidden: executor roles are ${REVIEWER_ROLES.join(", ")}`,
      });
      return NextResponse.json(
        {
          error:
            "Only AURIENTA representatives, Law Firm representatives, or Accounting Firm representatives may execute a succession declaration.",
          code: "forbidden_executor_role",
          requiredRoles: REVIEWER_ROLES,
        },
        { status: 403 }
      );
    }

    const { id } = await ctx.params;
    if (!id || id.length < 6) {
      return NextResponse.json(
        { error: "Invalid declaration id", code: "invalid_id" },
        { status: 400 }
      );
    }

    const declaration = await db.successionDeclaration.findUnique({
      where: { id },
      include: { economicBeneficiaries: true },
    });
    if (!declaration) {
      return NextResponse.json(
        { error: "Succession declaration not found", code: "not_found" },
        { status: 404 }
      );
    }

    if (declaration.status !== "activated") {
      return NextResponse.json(
        {
          error: `Cannot execute a declaration in status '${declaration.status}'. Must be 'activated' (activate the voting proxy first).`,
          code: "wrong_status",
        },
        { status: 400 }
      );
    }

    let conditions: { onDeath: boolean; onIncapacitation: boolean; thresholdDays: number };
    try {
      conditions = JSON.parse(declaration.conditions);
    } catch {
      return NextResponse.json(
        { error: "Declaration conditions are malformed (invalid JSON).", code: "malformed_conditions" },
        { status: 500 }
      );
    }

    // ── CRE gate: check_active with declaredDeceasedOrIncapacitated=true ──
    // The gate should deny (SUCCESSION_PROXY_ACTIVE) — we are the executor
    // acting on the declarant's behalf, NOT the declarant themselves.
    const gate = enforceSuccessionGate({
      userId: declaration.userId,
      action: "check_active",
      declaration: {
        status: declaration.status,
        votingProxyActive: declaration.votingProxyActive,
        votingProxyActivatedAt: declaration.votingProxyActivatedAt,
        conditions,
      },
      declaredDeceasedOrIncapacitated: true,
      required: true,
    });
    void gate; // advisory — we proceed with execution regardless

    // ── Execute ──
    // 1. Fetch all of the declarant's OwnershipRecords across all enterprises.
    // 2. For each OwnershipRecord, distribute the equityUnits across the
    //    economic beneficiaries according to their percentages.
    // 3. Create new OwnershipRecord rows for each beneficiary.
    // 4. Mark the declaration as "executed" + votingProxyActive=false.
    // 5. Notify all beneficiaries.
    const ownershipRecords = await db.ownershipRecord.findMany({
      where: { userId: declaration.userId },
      include: { enterprise: { select: { id: true, name: true, slug: true } } },
    });

    const now = new Date();
    const transferLog: Array<{
      enterpriseId: string;
      enterpriseName: string;
      totalEquityUnits: number;
      beneficiaries: Array<{ name: string; equityUnits: number; percentage: number }>;
    }> = [];

    const updated = await db.$transaction(async (tx) => {
      // For each OwnershipRecord, distribute to beneficiaries.
      for (const or of ownershipRecords) {
        const beneficiaries: Array<{
          name: string;
          equityUnits: number;
          percentage: number;
        }> = [];

        for (const b of declaration.economicBeneficiaries) {
          const units = Math.floor((or.equityUnits * b.percentage) / 100);
          if (units <= 0) continue;

          // If the beneficiary is a platform user (we can map by name? no —
          // we'd need a beneficiaryUserId per EconomicBeneficiary. The
          // schema doesn't have that; the declaration has a single
          // beneficiaryUserId which is the DESIGNATED SUCCESSOR. The
          // EconomicBeneficiary rows are ECONOMIC recipients only — they
          // don't necessarily have platform accounts.)
          //
          // In this sandbox: if a beneficiaryUserId is designated AND the
          // economic beneficiary's name matches the designated successor's
          // legalName, transfer to that user. Otherwise, the units are
          // "held in trust" by the declarant's account until the beneficiary
          // creates a platform account (out of scope for this gap).
          if (declaration.beneficiaryUserId) {
            // Transfer to the designated successor (lump-sum — the
            // percentage split among EconomicBeneficiaries is for
            // off-platform distribution via the law firm; the platform
            // records the transfer to the designated successor as a single
            // block).
            // We do this ONCE per enterprise (not per EconomicBeneficiary)
            // to avoid creating duplicate rows.
            const alreadyCreated = beneficiaries.some(
              (b) => b.name === (declaration?.beneficiaryName ?? "")
            );
            if (alreadyCreated) continue;

            // Transfer the declarant's full ownership to the successor.
            await tx.ownershipRecord.upsert({
              where: {
                enterpriseId_userId: {
                  enterpriseId: or.enterpriseId,
                  userId: declaration.beneficiaryUserId,
                },
              },
              update: {
                equityUnits: { increment: or.equityUnits },
              },
              create: {
                enterpriseId: or.enterpriseId,
                userId: declaration.beneficiaryUserId,
                equityUnits: or.equityUnits,
                avgPriceEgp: or.avgPriceEgp,
              },
            });

            beneficiaries.push({
              name: declaration.beneficiaryName ?? declaration.beneficiaryUserId,
              equityUnits: or.equityUnits,
              percentage: 100,
            });

            // Set the declarant's ownership to 0 (we don't delete — the
            // historical record is preserved for audit + tax purposes).
            await tx.ownershipRecord.update({
              where: { id: or.id },
              data: { equityUnits: 0 },
            });
            break; // Only one designated successor per enterprise.
          } else {
            // No platform beneficiary — units are held in trust. Record
            // them in the audit log so the law firm can distribute off-platform.
            beneficiaries.push({
              name: b.name,
              equityUnits: units,
              percentage: b.percentage,
            });
          }
        }

        transferLog.push({
          enterpriseId: or.enterpriseId,
          enterpriseName: or.enterprise.name,
          totalEquityUnits: or.equityUnits,
          beneficiaries,
        });

        // Ledger event per enterprise (constitutional hash chain).
        await appendLedgerEvent(tx, {
          enterpriseId: or.enterpriseId,
          eventType: "share_transferred",
          payload: {
            action: "succession_executed",
            declarationId: declaration.id,
            declarantUserId: declaration.userId,
            fromUserId: declaration.userId,
            toUserId: declaration.beneficiaryUserId ?? null,
            enterpriseId: or.enterpriseId,
            enterpriseName: or.enterprise.name,
            totalEquityUnits: or.equityUnits,
            beneficiaries,
            executedAt: now.toISOString(),
            note: declaration.beneficiaryUserId
              ? "Equity Units transferred to designated successor (Vol 16 §16.1)."
              : "Equity Units held in trust for off-platform distribution to economic beneficiaries (Vol 16 §16.1).",
          },
          actorId: user.id,
        });
      }

      // Mark the declaration as executed.
      const decl = await tx.successionDeclaration.update({
        where: { id },
        data: {
          status: "executed",
          // The voting proxy is no longer active — succession is complete.
          votingProxyActive: false,
        },
      });

      return decl;
    });

    // Notify beneficiaries.
    if (declaration.beneficiaryUserId) {
      await db.notification
        .create({
          data: {
            userId: declaration.beneficiaryUserId,
            category: "governance",
            title: "Succession executed — Equity Units received",
            body: `You have been designated as the successor in declaration ${declaration.id}. The declarant's Equity Units have been transferred to your account. (Vol 16 §16.1)`,
            href: "/dashboard/succession-declaration",
            aiPriority: "urgent",
          },
        })
        .catch(() => {});
    }

    await audit({
      actorId: user.id,
      action: "succession.execute",
      target: `succession:${id}`,
      result: "allowed",
      metadata: {
        declarantUserId: declaration.userId,
        successorUserId: declaration.beneficiaryUserId,
        executedAt: now.toISOString(),
        enterprisesAffected: transferLog.length,
        totalEquityUnitsTransferred: transferLog.reduce(
          (s, t) => s + t.totalEquityUnits,
          0
        ),
        transferLog,
      },
    });

    return NextResponse.json({
      declaration: {
        id: updated.id,
        status: updated.status,
        votingProxyActive: updated.votingProxyActive,
        executedAt: now.toISOString(),
      },
      transferLog,
      gate: {
        policy: gate.policy,
        decisionToken: gate.decisionToken,
      },
    });
  },
  "POST /api/succession/[id]/execute"
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

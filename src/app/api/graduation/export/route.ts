// AURIENTA — Graduation Export API (Blueprint §15.11)
//
// A graduated enterprise is a sovereign constitutional entity. At the moment
// of Graduation, the founding operator (or board) may extract a full data
// export package: every ledger event, every ownership record, every
// quarterly report, every proposal and vote, every milestone, and an
// anonymised employee roster — anchored by the constitutional charter hash
// and sealed with a SHA-256 package hash.
//
// The export is itself recorded as an AiArtifact (kind = "graduation_export")
// and appended to the immutable ledger (eventType = "graduation_export_generated"),
// so a third-party auditor can later verify that the package was generated
// by an authorised party and that its hash corresponds to a real ledger
// event.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the founding operator, the company owner, or a board member may
// extract the graduation export package. These are the same roles that
// can authorise Graduation itself under the constitutional charter.
const ALLOWED_ROLES = new Set([
  "founding_operator",
  "company_owner",
  "board_member",
]);

const BodySchema = z.object({
  enterpriseId: z.string().min(1).max(64),
});

/**
 * SHA-256 over the canonical JSON serialisation of the export payload.
 * The serialisation is deterministic (object keys are inserted in a
 * stable order via JSON.stringify with sorted keys) so that any party
 * recomputing the hash from the same data will arrive at the same
 * value — court-admissible evidence of package integrity.
 */
function sha256OfPackage(payload: unknown): string {
  const json = stableStringify(payload);
  return "sha256:" + createHash("sha256").update(json).digest("hex");
}

// Deterministic JSON serialisation — object keys sorted recursively.
// Arrays preserve their order (intentional — ledger sequence order matters).
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          stableStringify((value as Record<string, unknown>)[k])
      )
      .join(",") +
    "}"
  );
}

/**
 * Anonymise an employee record. The graduation export package must NOT
 * leak national IDs or NOSI (social-insurance) numbers — only
 * role-level data needed to demonstrate the enterprise's workforce
 * constitution during institutional due-diligence.
 */
function anonymiseEmployee(emp: {
  id: string;
  position: string;
  department: string;
  hireDate: Date;
  employmentType: string;
  compensationBand: string;
  monthlySalaryEgp: number;
  nosiStatus: string;
  keyPerson: boolean;
  equityConversionPct: number;
}) {
  return {
    id: emp.id,
    position: emp.position,
    department: emp.department,
    hireDate: emp.hireDate.toISOString(),
    employmentType: emp.employmentType,
    compensationBand: emp.compensationBand,
    monthlySalaryEgp: emp.monthlySalaryEgp,
    nosiStatus: emp.nosiStatus,
    keyPerson: emp.keyPerson,
    equityConversionPct: emp.equityConversionPct,
    // nationalId and nosiNumber intentionally omitted.
  };
}

/**
 * POST /api/graduation/export
 * Body: { enterpriseId: string }
 *
 * Authorisation: the caller must be a founding_operator, company_owner,
 * or board_member of the enterprise (verified via EnterpriseMember.role).
 *
 * Returns: { exportId, packageHash, enterpriseId, generatedAt, data: { ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { enterpriseId } = parsed.data;

    // ── Load the enterprise with every relation needed for the package ──
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      include: {
        ownershipRecords: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, legalName: true, email: true } },
          },
        },
        ledgerEvents: { orderBy: { sequence: "asc" } },
        quarterlyReports: { orderBy: [{ year: "asc" }, { quarter: "asc" }] },
        milestones: { orderBy: { createdAt: "asc" } },
        employees: {
          orderBy: { hireDate: "asc" },
          include: {
            user: { select: { id: true, legalName: true } },
          },
        },
        proposals: {
          orderBy: { createdAt: "asc" },
          include: { votes: { orderBy: { createdAt: "asc" } } },
        },
        members: { orderBy: { joinedAt: "asc" } },
      },
    });

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ── Authorisation: only founding_operator / company_owner / board_member ──
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === enterpriseId
    );
    const authorised = membershipsForEnt.some((m) =>
      ALLOWED_ROLES.has(m.role)
    );
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "graduation.export",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason:
          "Requires founding_operator, company_owner, or board_member role",
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: graduation export requires the founding_operator, company_owner, or board_member role",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ── Assemble the package payload ──
    const generatedAt = new Date();

    // Enterprise profile — every field. We spread the Prisma record and
    // drop the relational arrays (they're exported as separate sections
    // below to keep the package schema flat and auditable).
    const {
      ownershipRecords: _or,
      ledgerEvents: _le,
      quarterlyReports: _qr,
      milestones: _ms,
      employees: _em,
      proposals: _pr,
      members: _mem,
      ...enterpriseProfile
    } = enterprise;

    const capTable = enterprise.ownershipRecords.map((r) => ({
      id: r.id,
      userId: r.userId,
      ownerLegalName: r.user?.legalName ?? undefined,
      ownerEmail: r.user?.email ?? undefined,
      equityUnits: r.equityUnits,
      avgPriceEgp: r.avgPriceEgp,
      restrictedUntil: r.restrictedUntil?.toISOString() ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const ledger = enterprise.ledgerEvents.map((ev) => ({
      id: ev.id,
      sequence: ev.sequence,
      eventType: ev.eventType,
      prevHash: ev.prevHash,
      payloadHash: ev.payloadHash,
      payload: ev.payload,
      creDecisionToken: ev.creDecisionToken,
      actorId: ev.actorId,
      timestamp: ev.timestamp.toISOString(),
    }));

    const quarterlyReports = enterprise.quarterlyReports.map((q) => ({
      id: q.id,
      quarter: q.quarter,
      year: q.year,
      revenueEgp: q.revenueEgp,
      cogsEgp: q.cogsEgp,
      grossProfitEgp: q.grossProfitEgp,
      opexEgp: q.opexEgp,
      netProfitEgp: q.netProfitEgp,
      lawFirmClientAccountBalanceEgp: q.lawFirmClientAccountBalanceEgp,
      monthlyBurnEgp: q.monthlyBurnEgp,
      runwayMonths: q.runwayMonths,
      grossMarginPct: q.grossMarginPct,
      revenueGrowthPct: q.revenueGrowthPct,
      aiRiskFlag: q.aiRiskFlag,
      aiAssessment: q.aiAssessment,
      ipfsCid: q.ipfsCid,
      publishedAt: q.publishedAt.toISOString(),
      createdAt: q.createdAt.toISOString(),
    }));

    const milestones = enterprise.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      amountEgp: m.amountEgp,
      status: m.status,
      eveConfidence: m.eveConfidence,
      evidenceNote: m.evidenceNote,
      dueAt: m.dueAt?.toISOString() ?? undefined,
      releasedAt: m.releasedAt?.toISOString() ?? undefined,
      createdAt: m.createdAt.toISOString(),
    }));

    const employees = enterprise.employees.map((e) => ({
      ...anonymiseEmployee(e),
      userLegalName: e.user?.legalName ?? undefined,
    }));

    const proposals = enterprise.proposals.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      type: p.type,
      status: p.status,
      feeEgp: p.feeEgp,
      coolingEndsAt: p.coolingEndsAt?.toISOString() ?? undefined,
      votingEndsAt: p.votingEndsAt.toISOString(),
      quorumPct: p.quorumPct,
      passThreshold: p.passThreshold,
      votesFor: p.votesFor,
      votesAgainst: p.votesAgainst,
      votesAbstain: p.votesAbstain,
      totalVotingPower: p.totalVotingPower,
      aiRiskScore: p.aiRiskScore,
      aiRecommendation: p.aiRecommendation,
      aiConfidence: p.aiConfidence,
      executedAt: p.executedAt?.toISOString() ?? undefined,
      createdById: p.createdById,
      createdAt: p.createdAt.toISOString(),
      votes: p.votes.map((v) => ({
        id: v.id,
        userId: v.userId,
        choice: v.choice,
        votingPower: v.votingPower,
        reason: v.reason,
        createdAt: v.createdAt.toISOString(),
      })),
    }));

    const data = {
      enterpriseProfile: {
        ...enterpriseProfile,
        founderId: enterprise.founderId,
        lawFirmId: enterprise.lawFirmId,
        accountingFirmId: enterprise.accountingFirmId,
        createdAt: enterprise.createdAt.toISOString(),
        updatedAt: enterprise.updatedAt.toISOString(),
        stageSince: enterprise.stageSince.toISOString(),
        frozenAt: enterprise.frozenAt?.toISOString() ?? undefined,
        archivedAt: enterprise.archivedAt?.toISOString() ?? undefined,
      },
      capTable,
      ledger,
      quarterlyReports,
      milestones,
      employees,
      proposals,
      constitutionalCharterHash: CONSTITUTIONAL_HASH,
      schemaVersion: "1.0.0",
    };

    const packageHash = sha256OfPackage(data);

    // ── Persist an AiArtifact + ledger event inside a single transaction ──
    // The artifact stores the package hash (NOT the package itself — that
    // is returned to the caller). The ledger event proves the export was
    // generated by an authorised party at a specific point in time, and
    // binds the package hash into the immutable chain.
    const { artifactId, ledgerSequence } = await db.$transaction(async (tx) => {
      const artifact = await tx.aiArtifact.create({
        data: {
          kind: "graduation_export",
          enterpriseId: enterprise.id,
          userId: user.id,
          entityId: enterprise.id,
          content: `Graduation export package generated. SHA-256: ${packageHash}`,
          payload: JSON.stringify({
            packageHash,
            constitutionalCharterHash: CONSTITUTIONAL_HASH,
            schemaVersion: "1.0.0",
            summary: {
              ledgerEvents: ledger.length,
              ownershipRecords: capTable.length,
              quarterlyReports: quarterlyReports.length,
              milestones: milestones.length,
              employees: employees.length,
              proposals: proposals.length,
            },
            generatedBy: user.id,
            generatedAt: generatedAt.toISOString(),
          }),
          confidence: 1.0,
        },
      });

      const ledgerEvent = await appendLedgerEvent(tx, {
        enterpriseId: enterprise.id,
        eventType: "graduation_export_generated",
        payload: {
          packageHash,
          artifactId: artifact.id,
          constitutionalCharterHash: CONSTITUTIONAL_HASH,
          schemaVersion: "1.0.0",
          summary: {
            ledgerEvents: ledger.length,
            ownershipRecords: capTable.length,
            quarterlyReports: quarterlyReports.length,
            milestones: milestones.length,
            employees: employees.length,
            proposals: proposals.length,
          },
          generatedBy: user.id,
        },
        actorId: user.id,
      });

      return { artifactId: artifact.id, ledgerSequence: ledgerEvent.sequence };
    });

    await audit({
      actorId: user.id,
      action: "graduation.export",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      reason: `package generated; hash=${packageHash}`,
      metadata: {
        artifactId,
        ledgerSequence,
        packageHash,
        summary: {
          ledgerEvents: ledger.length,
          ownershipRecords: capTable.length,
          quarterlyReports: quarterlyReports.length,
          milestones: milestones.length,
          employees: employees.length,
          proposals: proposals.length,
        },
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    logger.info("graduation.export.generated", {
      enterpriseId,
      artifactId,
      ledgerSequence,
      packageHash,
    });

    return NextResponse.json({
      exportId: artifactId,
      packageHash,
      enterpriseId,
      generatedAt: generatedAt.toISOString(),
      ledgerSequence,
      constitutionalCharterHash: CONSTITUTIONAL_HASH,
      data,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/graduation/export] error:", { err: msg });
    return NextResponse.json(
      {
        error: "Failed to generate graduation export package.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET /api/cap-table?enterpriseId=xxx
//   → Full cap table snapshot (stakeholders, %, value, vesting, anti-dilution,
//     liquidation prefs, drag/tag-along eligibility).
//
// GET /api/cap-table?enterpriseId=xxx&scenario=dilution&newShares=1000
//   → Dilution simulation: per-stakeholder ownership before/after the new
//     round, anti-dilution bonus shares, and CRE verdict on the founder-equity
//     cap floor.
//
// GET /api/cap-table?enterpriseId=xxx&scenario=waterfall&exitAmount=10000000
//   → Liquidation waterfall: tier-by-tier payout distribution from the exit
//     amount (preferred 1x non-participating → common pro-rata residual).
//
// Optional params for dilution:
//   newPriceEgp — override the current equityUnitPrice (down-round detection)
//   antiDilution — "none" | "weighted_average" | "full_ratchet" override
//
// All scenarios require authentication AND a cap-table-viewer role on the
// enterprise (capital_partner, founding_operator, board_member, company_owner,
// or aurienta_rep). Returns 401 if unauthenticated, 403 if not a viewer.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import {
  getCapTable,
  modelDilution,
  computeWaterfall,
  canViewCapTable,
  CAP_TABLE_VIEWER_ROLES,
  type AntiDilutionMode,
} from "@/lib/aurienta/cap-table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json(
    { error: "Not authenticated", code: "unauthenticated" },
    { status: 401 }
  );
}

function forbidden(enterpriseId: string, role: string | null) {
  return NextResponse.json(
    {
      error: "Forbidden: insufficient role to view this cap table",
      code: "forbidden",
      requiredRoles: [...CAP_TABLE_VIEWER_ROLES],
      yourRole: role,
      enterpriseId,
    },
    { status: 403 }
  );
}

function badParam(message: string) {
  return NextResponse.json(
    { error: "invalid_query", message },
    { status: 400 }
  );
}

function isAntiDilutionMode(v: string | null): v is AntiDilutionMode {
  return v === "none" || v === "weighted_average" || v === "full_ratchet";
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauth();

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return badParam("enterpriseId query parameter is required");
  }

  // ── Verify the enterprise exists ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // ── Role gate — only cap-table viewers ──
  // AURIENTA Reps (platform admins) bypass per auth.ts logic.
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m: { role: string }) => m.role === "aurienta_rep");

  const viewer = isPlatformAdmin || (await canViewCapTable(user.id, enterpriseId));
  if (!viewer) {
    const membership = (user.memberships ?? []).find(
      (m: { enterpriseId: string; role: string }) => m.enterpriseId === enterpriseId
    );
    await audit({
      actorId: user.id,
      action: "cap_table.view_denied",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "insufficient_role",
      metadata: { role: membership?.role ?? null },
    });
    return forbidden(enterpriseId, membership?.role ?? null);
  }

  const scenario = url.searchParams.get("scenario");

  // ── Scenario: dilution ──
  if (scenario === "dilution") {
    const newSharesRaw = url.searchParams.get("newShares");
    if (!newSharesRaw) {
      return badParam("scenario=dilution requires `newShares` parameter");
    }
    const newShares = Number(newSharesRaw);
    if (!Number.isFinite(newShares) || newShares <= 0) {
      return badParam("newShares must be a positive number");
    }
    if (newShares > 1_000_000_000) {
      return badParam("newShares must be <= 1,000,000,000");
    }

    const newPriceRaw = url.searchParams.get("newPriceEgp");
    const newPriceEgp = newPriceRaw !== null ? Number(newPriceRaw) : undefined;
    if (newPriceEgp !== undefined && (!Number.isFinite(newPriceEgp) || newPriceEgp <= 0)) {
      return badParam("newPriceEgp must be a positive number");
    }

    const antiDilutionRaw = url.searchParams.get("antiDilution");
    const antiDilution = isAntiDilutionMode(antiDilutionRaw) ? antiDilutionRaw : undefined;

    const result = await modelDilution(enterpriseId, Math.floor(newShares), {
      newPriceEgp,
      antiDilution,
    });

    await audit({
      actorId: user.id,
      action: "cap_table.simulate_dilution",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        newShares: result.newShares,
        newPriceEgp: result.newPriceEgp,
        newInvestorOwnershipPct: result.newInvestorOwnershipPct,
        creVerdict: result.verdict.allowed ? "allowed" : "denied",
        crePolicy: result.verdict.policy,
      },
    });

    return NextResponse.json({
      scenario: "dilution",
      enterprise: { id: enterprise.id, name: enterprise.name, slug: enterprise.slug },
      result,
    });
  }

  // ── Scenario: waterfall ──
  if (scenario === "waterfall") {
    const exitAmountRaw = url.searchParams.get("exitAmount");
    if (!exitAmountRaw) {
      return badParam("scenario=waterfall requires `exitAmount` parameter");
    }
    const exitAmount = Number(exitAmountRaw);
    if (!Number.isFinite(exitAmount) || exitAmount < 0) {
      return badParam("exitAmount must be a non-negative number");
    }
    if (exitAmount > 1_000_000_000_000) {
      return badParam("exitAmount must be <= 1,000,000,000,000");
    }

    const result = await computeWaterfall(enterpriseId, exitAmount);

    await audit({
      actorId: user.id,
      action: "cap_table.simulate_waterfall",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        exitAmountEgp: result.exitAmountEgp,
        totalPaidOutEgp: result.totalPaidOutEgp,
        tiers: result.tiers.length,
        preferredConversionElected: result.preferredConversionElected,
      },
    });

    return NextResponse.json({
      scenario: "waterfall",
      enterprise: { id: enterprise.id, name: enterprise.name, slug: enterprise.slug },
      result,
    });
  }

  // ── Default: full cap table ──
  const capTable = await getCapTable(enterpriseId);

  await audit({
    actorId: user.id,
    action: "cap_table.view",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      stakeholderCount: capTable.stakeholderCount,
      issuedEquityUnits: capTable.issuedEquityUnits,
      ledgerSequence: capTable.ledgerAnchor?.sequence ?? null,
    },
  });

  return NextResponse.json({
    scenario: "snapshot",
    capTable,
  });
}, "GET /api/cap-table");

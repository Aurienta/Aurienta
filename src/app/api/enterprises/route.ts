import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { TIER_META } from "@/lib/aurienta/constants";
import { appendLedgerEvent, enforceFounderEquityCap } from "@/lib/aurienta/cre";

// Tier → maximum raise cap (EGP). "Unlimited" = no cap.
const TIER_MAX_RAISE: Record<string, number | null> = {
  A: 3_000_000,
  B: 25_000_000,
  C: null,
  D: null,
  E: 5_000_000,
  F: null,
};

// Parse the founderEquity string ("5% + 5%", "10% + 25% vest", "0%", "Owner ≥51%", "By bylaws")
// → the founder's initial equity percentage (the first numeric percent).
function parseFounderEquity(raw: string): number {
  const m = raw.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return parseFloat(m[1]);
}

// Parse the fee string ("5% + 2.5%", "1%") → [platformFeePct, consultingFeePct].
function parseFees(raw: string): [number, number] {
  const nums = raw.match(/(\d+(?:\.\d+)?)/g)?.map(parseFloat) ?? [];
  if (nums.length === 0) return [0, 0];
  if (nums.length === 1) return [nums[0], 0];
  return [nums[0], nums[1]];
}

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = toKebab(name) || "enterprise";
  const existing = await db.enterprise.findUnique({ where: { slug: base } });
  if (!existing) return base;
  // Append a short hash for uniqueness.
  const suffix = createHash("sha1")
    .update(`${name}-${Date.now()}`)
    .digest("hex")
    .slice(0, 6);
  return `${base}-${suffix}`;
}

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
    const {
      name,
      tagline,
      description,
      sector,
      tier,
      fundraisingGoalEgp,
      equityUnitPriceEgp,
      investorCap,
    } = body ?? {};

    // ── Validate required fields ──
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Enterprise name must be at least 3 characters.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }
    if (!description || typeof description !== "string" || description.trim().length < 12) {
      return NextResponse.json(
        { error: "Description must be at least 12 characters.", code: "INVALID_DESCRIPTION" },
        { status: 400 }
      );
    }
    if (!sector) {
      return NextResponse.json(
        { error: "Sector is required.", code: "INVALID_SECTOR" },
        { status: 400 }
      );
    }
    if (!tier || !TIER_META[tier]) {
      return NextResponse.json(
        { error: "Tier must be one of A, B, C, D, E, F.", code: "INVALID_TIER" },
        { status: 400 }
      );
    }

    const goal = Number(fundraisingGoalEgp);
    const price = Number(equityUnitPriceEgp) || 50;
    if (!Number.isFinite(goal) || goal < 1000) {
      return NextResponse.json(
        { error: "Capital Formation goal must be at least 1,000 EGP.", code: "INVALID_GOAL" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price < 1) {
      return NextResponse.json(
        { error: "Equity Unit price must be at least 1 EGP.", code: "INVALID_PRICE" },
        { status: 400 }
      );
    }

    // Tier max-raise cap.
    const cap = TIER_MAX_RAISE[tier];
    if (cap !== null && cap !== undefined && goal > cap) {
      return NextResponse.json(
        {
          error: `Tier ${tier} enterprises may form capital up to ${cap.toLocaleString()} EGP.`,
          code: "TIER_CAP_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Capital Partner cap (optional)
    let investorCapValue: number | null = null;
    if (investorCap !== undefined && investorCap !== null && investorCap !== "") {
      const ic = Number(investorCap);
      if (!Number.isFinite(ic) || ic < 1) {
        return NextResponse.json(
          { error: "Capital Partner cap must be a positive integer.", code: "INVALID_CAPITAL_PARTNER_CAP" },
          { status: 400 }
        );
      }
      investorCapValue = Math.floor(ic);
    }

    // ── Compute derived fields ──
    const totalEquityUnits = Math.floor(goal / price);
    if (totalEquityUnits < 1) {
      return NextResponse.json(
        { error: "Equity Unit price cannot exceed the Capital Formation goal.", code: "INVALID_SHARE_PRICE" },
        { status: 400 }
      );
    }

    const founderEquityPct = parseFounderEquity(TIER_META[tier].founderEquity);
    const [platformFeePct, consultingFeePct] = parseFees(TIER_META[tier].fee);
    const founderShares = Math.floor((totalEquityUnits * founderEquityPct) / 100);
    const slug = await generateUniqueSlug(name);

    // ── CRE: Founder Equity Cap enforcement (Blueprint §4.1) ──
    // Verifies the Founding Operator equity meets the tier-specific floor
    // (A/B: ≥5%, C: ≥10%, D: owner ≥51%, E: 0%, F: by bylaws).
    const equityCheck = enforceFounderEquityCap({
      tier,
      founderEquityPct,
      proposedFounderEquityPct: founderEquityPct,
    });
    if (!equityCheck.allowed) {
      return NextResponse.json(
        { error: equityCheck.reason ?? "Founder equity cap violation", code: "CRE_FOUNDER_EQUITY_CAP" },
        { status: 400 }
      );
    }

    // ── Pick service providers (first available active) ──
    const lawFirm = await db.lawFirm.findFirst({ where: { status: "active" } });
    const accountingFirm = await db.accountingFirm.findFirst({ where: { status: "active" } });

    // ── Create the enterprise + founder membership + shareholding in a transaction ──
    const enterprise = await db.$transaction(async (tx) => {
      const ent = await tx.enterprise.create({
        data: {
          slug,
          name: name.trim(),
          tagline: tagline?.trim() || null,
          description: description.trim(),
          sector,
          tier,
          stage: "stage_1",
          legalForm: TIER_META[tier].legalForm,
          healthRating: "BB",
          healthScore: 70,
          fundraisingGoalEgp: Math.floor(goal),
          raisedEgp: founderShares * price, // Founding Operator's seed contribution
          minParticipationEgp: tier === "D" ? 50_000 : tier === "F" ? 1 : 50,
          investorCap: investorCapValue,
          equityUnitPriceEgp: Math.floor(price),
          totalEquityUnits,
          founderEquityPct,
          platformFeePct,
          consultingFeePct,
          consultingOptOut: false,
          monthlyRevenueEgp: 0,
          monthlyBurnEgp: 0,
          lawFirmClientAccountBalanceEgp: founderShares * price,
          grossMarginPct: 30,
          revenueGrowthPct: 0,
          employeeCount: 1,
          nosiCompliantPct: 100,
          policeClearanceValid: true,
          status: "draft",
          graduationReadiness: 0,
          founderId: user.id,
          lawFirmId: lawFirm?.id ?? null,
          accountingFirmId: accountingFirm?.id ?? null,
        },
      });

      // Founding operator membership + board seat.
      await tx.enterpriseMember.create({
        data: {
          enterpriseId: ent.id,
          userId: user.id,
          role: "founding_operator",
          boardSeat: true,
        },
      });

      // Founder shareholding (if tier grants founder equity).
      if (founderShares > 0) {
        await tx.ownershipRecord.create({
          data: {
            enterpriseId: ent.id,
            userId: user.id,
            equityUnits: founderShares,
            avgPriceEgp: price,
          },
        });
      }

      return ent;
    });

    // ── Append the share_issued ledger event ──
    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: enterprise.id,
        eventType: "share_issued",
        payload: {
          userId: user.id,
          equityUnits: founderShares,
          price,
          reason: "Founder seed equity at constitutional formation",
          tier,
          founderEquityPct,
        },
        actorId: user.id,
      });
    });

    return NextResponse.json(
      {
        ok: true,
        enterprise: {
          id: enterprise.id,
          slug: enterprise.slug,
          name: enterprise.name,
          tier: enterprise.tier,
          totalEquityUnits: enterprise.totalEquityUnits,
          equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
          founderEquityPct: enterprise.founderEquityPct,
          founderShares,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("[POST /api/enterprises] error:", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "Failed to constitute enterprise.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET — list enterprises (handy for debugging).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const enterprises = await db.enterprise.findMany({
    where: { founderId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ enterprises });
}

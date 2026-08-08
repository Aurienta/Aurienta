import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { riskDisclosureSchema, parseBody } from "@/lib/aurienta/validation";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRESS_PCT: Record<string, number> = {
  conservative: 35,
  balanced: 55,
  aggressive: 75,
  founder_aligned: 90,
};

/**
 * POST /api/risk-disclosure
 * Body: { enterpriseId, amountEgp, riskProfile, stressScenario? }
 * Creates a 72-hour cooling-off disclosure with a stress-loss estimate.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await parseBody(req, riskDisclosureSchema);
    if (body instanceof NextResponse) return body;

    const stressPct = STRESS_PCT[body.riskProfile] ?? 55;
    const stressLoss = Math.round((body.amountEgp * stressPct) / 100);
    const coolingEndsAt = new Date(Date.now() + 72 * 3600 * 1000);
    const stressScenario =
      body.stressScenario ??
      `${stressPct}% drawdown scenario for ${body.riskProfile} Capital Partner`;

    const disclosure = await db.riskDisclosure.create({
      data: {
        userId: user.id,
        enterpriseId: body.enterpriseId,
        amountEgp: body.amountEgp,
        riskProfile: body.riskProfile,
        stressLossEstimateEgp: stressLoss,
        stressScenario,
        coolingEndsAt,
        acknowledged: false,
      },
    });

    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: body.enterpriseId,
        eventType: "risk_disclosure_generated",
        payload: {
          disclosureId: disclosure.id,
          amountEgp: body.amountEgp,
          riskProfile: body.riskProfile,
          stressLoss,
          coolingEndsAt: coolingEndsAt.toISOString(),
          actorId: user.id,
        },
        actorId: user.id,
      });
    });

    logger.info("risk disclosure generated", {
      userId: user.id,
      enterpriseId: body.enterpriseId,
      amountEgp: body.amountEgp,
      stressLoss,
    });

    return NextResponse.json({
      ok: true,
      disclosureId: disclosure.id,
      coolingEndsAt: coolingEndsAt.toISOString(),
      stressLossEstimateEgp: stressLoss,
    });
  } catch (e) {
    logger.error("risk-disclosure POST failed", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/**
 * PATCH /api/risk-disclosure
 * Body: { id, acknowledge: true }
 * Acknowledges a disclosure after the cooling-off period ends.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id, acknowledge } = body as { id?: string; acknowledge?: boolean };
    if (!id || acknowledge !== true) {
      return NextResponse.json({ error: "id + acknowledge:true required" }, { status: 400 });
    }

    const disclosure = await db.riskDisclosure.findUnique({ where: { id } });
    if (!disclosure || disclosure.userId !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (new Date(disclosure.coolingEndsAt).getTime() > Date.now()) {
      return NextResponse.json(
        { error: "cooling_off_active", message: "72h cooling-off has not ended yet." },
        { status: 409 }
      );
    }

    const updated = await db.riskDisclosure.update({
      where: { id },
      data: { acknowledged: true },
    });

    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: disclosure.enterpriseId,
        eventType: "risk_disclosure_acknowledged",
        payload: { disclosureId: id, amountEgp: disclosure.amountEgp, actorId: user.id },
        actorId: user.id,
      });
    });

    return NextResponse.json({ ok: true, acknowledged: true });
  } catch (e) {
    logger.error("risk-disclosure PATCH failed", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

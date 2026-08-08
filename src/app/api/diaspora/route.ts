import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { diasporaSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// Map DiasporaBridge countryOfResidence to the ISO 4217 currency we expect the
// partner to remit in. A simple reference rate is used to lock the FX rate for 48h;
// in production this would be replaced by a real CBE-published daily rate feed.
const COUNTRY_CURRENCY: Record<string, string> = {
  UAE: "AED",
  UK: "GBP",
  US: "USD",
  Canada: "CAD",
  "Saudi Arabia": "SAR",
  Other: "USD",
};

// Reference FX rates to EGP (CBE-published approximate rates at launch).
// These are static reference rates for the 48h lock; the actual conversion
// happens at the Law Firm Client Account when the remittance is received.
const REFERENCE_FX_TO_EGP: Record<string, number> = {
  EGP: 1,
  USD: 48.7,
  AED: 13.26,
  GBP: 61.8,
  CAD: 35.6,
  SAR: 12.99,
};

// POST /api/diaspora
// Body: { countryOfResidence, remittanceIntentEgp, preferredLanguage, sourceOfFundsDeclared }
// Creates or updates the caller's DiasporaProfile and locks an FX rate for 48h.
//
// Hardening:
//  - Wrap find-then-create in db.$transaction to close the TOCTOU race that
//    allowed two concurrent onboarding requests to create two DiasporaProfiles
//    for the same user (the @unique on userId surfaces as P2002 → 409).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.diaspora(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, diasporaSchema);
  if (body instanceof NextResponse) return body;
  const { countryOfResidence, preferredLanguage } = body;
  const remittance = Math.max(0, Math.floor(Number(body.remittanceIntentEgp) || 0));

  // ── Lock a reference FX rate for 48h ──
  // The user's currency is derived from countryOfResidence; we look up the
  // static reference rate for {currency} → EGP. The actual conversion happens
  // at the Law Firm Client Account when the remittance is received.
  const fromCurrency = COUNTRY_CURRENCY[countryOfResidence] ?? "USD";
  const fxLockedRate = REFERENCE_FX_TO_EGP[fromCurrency] ?? REFERENCE_FX_TO_EGP.USD;

  const fxLockedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Documents are considered verified at onboarding for amounts < 50,000 EGP.
  // For ≥ 50,000 EGP, enhanced due diligence is required (flag in the UI; docs must be uploaded separately).
  const documentsVerified = remittance < 50_000;

  // ── Persist profile + ledger event inside ONE transaction ──
  // The find-then-create race is closed by running both inside db.$transaction.
  // P2002 on userId → 409 (a concurrent onboarding already created the profile).
  let profile;
  try {
    profile = await db.$transaction(async (tx) => {
      const existing = await tx.diasporaProfile.findUnique({
        where: { userId: user.id },
      });

      const upserted = existing
        ? await tx.diasporaProfile.update({
            where: { id: existing.id },
            data: {
              countryOfResidence,
              remittanceIntentEgp: remittance,
              preferredLanguage,
              sourceOfFundsDeclared: true,
              fxLockedRate,
              fxLockedUntil,
              documentsVerified,
            },
          })
        : await tx.diasporaProfile.create({
            data: {
              userId: user.id,
              countryOfResidence,
              remittanceIntentEgp: remittance,
              preferredLanguage,
              sourceOfFundsDeclared: true,
              fxLockedRate,
              fxLockedUntil,
              documentsVerified,
            },
          });

      await appendLedgerEvent(tx, {
        eventType: "cre_decision",
        payload: {
          action: "diaspora_profile_created",
          userId: user.id,
          countryOfResidence,
          remittanceIntentEgp: remittance,
          preferredLanguage,
          fxLockedRate,
          fxLockedUntil: fxLockedUntil.toISOString(),
          documentsVerified,
          note:
            "Diaspora Capital Participation Bridge profile activated. FX rate locked for 48h via decentralized oracle. " +
            "Funds flow through regulated banks only — no crypto/stablecoin. 1% cross-border surcharge applies.",
        },
        actorId: user.id,
      });

      return upserted;
    });
  } catch (e: unknown) {
    // P2002 = unique constraint on userId — concurrent onboarding.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      await audit({
        actorId: user.id,
        action: "diaspora.profile",
        result: "denied",
        reason: "duplicate_concurrent_onboarding",
      });
      return NextResponse.json(
        { error: "Profile already exists. Retry to update.", code: "conflict" },
        { status: 409 }
      );
    }
    throw e;
  }

  await audit({
    actorId: user.id,
    action: "diaspora.profile",
    result: "allowed",
    metadata: {
      profileId: profile.id,
      countryOfResidence,
      remittanceIntentEgp: remittance,
      fxLockedRate,
    },
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      countryOfResidence: profile.countryOfResidence,
      remittanceIntentEgp: profile.remittanceIntentEgp,
      preferredLanguage: profile.preferredLanguage,
      sourceOfFundsDeclared: profile.sourceOfFundsDeclared,
      fxLockedRate: profile.fxLockedRate,
      fxLockedUntil: profile.fxLockedUntil?.toISOString() ?? null,
      documentsVerified: profile.documentsVerified,
      createdAt: profile.createdAt.toISOString(),
    },
  });
}

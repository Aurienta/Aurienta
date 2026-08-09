// AURIENTA Terms Acceptance API
// Records and retrieves the user's acceptance of the Platform Terms,
// Constitutional Participation Agreement & Legal Disclaimer (§31).
//
// This is NOT a qualified electronic signature under Law 15/2004.
// It is a simple electronic acceptance. Where a qualified e-signature
// is legally required, a separate workflow is used.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  LEGAL_DISCLAIMER_VERSION,
  LEGAL_DISCLAIMER_EN,
  LEGAL_DISCLAIMER_AR,
  AFFIRMATION_TEXT_EN,
  AFFIRMATION_TEXT_AR,
  computeDisclaimerHash,
} from "@/lib/aurienta/legal-disclaimer";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string | undefined {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return undefined;
}

// GET /api/terms/acceptance — Check if the current user has accepted the terms
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ accepted: false, authenticated: false });
  }

  const acceptance = await db.termsAcceptance.findFirst({
    where: {
      userId: user.id,
      documentType: "platform_terms",
      documentVersion: LEGAL_DISCLAIMER_VERSION,
    },
    orderBy: { acceptedAt: "desc" },
  });

  return NextResponse.json({
    accepted: !!acceptance,
    authenticated: true,
    acceptance: acceptance
      ? {
          acceptedAt: acceptance.acceptedAt,
          documentVersion: acceptance.documentVersion,
          documentHash: acceptance.documentHash.slice(0, 16) + "...",
          acceptanceType: acceptance.acceptanceType,
        }
      : null,
    currentVersion: LEGAL_DISCLAIMER_VERSION,
  });
}

// POST /api/terms/acceptance — Record the user's acceptance
const acceptSchema = z.object({
  documentVersion: z.string().min(1).max(20),
  language: z.enum(["en", "ar"]).default("en"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { documentVersion, language } = parsed.data;

  // Verify the version matches the current disclaimer
  if (documentVersion !== LEGAL_DISCLAIMER_VERSION) {
    return NextResponse.json(
      {
        error: "Version mismatch",
        message: `Expected version ${LEGAL_DISCLAIMER_VERSION}, received ${documentVersion}`,
      },
      { status: 400 }
    );
  }

  // Compute the hash of the exact text the user accepted
  const disclaimerText = language === "ar" ? LEGAL_DISCLAIMER_AR : LEGAL_DISCLAIMER_EN;
  const documentHash = computeDisclaimerHash(disclaimerText);
  const affirmationText = language === "ar" ? AFFIRMATION_TEXT_AR : AFFIRMATION_TEXT_EN;

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Check if already accepted this version
  const existing = await db.termsAcceptance.findFirst({
    where: {
      userId: user.id,
      documentType: "platform_terms",
      documentVersion,
    },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyAccepted: true,
      acceptance: {
        acceptedAt: existing.acceptedAt,
        documentVersion: existing.documentVersion,
        acceptanceType: existing.acceptanceType,
      },
    });
  }

  // Record the acceptance (§31 evidentiary package)
  const acceptance = await db.termsAcceptance.create({
    data: {
      userId: user.id,
      documentType: "platform_terms",
      documentVersion,
      documentHash,
      ipAddress: ip,
      userAgent,
      acceptanceType: "core_terms",
      affirmationText,
      preSelected: false, // §34 — checkbox must not be pre-selected
    },
  });

  await audit({
    actorId: user.id,
    action: "terms.accepted",
    target: `platform_terms:${documentVersion}`,
    result: "allowed",
    metadata: {
      documentVersion,
      language,
      documentHash: documentHash.slice(0, 16) + "...",
      acceptanceId: acceptance.id,
    },
    ip,
    userAgent,
  });

  logger.info("terms.accepted", {
    userId: user.id,
    documentVersion,
    language,
    acceptanceId: acceptance.id,
  });

  return NextResponse.json({
    ok: true,
    acceptance: {
      id: acceptance.id,
      acceptedAt: acceptance.acceptedAt,
      documentVersion: acceptance.documentVersion,
      acceptanceType: acceptance.acceptanceType,
    },
  });
}

// AURIENTA Egyptian Legal Clauses Acceptance API
// Records acceptance of Egyptian-law-specific legal clauses.
//
// Each acceptance creates a TermsAcceptance record with:
//   - documentType: "eg_legal_<category>"
//   - documentVersion: clauseId
//   - documentHash: SHA-256 of the clause text
//   - affirmationText: the exact clause text
//   - preSelected: false (per Consumer Protection Law Art. 6)
//
// Legal basis: Law 15/2004 (E-Signature), Law 151/2020 (PDPL),
// Law 67/2006 (Consumer Protection), Law 80/2002 (AML).

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { ALL_EGYPTIAN_LEGAL_CLAUSES } from "@/lib/aurienta/egyptian-legal-clauses";
import { z } from "zod";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string | undefined {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return undefined;
}

const acceptSchema = z.object({
  clauseIds: z.array(z.string()).min(1),
});

// POST /api/legal/egyptian-clauses/accept — Record acceptance of clauses
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { clauseIds } = parsed.data;
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Find the clauses being accepted
  const clauses = ALL_EGYPTIAN_LEGAL_CLAUSES.filter((c) => clauseIds.includes(c.clauseId));
  if (clauses.length !== clauseIds.length) {
    return NextResponse.json(
      { error: "unknown_clause_id", message: "One or more clause IDs not found" },
      { status: 400 }
    );
  }

  // Create a TermsAcceptance record for each clause
  const records = [];
  for (const clause of clauses) {
    const hash = createHash("sha256").update(clause.text).digest("hex");
    try {
      const record = await db.termsAcceptance.create({
        data: {
          userId: user.id,
          documentType: `eg_legal_${clause.category}`,
          documentVersion: clause.clauseId,
          documentHash: hash,
          ipAddress: ip,
          userAgent,
          acceptanceType: "core_terms",
          affirmationText: clause.text,
          preSelected: false, // Per Consumer Protection Law Art. 6
        },
      });
      records.push(record);
    } catch (e: any) {
      logger.error("Failed to record clause acceptance", {
        userId: user.id,
        clauseId: clause.clauseId,
        error: e.message,
      });
    }
  }

  await audit({
    userId: user.id,
    action: "egyptian_legal_clauses_accepted",
    resource: "legal",
    resourceId: clauseIds.join(","),
    metadata: { count: records.length, clauseIds },
    ip,
  });

  logger.info("Egyptian legal clauses accepted", {
    userId: user.id,
    count: records.length,
    clauseIds,
  });

  return NextResponse.json({
    accepted: true,
    count: records.length,
    clauseIds,
  });
});

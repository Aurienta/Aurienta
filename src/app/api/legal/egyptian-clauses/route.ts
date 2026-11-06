// AURIENTA Egyptian Legal Clauses API
// GET /api/legal/egyptian-clauses?context={registration|capital_partner|workforce|founder|graduation|dividend|all}
// Returns the Egyptian-law-specific legal clauses for the given context.

import { NextRequest, NextResponse } from "next/server";
import {
  ALL_EGYPTIAN_LEGAL_CLAUSES,
  getRegistrationClauses,
  getCapitalPartnerClauses,
  getWorkforcePartnerClauses,
  getFounderClauses,
  getGraduationClauses,
  getDividendClauses,
} from "@/lib/aurienta/egyptian-legal-clauses";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const context = url.searchParams.get("context") ?? "all";

  let clauses = ALL_EGYPTIAN_LEGAL_CLAUSES;
  switch (context) {
    case "registration": clauses = getRegistrationClauses(); break;
    case "capital_partner": clauses = getCapitalPartnerClauses(); break;
    case "workforce": clauses = getWorkforcePartnerClauses(); break;
    case "founder": clauses = getFounderClauses(); break;
    case "graduation": clauses = getGraduationClauses(); break;
    case "dividend": clauses = getDividendClauses(); break;
    default: clauses = ALL_EGYPTIAN_LEGAL_CLAUSES;
  }

  return NextResponse.json({
    version: "1.0.0",
    jurisdiction: "Arab Republic of Egypt",
    context,
    totalClauses: clauses.length,
    clauses: clauses.map((c) => ({
      clauseId: c.clauseId,
      title: c.title,
      category: c.category,
      legalBasis: c.legalBasis,
      text: c.text,
      mustAccept: c.mustAccept,
    })),
  });
});

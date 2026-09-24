import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/intelligence/conflicts?userId=...&enterpriseId=...
// Detects conflicts of interest for a user in the context of an enterprise (Vol 11 §11.1.4).
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";
  const enterpriseId = url.searchParams.get("enterpriseId") ?? "";

  if (!userId || !enterpriseId) {
    return NextResponse.json(
      { error: "Missing query params: userId, enterpriseId" },
      { status: 400 }
    );
  }

  const { detectConflictsOfInterest, hasActiveCoiDeclaration } = await import(
    "@/lib/aurienta/intelligence-graph"
  );
  const [conflicts, declarationStatus] = await Promise.all([
    detectConflictsOfInterest(userId, enterpriseId),
    hasActiveCoiDeclaration(userId, enterpriseId),
  ]);

  return NextResponse.json({
    userId,
    enterpriseId,
    conflictsDetected: conflicts.length,
    conflicts,
    hasActiveDeclaration: declarationStatus.hasDeclaration,
    undisclosedConflicts: declarationStatus.undisclosedConflicts.length,
    recommendation:
      conflicts.length === 0
        ? "No conflicts of interest detected."
        : declarationStatus.hasDeclaration
          ? "Conflicts detected but declaration on file."
          : `CRITICAL: ${conflicts.length} undisclosed conflict(s) detected. User must file a COI declaration before participating in governance.`,
  });
});

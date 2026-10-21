// AURIENTA — REC-6 Graduation Bond API · GET /api/graduation-bond/verify/[bondId]
//
// PUBLIC endpoint — NO auth required. Anyone (capital partner, regulator,
// external auditor, the public) can verify a Graduation Bond by ID.
//
// Returns valid=true if:
//   - the bond exists,
//   - the bond is not revoked (currently always true — bonds are irrevocable),
//   - the enterprise still has status='graduated'.
//
// Returns valid=false with a reason otherwise.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { verifyBond } from "@/lib/aurienta/graduation-bond";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ bondId: string }> }) => {
    const { bondId } = await params;
    if (!bondId) {
      return NextResponse.json(
        { error: "bondId is required" },
        { status: 400 }
      );
    }

    const result = await verifyBond(bondId);

    // Audit-log the public verification (no actor — system-generated).
    await audit({
      actorId: "system",
      action: "graduation_bond.verify",
      target: `graduation_bond:${bondId}`,
      result: result.valid ? "allowed" : "denied",
      reason: result.reason,
      metadata: {
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    if (!result.valid && !result.bond) {
      return NextResponse.json(
        { valid: false, reason: result.reason ?? "Bond not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  },
  "GET /api/graduation-bond/verify/[bondId]"
);

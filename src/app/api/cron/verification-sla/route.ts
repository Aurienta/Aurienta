import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/verification-sla
// Checks for users whose verification is past the 48h SLA and marks them rejected.
// Token-auth via CRON_SECRET.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find users with verificationStatus 'in_review' and updated > 48h ago
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const expiredUsers = await db.user.findMany({
    where: {
      verificationStatus: "in_review",
      updatedAt: { lt: cutoff },
    },
    select: { id: true, email: true, legalName: true },
  });

  let rejected = 0;
  for (const user of expiredUsers) {
    await db.user.update({
      where: { id: user.id },
      data: { verificationStatus: "rejected" } as any,
    });

    await audit({
      actorId: "system",
      action: "verification.sla_exceeded",
      target: `user:${user.id}`,
      result: "denied",
      metadata: {
        email: user.email,
        legalName: user.legalName,
        cutoff: cutoff.toISOString(),
      },
    });

    rejected++;
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    rejected,
    message: `${rejected} user(s) marked as verification rejected (SLA exceeded).`,
  });
});

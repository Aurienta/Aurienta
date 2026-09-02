import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/notifications/[id]/read — mark a single notification as read.
// Auth required; the notification must belong to the signed-in user.
export const POST = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const { params } = ctx;
    const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Confirm ownership before flipping the flag.
  const notif = await db.notification.findUnique({
    where: { id },
    select: { userId: true, read: true },
  });
  if (!notif || notif.userId !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (notif.read) {
    return NextResponse.json({ ok: true, alreadyRead: true });
  }

  await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
  },
  "POST /api/notifications/[id]/read"
);

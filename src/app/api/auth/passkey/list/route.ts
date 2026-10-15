// List current user's passkeys. Auth required.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { listPasskeys } from "@/lib/aurienta/passkey";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const passkeys = await listPasskeys(user.id);

  return NextResponse.json({
    passkeys: passkeys.map((p) => ({
      id: p.id,
      credentialId: p.credentialId,
      name: p.name,
      deviceType: p.deviceType,
      backedUp: p.backedUp,
      transports: p.transports,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt ? p.lastUsedAt.toISOString() : null,
    })),
  });
}, "GET /api/auth/passkey/list");

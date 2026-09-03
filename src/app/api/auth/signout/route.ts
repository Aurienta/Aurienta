// AURIENTA sign-out — revokes the current Session row and clears the cookie.
//
// POST-ONLY: The GET handler was removed because Next.js <Link> prefetches
// linked URLs, and a GET /api/auth/signout prefetch would silently revoke
// the user's session (the "tabs cause logout" root cause). Sign-out is now
// only possible via an explicit POST (form submit or fetch).

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await signOut();
  await audit({
    action: "auth.signout",
    result: "allowed",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")?.trim()
      ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? undefined,
  }).catch(() => {
    // Audit-log failure must not block sign-out.
  });

  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  redirect("/signin");
}, "POST /api/auth/signout");

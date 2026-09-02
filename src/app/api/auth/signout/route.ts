// AURIENTA sign-out — revokes the current Session row and clears the cookie.
//
// Supports two response modes:
// - JSON (Accept: application/json) → returns { ok: true }
// - HTML (default) → 303 redirect to /signin
//
// Both GET and POST are accepted so the route works from <form> posts,
// fetch() calls, and direct navigations ("Sign out" link).

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function doSignOut(req: NextRequest) {
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
  return null; // fall through to redirect
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const json = await doSignOut(req);
  if (json) return json;
  redirect("/signin");
}, "POST /api/auth/signout");

export const GET = withErrorHandler(async (req: NextRequest) => {
  const json = await doSignOut(req);
  if (json) return json;
  redirect("/signin");
}, "GET /api/auth/signout");

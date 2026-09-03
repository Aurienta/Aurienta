import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "(none)";
  const userAgent = req.headers.get("user-agent") || "(none)";
  return NextResponse.json({
    cookieHeader: cookieHeader.slice(0, 200),
    hasSession: cookieHeader.includes("aurienta_session"),
    hasCsrf: cookieHeader.includes("aurienta_csrf"),
    userAgent: userAgent.slice(0, 80),
    timestamp: new Date().toISOString(),
  });
}

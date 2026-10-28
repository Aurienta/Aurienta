import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api
// FIX (COO-AUDIT P2): Return 404 instead of directory listing.
// The API root has no public surface — clients should use specific endpoints.
export function GET() {
  return NextResponse.json(
    { error: "Not found — use a specific API endpoint. See /api/health for status." },
    { status: 404 }
  );
}

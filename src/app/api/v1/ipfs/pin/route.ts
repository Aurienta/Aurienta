import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { getCurrentUser } from "@/lib/aurienta/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/ipfs/pin
// Pins content to IPFS (Vol 11 §11.5).
// FIX (COO-AUDIT P1+P2): auth required + safe body parse + size limit
// Production: pins to Pinata/Web3.Storage/self-hosted node.
export const POST = withErrorHandler(async (req: NextRequest) => {
  // FIX P1: require auth (was accepting unauthenticated pin requests)
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let content: string | Buffer;
  let metadata: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    // FIX P2: safe body parse — return 400 on malformed JSON instead of 500
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Bad request — valid JSON body required" },
        { status: 400 }
      );
    }
    content = JSON.stringify(body);
    metadata = body.metadata ?? {};
  } else if (contentType.includes("text/")) {
    content = await req.text();
  } else {
    // FIX P1: reject unsupported content types instead of silently treating as text
    return NextResponse.json(
      { error: "Bad request — Content-Type must be application/json or text/*" },
      { status: 400 }
    );
  }

  // FIX P1: size limit — reject payloads > 1MB (prevents abuse)
  const contentStr = typeof content === "string" ? content : content.toString();
  if (contentStr.length > 1_000_000) {
    return NextResponse.json(
      { error: "Bad request — content exceeds 1MB limit" },
      { status: 413 }
    );
  }

  const { pinToIpfs } = await import("@/lib/aurienta/ipfs");
  const result = await pinToIpfs(contentStr, metadata);

  return NextResponse.json({
    ...result,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
    pinnedBy: user.id,
    note: "Sandbox: CID computed locally (real SHA-256). Production pins to IPFS network via Pinata.",
  });
});

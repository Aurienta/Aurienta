import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/ipfs/pin
// Pins content to IPFS (Vol 11 §11.5).
// In the sandbox, computes a real CIDv1 + logs the pin intent.
// Production: pins to Pinata/Web3.Storage/self-hosted node.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const contentType = req.headers.get("content-type") ?? "";
  let content: string | Buffer;
  let metadata: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    const body = await req.json();
    content = JSON.stringify(body);
    metadata = body.metadata ?? {};
  } else {
    content = await req.text();
  }

  const { pinToIpfs } = await import("@/lib/aurienta/ipfs");
  const result = await pinToIpfs(content, metadata);

  return NextResponse.json({
    ...result,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
    note: "Sandbox: CID computed locally (real SHA-256). Production pins to IPFS network via Pinata.",
  });
});

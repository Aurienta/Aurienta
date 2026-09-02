// AURIENTA Brain AI — Multi-Model Status Endpoint
// Returns the connection status of all 5 AI providers + which models are active.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { checkAiProviders } from "@/lib/aurienta/ai-router";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const providers = await checkAiProviders();

  const connected = Object.entries(providers).filter(([, v]) => v.connected).length;
  const total = Object.keys(providers).length;

  return NextResponse.json({
    brainStatus: connected === total ? "ALL_PROVIDERS_ONLINE" : connected > 0 ? "PARTIAL" : "OFFLINE",
    providersConnected: connected,
    providersTotal: total,
    providers,
    timestamp: new Date().toISOString(),
  });
}, "GET /api/ai/brain-status");

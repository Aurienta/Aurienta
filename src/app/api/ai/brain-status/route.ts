// AURIENTA Brain AI — Multi-Model Status Endpoint
// Returns the connection status of all 5 AI providers + which models are active.
//
// AI-REBUILD: now reports RICH status per provider (configured, connected,
// model, latencyMs, lastError, lastCheckedAt) by calling
// getAiProviderStatus() — the endpoint no longer hides WHY a provider is
// failing (401/402/404/network). The 5 providers are OpenRouter, Groq, NVIDIA, Gemini,
// and HuggingFace. NO OpenRouter. 4 native AI providers only.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { getAiProviderStatus } from "@/lib/aurienta/ai-router";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const statuses = await getAiProviderStatus();

  const connected = statuses.filter(s => s.connected).length;
  const configured = statuses.filter(s => s.configured).length;
  const total = statuses.length;

  // Highest latency among the providers that responded — useful for spotting
  // a slow-but-alive provider (e.g., HuggingFace cold-start).
  const maxLatencyMs = Math.max(0, ...statuses.filter(s => s.connected).map(s => s.latencyMs));
  const avgLatencyMs = connected > 0
    ? Math.round(statuses.filter(s => s.connected).reduce((sum, s) => sum + s.latencyMs, 0) / connected)
    : 0;

  return NextResponse.json({
    brainStatus: connected === total ? "ALL_PROVIDERS_ONLINE"
      : connected > 0 ? "PARTIAL"
      : configured > 0 ? "ALL_CONFIGURED_FAILED"
      : "OFFLINE",
    providersConnected: connected,
    providersConfigured: configured,
    providersTotal: total,
    latency: {
      maxMs: maxLatencyMs,
      avgMs: avgLatencyMs,
    },
    providers: statuses.map(s => ({
      provider: s.provider,
      configured: s.configured,
      connected: s.connected,
      model: s.model,
      latencyMs: s.latencyMs,
      lastError: s.lastError,
      lastCheckedAt: s.lastCheckedAt,
    })),
    timestamp: new Date().toISOString(),
  });
}, "GET /api/ai/brain-status");

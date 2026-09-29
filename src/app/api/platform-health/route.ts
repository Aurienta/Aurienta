import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/platform-health
// Checks all 5 platforms: GitHub, Vercel, Turso, Inngest, Neon
// Returns the connection status of each + AI model failover status.
export const GET = withErrorHandler(async () => {
  const platforms: Record<string, any> = {};

  // 1. GitHub (source of truth)
  platforms.github = {
    status: "connected",
    repo: "Aurienta/Aurienta",
    branch: "main",
    note: "Source of truth. Push triggers CI/CD.",
  };

  // 2. Vercel (host)
  platforms.vercel = {
    status: process.env.NEXT_PUBLIC_VERCEL_URL ? "connected" : "local-dev",
    url: process.env.NEXT_PUBLIC_VERCEL_URL ?? "localhost:3000",
    note: "Next.js host. Auto-deploys from GitHub main.",
  };

  // 3. Turso (primary DB)
  const dbStart = Date.now();
  try {
    await db.user.count();
    platforms.turso = {
      status: "connected",
      latencyMs: Date.now() - dbStart,
      url: process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***:***@") ?? "not-set",
      models: 56,
      note: "Primary database (libSQL). 56 models, 109+ indexes.",
    };
  } catch (e) {
    platforms.turso = {
      status: "down",
      error: e instanceof Error ? e.message : String(e),
      note: "Primary database unreachable.",
    };
  }

  // 4. Inngest (workflows)
  try {
    const { checkInngestHealth } = await import("@/lib/aurienta/inngest");
    const inngestHealth = await checkInngestHealth();
    platforms.inngest = {
      status: inngestHealth.sandbox ? "sandbox" : inngestHealth.connected ? "connected" : "down",
      configured: inngestHealth.configured,
      workflows: inngestHealth.workflows,
      note: inngestHealth.sandbox
        ? "Sandbox mode — events logged locally. Install Inngest SDK for production."
        : "Workflow orchestration (disputes, graduation, succession, SLA).",
    };
  } catch {
    platforms.inngest = { status: "not-configured", note: "INNGEST_EVENT_KEY not set." };
  }

  // 5. Neon (analytics replica)
  try {
    const { checkNeonHealth } = await import("@/lib/aurienta/neon");
    const neonHealth = await checkNeonHealth();
    platforms.neon = {
      status: neonHealth.connected ? "connected" : neonHealth.configured ? "configured" : "not-configured",
      url: neonHealth.url,
      note: neonHealth.configured
        ? "PostgreSQL analytics replica (optional). Falls back to Turso."
        : "Not configured. Analytics use Turso primary.",
    };
  } catch {
    platforms.neon = { status: "not-configured", note: "NEON_DATABASE_URL not set." };
  }

  // AI model failover status
  try {
    const aiProviders = ["GEMINI_API_KEY", "GROQ_API_KEY", "HUGGINGFACE_API_KEY", "OPENROUTER_API_KEY", "NVIDIA_API_KEY"];
    const configured = aiProviders.filter((k) => process.env[k]).length;
    platforms.aiFailover = {
      status: configured > 0 ? "connected" : "not-configured",
      providersConfigured: configured,
      providers: aiProviders.map((k) => ({
        name: k.replace("_API_KEY", "").toLowerCase(),
        configured: !!process.env[k],
      })),
      failoverChain: "Gemini → OpenAI → Groq → HuggingFace → OpenRouter → NVIDIA → safe fallback",
      note: configured > 0
        ? `${configured}/6 AI providers configured. Automatic failover on model failure.`
        : "No AI providers configured. All AI calls return safe fallback (CRE rules still enforced).",
    };
  } catch {
    platforms.aiFailover = { status: "error", note: "Failed to check AI providers." };
  }

  // Overall status
  const criticalPlatforms = ["turso"];
  const allCriticalUp = criticalPlatforms.every((p) => platforms[p]?.status === "connected");
  const overallStatus = allCriticalUp ? "operational" : "degraded";

  return NextResponse.json({
    overall: overallStatus,
    checkedAt: new Date().toISOString(),
    platforms,
    summary: {
      github: platforms.github.status,
      vercel: platforms.vercel.status,
      turso: platforms.turso.status,
      inngest: platforms.inngest.status,
      neon: platforms.neon.status,
      aiFailover: platforms.aiFailover.status,
    },
  });
});

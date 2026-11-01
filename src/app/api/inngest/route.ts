import { NextRequest, NextResponse } from "next/server";
import { serve } from "inngest/next";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  inngestFunctions,
  getInngest,
  WORKFLOW_DEFINITIONS,
  checkInngestHealth,
} from "@/lib/aurienta/inngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// /api/inngest — Inngest SDK serve handler.
//
// Inngest Cloud calls this endpoint to:
//   - GET  /api/inngest         — discovery: list of registered functions
//   - PUT  /api/inngest         — sync: push function configuration
//   - POST /api/inngest          — invoke: trigger a function run
//
// The serve() helper from inngest/next exposes GET / POST / PUT methods that
// handle all three flows. When the Inngest client is not configured (no
// INNGEST_EVENT_KEY env var), inngestFunctions is empty — the handler still
// responds, but with no functions to register.
//
// In sandbox mode the handler responds to the discovery call so the Inngest
// dashboard can introspect the platform, but no events will trigger because
// sendInngestEvent() degrades to a console.log.
// ─────────────────────────────────────────────────────────────────────────────

const client = getInngest() as any;

// If the client is configured AND the signing key is a real Inngest key
// ("sign_..."), use the real serve handler. Placeholder/dev values would make
// the SDK's serve() throw (→ HTTP 500 on discovery), so we validate first and
// fall back to the sandbox payload instead of crashing.
const signingKey = process.env.INNGEST_SIGNING_KEY ?? "";
const validSigningKey = signingKey.startsWith("sign_") || /^[A-Za-z0-9_-]{40,}$/.test(signingKey);
const inngestHandler = client && validSigningKey
  ? serve({ client, functions: inngestFunctions, streaming: "allow" as any })
  : null;

// Wrap a serve() method so any internal SDK error (bad key, network, parse)
// degrades to the sandbox payload instead of an unhandled 500.
function safeServe(method: "GET" | "POST" | "PUT", fallback: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const res = await (inngestHandler as any)[method](req);
      return res as Response;
    } catch (e) {
      return fallback(req);
    }
  };
}

// GET — Inngest discovery (real handler) OR custom sandbox payload.
const sandboxDiscovery = async (_req: NextRequest) => {
  const health = await checkInngestHealth();
  return NextResponse.json({
    name: "AURIENTA Constitutional Engine",
    version: "2026.1.0",
    mode: "sandbox",
    connected: false,
    configured: health.configured,
    workflows: WORKFLOW_DEFINITIONS.map((w) => ({
      id: w.id,
      name: w.name,
      trigger: w.trigger,
      wired: w.wired,
      steps: w.steps ?? w.stages?.map((s) => s.name) ?? [],
    })),
    cronJobs: [
      { id: "proposal-expiry", schedule: "0 2 * * *", path: "/api/cron/proposal-expiry" },
      { id: "reservation-expiry", schedule: "0 3 * * *", path: "/api/cron/reservation-expiry" },
      { id: "stage-transition", schedule: "30 2 * * *", path: "/api/cron/stage-transition" },
      { id: "health-rating", schedule: "0 4 * * *", path: "/api/cron/health-rating" },
      { id: "verification-sla", schedule: "15 4 * * *", path: "/api/cron/verification-sla" },
      { id: "crcica-arbitration", schedule: "0 5 * * *", path: "/api/cron/crcica-arbitration" },
    ],
    note:
      "Sandbox mode — Inngest SDK installed but INNGEST_EVENT_KEY is not set (or the signing key is a placeholder). " +
      "Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to enable live workflow orchestration. " +
      "Cron jobs run via Vercel cron in either mode.",
  });
};

export const GET = inngestHandler
  ? safeServe("GET", sandboxDiscovery)
  : withErrorHandler(sandboxDiscovery);

// POST — Inngest function invocation (real handler) OR custom event-echo
// (sandbox) so existing callers of POST /api/inngest continue to work.
const sandboxInvoke = withErrorHandler(async (req: NextRequest) => {
  // Sandbox echo — also forward to sendInngestEvent so audit log records it.
  const body = await req.json().catch(() => ({}));
  const { sendInngestEvent } = await import("@/lib/aurienta/inngest");
  const result = await sendInngestEvent({
    name: ((body as any)?.name ?? "general.event") as any,
    data: ((body as any)?.data ?? {}) as any,
  });
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    sandbox: result.sandbox,
    event: (body as { name?: string }).name ?? "general.event",
    timestamp: new Date().toISOString(),
  });
});

export const POST = inngestHandler
  ? safeServe("POST", sandboxInvoke)
  : sandboxInvoke;

// PUT — Inngest sync (real handler only).
const sandboxSync = withErrorHandler(async (_req: NextRequest) => {
  return NextResponse.json(
    {
      ok: false,
      mode: "sandbox",
      message: "Inngest sync not available — set INNGEST_EVENT_KEY to enable.",
    },
    { status: 200 }
  );
});

export const PUT = inngestHandler
  ? safeServe("PUT", sandboxSync)
  : sandboxSync;

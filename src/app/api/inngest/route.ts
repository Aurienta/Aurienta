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

// If the client is configured, use the real Inngest serve handler. Otherwise
// fall back to a manual discovery response so /api/inngest always responds.
const inngestHandler = client
  ? serve({ client, functions: inngestFunctions, streaming: "allow" as any })
  : null;

// GET — Inngest discovery (real handler) OR custom sandbox payload.
export const GET = inngestHandler
  ? (inngestHandler.GET as (req: NextRequest) => Promise<Response>)
  : withErrorHandler(async (_req: NextRequest) => {
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
          "Sandbox mode — Inngest SDK installed but INNGEST_EVENT_KEY is not set. " +
          "Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to enable live workflow orchestration. " +
          "Cron jobs run via Vercel cron in either mode.",
      });
    });

// POST — Inngest function invocation (real handler) OR custom event-echo
// (sandbox) so existing callers of POST /api/inngest continue to work.
export const POST = inngestHandler
  ? (inngestHandler.POST as (req: NextRequest) => Promise<Response>)
  : withErrorHandler(async (req: NextRequest) => {
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

// PUT — Inngest sync (real handler only).
export const PUT = inngestHandler
  ? (inngestHandler.PUT as (req: NextRequest) => Promise<Response>)
  : withErrorHandler(async (_req: NextRequest) => {
      return NextResponse.json(
        {
          ok: false,
          mode: "sandbox",
          message: "Inngest sync not available — set INNGEST_EVENT_KEY to enable.",
        },
        { status: 200 }
      );
    });

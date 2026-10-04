import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/inngest
// Inngest SDK discovery endpoint — returns the list of registered functions.
// Inngest calls this to discover what workflows are available.
//
// In sandbox mode (Inngest SDK not installed), returns the workflow definitions
// from our inngest.ts module so the Inngest dashboard can still see them.
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { WORKFLOW_DEFINITIONS, checkInngestHealth } = await import("@/lib/aurienta/inngest");
  const health = await checkInngestHealth();

  return NextResponse.json({
    name: "AURIENTA Constitutional Engine",
    version: "2026.1.0",
    mode: health.sandbox ? "sandbox" : "production",
    connected: health.connected,
    workflows: WORKFLOW_DEFINITIONS.map((w: any) => ({
      id: w.id,
      name: w.name,
      trigger: w.trigger,
      steps: w.steps ?? w.stages?.map((s: any) => s.name) ?? [],
    })),
    cronJobs: [
      { id: "proposal-expiry", schedule: "0 2 * * *", path: "/api/cron/proposal-expiry" },
      { id: "reservation-expiry", schedule: "0 3 * * *", path: "/api/cron/reservation-expiry" },
      { id: "stage-transition", schedule: "30 2 * * *", path: "/api/cron/stage-transition" },
      { id: "health-rating", schedule: "0 4 * * *", path: "/api/cron/health-rating" },
      { id: "verification-sla", schedule: "15 4 * * *", path: "/api/cron/verification-sla" },
      { id: "crcica-arbitration", schedule: "0 5 * * *", path: "/api/cron/crcica-arbitration" },
    ],
    note: health.sandbox
      ? "Sandbox mode — Inngest SDK not installed. Cron jobs run via Vercel cron. Install Inngest SDK for production workflow orchestration."
      : "Production mode — Inngest SDK connected. All workflows + crons orchestrated by Inngest.",
  });
});

// POST /api/inngest
// Receives Inngest event triggers and dispatches to the appropriate workflow.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { sendInngestEvent } = await import("@/lib/aurienta/inngest");

  const result = await sendInngestEvent({
    name: body.name ?? "general.event",
    data: body.data ?? {},
  });

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    sandbox: result.sandbox,
    event: body.name,
    timestamp: new Date().toISOString(),
  });
});

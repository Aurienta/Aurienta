// AURIENTA — Inngest Client + Workflow Definitions
//
// Inngest handles long-running serverless workflows:
//   1. Dispute Resolution (6-stage, 72h/7d/14d/90d timers)
//   2. Graduation Protocol (readiness check + 75% vote)
//   3. Succession Activation (90-day threshold)
//   4. Verification SLA (48h timer)
//   5. Circuit Breaker (15min/30min/24h halts)
//
// Inngest triggers are fired from API routes via `inngest.send()`.
// The Inngest dashboard (app.inngest.com) shows workflow runs + retries.

import { db } from "@/lib/db";
import { audit } from "./audit";

// ── Inngest event types ──
export type InngestEvent =
  | { name: "dispute.stage-advanced"; data: { caseId: string; fromStage: number; toStage: number } }
  | { name: "graduation.vote-called"; data: { enterpriseId: string; proposalId: string } }
  | { name: "succession.activated"; data: { declarationId: string; userId: string } }
  | { name: "verification.submitted"; data: { userId: string; submittedAt: string } }
  | { name: "circuit-breaker.triggered"; data: { enterpriseId: string; level: number; resumeAt: string } }
  | { name: "cron.daily"; data: { timestamp: string } };

// ── Inngest client (lazy-loaded, sandbox-safe) ──
let inngestClient: any = null;

export async function getInngest() {
  if (inngestClient) return inngestClient;
  const key = process.env.INNGEST_EVENT_KEY;
  if (!key) return null;

  try {
    // Dynamic require via eval to avoid TypeScript module resolution
    // (inngest SDK may not be installed in sandbox)
    const inngestModule: any = (0, eval)("require")("inngest");
    const Inngest = inngestModule.Inngest;
    inngestClient = new Inngest({
      id: "aurienta-constitutional",
      eventKey: key,
      baseUrl: process.env.INNGEST_API_URL ?? "https://api.inngest.com",
    });
    return inngestClient;
  } catch {
    // Inngest SDK not installed — sandbox mode
    return null;
  }
}

// ── Send an event to Inngest (sandbox-safe) ──
export async function sendInngestEvent(event: InngestEvent): Promise<{ sent: boolean; sandbox: boolean }> {
  const client = await getInngest();
  if (!client) {
    // Sandbox: log the event instead of sending
    console.log(`[inngest:sandbox] Event: ${event.name}`, event.data);
    return { sent: false, sandbox: true };
  }

  try {
    await client.send(event);
    await audit({
      actorId: "system",
      action: "inngest.event_sent",
      target: `inngest:${event.name}`,
      result: "allowed",
      metadata: { eventName: event.name, data: event.data },
    });
    return { sent: true, sandbox: false };
  } catch (e) {
    console.error("[inngest] Failed to send event:", e);
    return { sent: false, sandbox: false };
  }
}

// ── Workflow definitions (for Inngest dashboard) ──
// These are reference implementations. In production, install the Inngest SDK
// and register these as Inngest functions:
//
//   export const disputeWorkflow = inngest.createFunction(
//     { id: "dispute-resolution", retries: 3 },
//     { event: "dispute.stage-advanced" },
//     async ({ event, step }) => {
//       await step.run("advance-stage", async () => {
//         // ... advance dispute to next stage ...
//       });
//       await step.sleep("72h"); // wait 72h before next stage
//       await step.sendEvent("dispute.stage-advanced", { data: { ... } });
//     }
//   );

export const WORKFLOW_DEFINITIONS = [
  {
    id: "dispute-resolution",
    name: "Dispute Resolution (6-stage)",
    trigger: "dispute.stage-advanced",
    stages: [
      { stage: 1, name: "AI Mediation", duration: "72h" },
      { stage: 2, name: "Board Review", duration: "7d" },
      { stage: 3, name: "Shareholder Vote", duration: "14d" },
      { stage: 4, name: "CRCICA Arbitration", duration: "90d" },
      { stage: 5, name: "Enforcement", duration: "immediate" },
      { stage: 6, name: "Closure", duration: "—" },
    ],
  },
  {
    id: "graduation-protocol",
    name: "Graduation Protocol",
    trigger: "graduation.vote-called",
    steps: ["readiness-check", "vote-tally", "export-package", "alumni-hall"],
  },
  {
    id: "succession-activation",
    name: "Succession Activation (90-day threshold)",
    trigger: "succession.activated",
    steps: ["verify-threshold", "activate-voting-proxy", "transfer-equity", "notify-beneficiaries"],
  },
  {
    id: "verification-sla",
    name: "Verification SLA (48h timer)",
    trigger: "verification.submitted",
    steps: ["start-48h-timer", "check-at-48h", "mark-rejected-if-expired"],
  },
  {
    id: "circuit-breaker-halt",
    name: "Circuit Breaker Halt",
    trigger: "circuit-breaker.triggered",
    steps: ["halt-trading", "notify-users", "auto-resume-at-expiry"],
  },
];

// ── Health check for Inngest connection ──
export async function checkInngestHealth(): Promise<{
  connected: boolean;
  configured: boolean;
  sandbox: boolean;
  workflows: number;
}> {
  const client = await getInngest();
  if (!client) {
    return {
      connected: false,
      configured: !!process.env.INNGEST_EVENT_KEY,
      sandbox: true,
      workflows: WORKFLOW_DEFINITIONS.length,
    };
  }

  try {
    // Inngest doesn't have a simple health endpoint, but we can check
    // if the client is initialized
    return {
      connected: true,
      configured: true,
      sandbox: false,
      workflows: WORKFLOW_DEFINITIONS.length,
    };
  } catch {
    return {
      connected: false,
      configured: true,
      sandbox: false,
      workflows: WORKFLOW_DEFINITIONS.length,
    };
  }
}

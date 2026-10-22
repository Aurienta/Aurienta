// AURIENTA — Inngest Client + Workflow Definitions (REAL SDK)
//
// Inngest handles long-running serverless workflows:
//   1. Dispute Resolution (6-stage, 72h/7d/14d/90d timers)
//   2. Graduation Protocol (readiness check + 75% vote)
//   3. Succession Activation (90-day threshold)
//   4. Verification SLA (48h timer)
//   5. Circuit Breaker (15min/30min/24h halts)
//
// Workflows #1 and #4 are wired to real Inngest functions below; #2, #3, #5
// remain defined (see WORKFLOW_DEFINITIONS) but not wired — they will be
// connected in a future task. Inngest triggers are fired from API routes
// via `sendInngestEvent()`. The Inngest dashboard (app.inngest.com) shows
// workflow runs + retries.
//
// ENV:
//   INNGEST_EVENT_KEY   — Inngest Cloud event key (for sending events)
//   INNGEST_SIGNING_KEY — Inngest Cloud signing key (for verifying webhooks)
//   INNGEST_API_URL     — override Inngest API base URL (optional)
//
// If the env vars are missing, getInngest() returns null and sendInngestEvent
// degrades to a console.log (sandbox mode). The Inngest serve handler at
// /api/inngest will respond with a discovery payload listing the functions.

import { Inngest } from "inngest";
import { db } from "@/lib/db";
import { audit } from "./audit";
import { appendLedgerEvent } from "./cre";
import { logger } from "./logger";

// ── Inngest event types ──
export type InngestEvent =
  | { name: "dispute.stage-advanced"; data: { caseId: string; fromStage: number; toStage: number } }
  | { name: "graduation.vote-called"; data: { enterpriseId: string; proposalId: string } }
  | { name: "succession.activated"; data: { declarationId: string; userId: string } }
  | { name: "verification.submitted"; data: { userId: string; submittedAt: string } }
  | { name: "circuit-breaker.triggered"; data: { enterpriseId: string; level: number; resumeAt: string } }
  | { name: "cron.daily"; data: { timestamp: string } };

// ── Inngest client (singleton, sandbox-safe) ──
let inngestClient: Inngest | null = null;
let inngestInitFailed = false;

export function getInngest(): Inngest | null {
  if (inngestInitFailed) return null;
  if (inngestClient) return inngestClient;

  const key = process.env.INNGEST_EVENT_KEY;
  if (!key) {
    // Not configured — sandbox mode.
    inngestInitFailed = true;
    return null;
  }

  try {
    inngestClient = new Inngest({
      id: "aurienta-constitutional",
      eventKey: key,
      signingKey: process.env.INNGEST_SIGNING_KEY,
      baseUrl: process.env.INNGEST_API_URL ?? "https://api.inngest.com",
    });
    return inngestClient;
  } catch (e) {
    logger.warn("inngest_client_init_failed", {
      err: e instanceof Error ? e.message : String(e),
    });
    inngestInitFailed = true;
    return null;
  }
}

// ── Send an event to Inngest (sandbox-safe) ──
export async function sendInngestEvent(
  event: InngestEvent
): Promise<{ sent: boolean; sandbox: boolean }> {
  const client = getInngest() as any;
  if (!client) {
    // Sandbox: log the event instead of sending
    logger.info("inngest_sandbox_event", { name: event.name, data: event.data });
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
    logger.error("inngest_send_failed", {
      eventName: event.name,
      err: e instanceof Error ? e.message : String(e),
    });
    return { sent: false, sandbox: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW #1 — Dispute Resolution Timer (72h → auto-escalate to CRCICA)
//
// Blueprint Vol 10 §10.5 — when a dispute (AppealCase) enters Stage 1 (AI
// Mediation), this workflow waits 72 hours. If the case is still in Stage 1
// after the timer, it auto-escalates to Stage 4 (CRCICA Arbitration),
// skipping Stages 2 (Board Review) and 3 (Shareholder Vote).
//
// Triggered by: dispute.stage-advanced event with toStage === 1.
// ─────────────────────────────────────────────────────────────────────────────
const disputeResolutionFn = (() => {
  const client = getInngest() as any;
  if (!client) return null;
  return client.createFunction(
    {
      id: "dispute-resolution-timer",
      name: "Dispute Resolution — 72h auto-escalate to CRCICA",
      retries: 3,
    },
    { event: "dispute.stage-advanced" },
    async ({ event, step }: { event: any; step: any }) => {
      const data = event.data as {
        caseId: string;
        fromStage: number;
        toStage: number;
      };

      // Only start the 72h timer when a case ENTERS Stage 1 (AI Mediation).
      // Stage advancements to Stages 2+ are handled elsewhere (the cron job
      // /api/cron/crcica-arbitration advances through the remaining stages).
      if (data.toStage !== 1) {
        return { skipped: true, reason: "not_a_stage_1_entry", caseId: data.caseId };
      }

      // Step 1: confirm the case is still at stage 1 (it might have been
      // manually advanced already between the event fire and this step).
      await step.run("verify-stage-1", async () => {
        const caseRow = await (db as any).appealCase.findUnique({
          where: { id: data.caseId },
          select: { id: true, stage: true, status: true, filedById: true, enterpriseId: true },
        });
        if (!caseRow) {
          throw new Error(`AppealCase ${data.caseId} not found`);
        }
        if (caseRow.stage !== 1) {
          // Already advanced — abort the timer.
          return { aborted: true, currentStage: caseRow.stage };
        }
        return { aborted: false, currentStage: caseRow.stage };
      });

      // Step 2: wait 72 hours (the constitutional AI Mediation window).
      await step.sleep("72h");

      // Step 3: re-check — if still at stage 1, escalate to CRCICA (stage 4).
      await step.run("escalate-to-crcica-if-still-stage-1", async () => {
        const caseRow = await (db as any).appealCase.findUnique({
          where: { id: data.caseId },
          select: { id: true, stage: true, status: true, filedById: true, enterpriseId: true },
        });
        if (!caseRow) {
          throw new Error(`AppealCase ${data.caseId} not found after sleep`);
        }
        if (caseRow.stage !== 1) {
          // Already advanced by a human / cron — don't double-escalate.
          return {
            escalated: false,
            reason: `case already at stage ${caseRow.stage}`,
          };
        }

        // Escalate to Stage 4 (CRCICA Arbitration).
        await db.$transaction(async (tx) => {
          await (tx as any).appealCase.update({
            where: { id: data.caseId },
            data: {
              stage: 4,
              status: "crcica_arbitration",
            },
          });

          if (caseRow.enterpriseId) {
            await appendLedgerEvent(tx, {
              enterpriseId: caseRow.enterpriseId,
              eventType: "cre_decision",
              payload: {
                action: "dispute_auto_escalated_crcica",
                caseId: data.caseId,
                fromStage: 1,
                toStage: 4,
                reason:
                  "72-hour AI Mediation window elapsed without resolution — auto-escalated to CRCICA Arbitration per Vol 10 §10.5 (Inngest workflow).",
                workflow: "dispute-resolution-timer",
              },
              actorId: caseRow.filedById ?? undefined,
            });
          }
        });

        await audit({
          actorId: "system",
          action: "appeal.auto_escalated_crcica",
          target: `appeal:${data.caseId}`,
          result: "allowed",
          metadata: {
            fromStage: 1,
            toStage: 4,
            workflow: "dispute-resolution-timer",
            enterpriseId: caseRow.enterpriseId ?? null,
          },
        });

        return { escalated: true, fromStage: 1, toStage: 4 };
      });

      return { completed: true, caseId: data.caseId };
    }
  );
})();

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW #4 — Verification SLA (48h → auto-reject if not verified)
//
// Blueprint §12.x — Government API manual-upload verifications get a 48-hour
// human-review SLA. If the reviewer does not act within 48h, the user's
// verificationStatus is auto-flipped to "rejected" so they cannot trade /
// reserve capital under a stale "in_review" state.
//
// Triggered by: verification.submitted event.
// ─────────────────────────────────────────────────────────────────────────────
const verificationSlaFn = (() => {
  const client = getInngest() as any;
  if (!client) return null;
  return client.createFunction(
    {
      id: "verification-sla-48h",
      name: "Verification SLA — 48h auto-reject if unverified",
      retries: 3,
    },
    { event: "verification.submitted" },
    async ({ event, step }: { event: any; step: any }) => {
      const data = event.data as { userId: string; submittedAt: string };

      // Step 1: confirm a pending / in_review verification exists.
      await step.run("verify-pending", async () => {
        const user = await db.user.findUnique({
          where: { id: data.userId },
          select: { id: true, verificationStatus: true, email: true, legalName: true },
        });
        if (!user) {
          throw new Error(`User ${data.userId} not found`);
        }
        if (!["pending", "in_review"].includes(user.verificationStatus)) {
          return { aborted: true, status: user.verificationStatus };
        }
        return { aborted: false, status: user.verificationStatus };
      });

      // Step 2: wait 48 hours.
      await step.sleep("48h");

      // Step 3: if still pending / in_review, mark as rejected.
      await step.run("reject-if-still-pending", async () => {
        const user = await db.user.findUnique({
          where: { id: data.userId },
          select: { id: true, verificationStatus: true, email: true, legalName: true },
        });
        if (!user) {
          throw new Error(`User ${data.userId} not found after sleep`);
        }
        if (!["pending", "in_review"].includes(user.verificationStatus)) {
          // Reviewer already acted — don't double-flip.
          return {
            rejected: false,
            reason: `user already in status: ${user.verificationStatus}`,
          };
        }

        await db.user.update({
          where: { id: data.userId },
          data: { verificationStatus: "rejected" },
        });

        await audit({
          actorId: "system",
          action: "verification.sla_exceeded",
          target: `user:${data.userId}`,
          result: "denied",
          metadata: {
            email: user.email,
            legalName: user.legalName,
            submittedAt: data.submittedAt,
            rejectedAt: new Date().toISOString(),
            workflow: "verification-sla-48h",
          },
        });

        return { rejected: true, userId: data.userId };
      });

      return { completed: true, userId: data.userId };
    }
  );
})();

// ── Exported function list for the serve handler ──
// Only includes functions whose client initialized successfully (i.e. when
// INNGEST_EVENT_KEY is set). When null, the Inngest serve handler still
// responds — it just has no functions to register.
export const inngestFunctions = [
  disputeResolutionFn,
  verificationSlaFn,
].filter((fn): fn is NonNullable<typeof fn> => fn !== null);

// ── Workflow definitions (for Inngest dashboard + GET /api/inngest) ──
// These are reference implementations kept for documentation / introspection.
// The wired ones above are the actual executable functions.
export const WORKFLOW_DEFINITIONS = [
  {
    id: "dispute-resolution",
    name: "Dispute Resolution (6-stage)",
    trigger: "dispute.stage-advanced",
    wired: true,
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
    wired: false,
    steps: ["readiness-check", "vote-tally", "export-package", "alumni-hall"],
  },
  {
    id: "succession-activation",
    name: "Succession Activation (90-day threshold)",
    trigger: "succession.activated",
    wired: false,
    steps: ["verify-threshold", "activate-voting-proxy", "transfer-equity", "notify-beneficiaries"],
  },
  {
    id: "verification-sla",
    name: "Verification SLA (48h timer)",
    trigger: "verification.submitted",
    wired: true,
    steps: ["start-48h-timer", "check-at-48h", "mark-rejected-if-expired"],
  },
  {
    id: "circuit-breaker-halt",
    name: "Circuit Breaker Halt",
    trigger: "circuit-breaker.triggered",
    wired: false,
    steps: ["halt-trading", "notify-users", "auto-resume-at-expiry"],
  },
];

// ── Health check for Inngest connection ──
export async function checkInngestHealth(): Promise<{
  connected: boolean;
  configured: boolean;
  sandbox: boolean;
  workflows: number;
  wiredWorkflows: number;
}> {
  const client = getInngest() as any;
  if (!client) {
    return {
      connected: false,
      configured: !!process.env.INNGEST_EVENT_KEY,
      sandbox: true,
      workflows: WORKFLOW_DEFINITIONS.length,
      wiredWorkflows: inngestFunctions.length,
    };
  }

  // Inngest doesn't have a simple health endpoint, but we can check
  // if the client is initialized.
  return {
    connected: true,
    configured: true,
    sandbox: false,
    workflows: WORKFLOW_DEFINITIONS.length,
    wiredWorkflows: inngestFunctions.length,
  };
}

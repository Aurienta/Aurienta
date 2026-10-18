import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/webhook/payment
// Law Firm Escrow Webhook Receiver (Vol 5 §5.2)
// Receives escrow events from law firms with Ed25519 signature verification.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lawfirm-signature") ?? "";
  const lawFirmId = req.headers.get("x-lawfirm-id") ?? "";

  if (!signature || !lawFirmId) {
    return NextResponse.json(
      { error: "Missing X-LawFirm-Signature or X-LawFirm-Id header" },
      { status: 401 }
    );
  }

  // Look up the law firm's public key
  const lawFirm = await (db as any).lawFirm.findUnique({
    where: { id: lawFirmId },
    select: { id: true, name: true, publicKey: true },
  });

  if (!lawFirm || !lawFirm.publicKey) {
    return NextResponse.json(
      { error: "Law firm not found or no public key registered" },
      { status: 401 }
    );
  }

  // Verify the Ed25519 signature
  const { verifyWebhookSignature } = await import("@/lib/aurienta/law-firm-webhook");
  const signatureValid = verifyWebhookSignature(rawBody, signature, lawFirm.publicKey);

  if (!signatureValid) {
    await audit({
      actorId: "system",
      action: "lawfirm.webhook.signature_failed",
      target: `lawfirm:${lawFirmId}`,
      result: "denied",
      metadata: { lawFirmName: lawFirm.name },
    });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Parse the payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { enterpriseId, eventType, amountEgp, reference, timestamp } = payload;

  if (!enterpriseId || !eventType) {
    return NextResponse.json(
      { error: "Missing required fields: enterpriseId, eventType" },
      { status: 400 }
    );
  }

  // ── AUD-018: Webhook idempotency ──
  // If the law firm sends a webhook with a `reference` field that already
  // exists in our database, return 200 (idempotent success) but DO NOT
  // process the event again. This prevents duplicate ledger events /
  // balance increments if the law firm retries a webhook due to network
  // timeout. The `reference` column has a @unique constraint in the
  // schema, so `findUnique` is the canonical lookup. NULL references
  // are skipped (legacy webhooks without a reference still go through).
  if (reference) {
    const existing = await (db as any).lawFirmWebhookEvent.findUnique({
      where: { reference },
      select: { id: true, eventType: true, receivedAt: true },
    });
    if (existing) {
      await audit({
        actorId: "system",
        action: "lawfirm.webhook.idempotent_replay",
        target: `enterprise:${enterpriseId}`,
        result: "allowed",
        metadata: {
          lawFirmId,
          reference,
          originalEventId: existing.id,
          originalEventType: existing.eventType,
          originalReceivedAt: existing.receivedAt,
          note: "Duplicate webhook reference — returning 200 without reprocessing (AUD-018 idempotency).",
        },
      });
      return NextResponse.json(
        {
          acknowledged: true,
          idempotent: true,
          eventId: existing.id,
          eventType: existing.eventType,
          message: "Webhook with this reference already processed — idempotent replay (AUD-018).",
        },
        { status: 200 }
      );
    }
  }

  // Persist the webhook event
  const event = await (db as any).lawFirmWebhookEvent.create({
    data: {
      lawFirmId,
      enterpriseId,
      eventType,
      amountEgp: amountEgp ?? null,
      reference: reference ?? null,
      rawPayload: rawBody,
      signatureValid: true,
    },
  });

  // Process the event type
  if (["escrow_received", "escrow_released", "escrow_refunded", "balance_assertion"].includes(eventType)) {
    await appendLedgerEvent(db as any, {
      enterpriseId,
      eventType: "escrow_balance_assertion",
      payload: {
        action: eventType,
        amountEgp: amountEgp ?? null,
        reference: reference ?? null,
        lawFirmId,
        lawFirmName: lawFirm.name,
        webhookEventId: event.id,
        timestamp: timestamp ?? new Date().toISOString(),
      },
      actorId: "system",
    });

    // Update enterprise raisedEgp for escrow_received
    if (eventType === "escrow_received" && amountEgp) {
      await db.enterprise.update({
        where: { id: enterpriseId },
        data: { raisedEgp: { increment: amountEgp } },
      });
    }
  }

  await audit({
    actorId: "system",
    action: "lawfirm.webhook.received",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      lawFirmId,
      lawFirmName: lawFirm.name,
      eventType,
      amountEgp: amountEgp ?? null,
      reference: reference ?? null,
      webhookEventId: event.id,
    },
  });

  return NextResponse.json({
    acknowledged: true,
    eventId: event.id,
    eventType,
    processedAt: new Date().toISOString(),
  });
});

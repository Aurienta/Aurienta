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

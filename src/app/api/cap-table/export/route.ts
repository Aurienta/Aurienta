// GET /api/cap-table/export?enterpriseId=xxx
//
// Returns the cap table as an OCF (Open Cap Table Format) v1.0.0 document:
//
//   {
//     ocf_version: "1.0.0",
//     generated_at: ISO8601,
//     issuer: { object_type: "ISSUER", id, legal_name, ticker, currency: "EGP" },
//     stakeholders:   OcfStakeholder[]   — one per User with an OwnershipRecord
//     stock_classes:  OcfStockClass[]    — preferred / common_founder / common_restricted
//     stock_plans:    OcfStockPlan[]     — workforce ESOP pool (unissued shares)
//     transactions:   OcfTransaction[]   — EQUITY_ISSUED + CAP_TABLE_SNAPSHOT
//                                          events reconstructed from the ledger chain
//     constitutional_anchor: {
//       constitutional_hash:  SHA3-256 (Art. I — Non-amendable),
//       ledger_chain_tip:     { sequence, payload_hash } of the latest
//                              cap_table_snapshot event,
//       cap_table_payload_hash: SHA3-256 over the exported arrays
//     }
//   }
//
// The constitutional_anchor is an AURIENTA-specific extension to the OCF
// spec — every transaction also carries its `ledger_payload_hash` +
// `cre_decision_token`, so any downstream AURIENTA instance can verify
// the chain integrity of an imported cap table.
//
// Role gate: same as GET /api/cap-table — capital_partner,
// founding_operator, board_member, company_owner, or aurienta_rep.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import {
  exportOcf,
  canViewCapTable,
  CAP_TABLE_VIEWER_ROLES,
} from "@/lib/aurienta/cap-table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "enterpriseId query parameter is required",
      },
      { status: 400 }
    );
  }

  // ── Verify the enterprise exists ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // ── Role gate — only cap-table viewers (or AURIENTA Reps) ──
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m: { role: string }) => m.role === "aurienta_rep");
  const viewer = isPlatformAdmin || (await canViewCapTable(user.id, enterpriseId));
  if (!viewer) {
    const membership = (user.memberships ?? []).find(
      (m: { enterpriseId: string; role: string }) => m.enterpriseId === enterpriseId
    );
    await audit({
      actorId: user.id,
      action: "cap_table.export_denied",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "insufficient_role",
      metadata: { role: membership?.role ?? null },
    });
    return NextResponse.json(
      {
        error: "Forbidden: insufficient role to export this cap table",
        code: "forbidden",
        requiredRoles: [...CAP_TABLE_VIEWER_ROLES],
        yourRole: membership?.role ?? null,
      },
      { status: 403 }
    );
  }

  const ocf = await exportOcf(enterpriseId);

  await audit({
    actorId: user.id,
    action: "cap_table.export_ocf",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      ocfVersion: ocf.ocf_version,
      stakeholdersCount: ocf.stakeholders.length,
      stockClassesCount: ocf.stock_classes.length,
      transactionsCount: ocf.transactions.length,
      ledgerChainTipSequence: ocf.constitutional_anchor.ledger_chain_tip?.sequence ?? null,
    },
  });

  // Return the OCF doc as a downloadable JSON file when the caller sends
  // `?download=1`. Otherwise return it inline (consumable by JS fetch).
  const wantDownload = url.searchParams.get("download") === "1";
  if (wantDownload) {
    const filename = `cap-table-${enterprise.slug}-ocf-${new Date().toISOString().split("T")[0]}.json`;
    return new Response(JSON.stringify(ocf, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    scenario: "ocf_export",
    enterprise: { id: enterprise.id, name: enterprise.name, slug: enterprise.slug },
    ocf,
  });
}, "GET /api/cap-table/export");

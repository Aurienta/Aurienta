// AURIENTA — AREI public read endpoint
// ═══════════════════════════════════════════════════════════════
// GET /api/arei
//
// Returns the latest AREI snapshot, the 30-day history (oldest-first
// for charting), and the current constituent breakdown. Any authed
// user may read — AREI is an informational benchmark, NOT investment
// advice (see disclaimer in the response payload).
//
// If today's snapshot has not been computed yet, the endpoint
// triggers a fresh computation (lazy evaluation). This keeps the
// dashboard responsive even if the daily cron has not yet fired.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import {
  computeAreiSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  getConstituents,
} from "@/lib/aurienta/arei";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HISTORY_DAYS = 30;
const DISCLAIMER =
  "AREI is an informational benchmark, NOT investment advice. Past performance does not indicate future results.";

function cairoDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const GET = withErrorHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const today = cairoDate();
  let snapshot = await getLatestSnapshot();

  // Lazy-eval: if today's snapshot is missing, compute it on demand.
  if (!snapshot || snapshot.date !== today) {
    snapshot = await computeAreiSnapshot();
  }

  const history = await getSnapshotHistory(HISTORY_DAYS);
  const constituents = await getConstituents();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await audit({
    actorId: user.id,
    action: "arei.read",
    target: "arei:latest",
    result: "allowed",
    metadata: {
      snapshotDate: snapshot?.date ?? null,
      indexValue: snapshot?.indexValue ?? null,
      constituentCount: snapshot?.constituentCount ?? 0,
    },
    ip,
    userAgent,
  }).catch(() => {
    // Audit logging must never break the read path.
  });

  return NextResponse.json({
    ok: true,
    disclaimer: DISCLAIMER,
    snapshot,
    history,
    constituents,
  });
});

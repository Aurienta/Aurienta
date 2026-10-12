import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  computeAreiSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  getConstituents,
  type AreiConstituent,
} from "@/lib/aurienta/arei";
import type { AreiSnapshot } from "@prisma/client";
import { AreiClient } from "@/components/dashboard/roadmap/arei-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "AURIENTA Real-Economy Index (AREI) · AURIENTA",
  description:
    "Daily informational benchmark tracking all active AURIENTA enterprises, weighted by Constitutional Health Score.",
};

const HISTORY_DAYS = 30;

function cairoDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default async function AreiPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent("/dashboard/arei")}`);

  // Lazy-eval today's snapshot — if it's missing, compute on demand so the
  // page never renders an empty state when the daily cron hasn't fired yet.
  const today = cairoDate();
  let snapshot: AreiSnapshot | null = await getLatestSnapshot();
  if (!snapshot || snapshot.date !== today) {
    snapshot = await computeAreiSnapshot();
  }

  const history: AreiSnapshot[] = await getSnapshotHistory(HISTORY_DAYS);
  const constituents: AreiConstituent[] = await getConstituents();

  // RBAC — only aurienta_rep sees the "Recompute" button.
  const canRecompute =
    user.memberships.some((m) => m.role === "aurienta_rep") ||
    user.primaryIntent === "aurienta_rep";

  // Snapshot is guaranteed after the lazy compute above, but we type-narrow
  // for the client component so it doesn't have to handle null at the top.
  const safeSnapshot: AreiSnapshot | null = snapshot;

  return (
    <AreiClient
      snapshot={safeSnapshot}
      history={history}
      constituents={constituents}
      canRecompute={canRecompute}
    />
  );
}

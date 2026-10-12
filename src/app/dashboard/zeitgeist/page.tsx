import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  computeZeitgeistSnapshot,
  getHistory,
  getLatestSnapshot,
} from "@/lib/aurienta/zeitgeist";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { ZeitgeistClient } from "@/components/dashboard/roadmap/zeitgeist-client";
import { Waves } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Constitutional Zeitgeist · AURIENTA",
  description:
    "Daily platform sentiment — the pulse of the constitutional economy. Informational, NOT investment advice.",
};

export default async function ZeitgeistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/zeitgeist");

  // Ensure today's snapshot exists (compute if missing).
  let latest = await getLatestSnapshot();
  if (!latest) {
    try {
      latest = await computeZeitgeistSnapshot();
    } catch (e) {
      console.error("[zeitgeist] compute failed on page load:", e);
    }
  }

  const history = await getHistory(30);

  const serializedLatest = latest
    ? {
        date: latest.date,
        sentimentScore: latest.sentimentScore,
        confidencePct: latest.confidencePct,
        signalCount: latest.signalCount,
        topTheme: latest.topTheme ?? "Quiet day",
        summaryText: latest.summaryText,
        computedAt: latest.computedAt.toISOString(),
      }
    : null;

  const serializedHistory = history
    .slice()
    .reverse() // chronological order for the chart
    .map((h) => ({
      date: h.date,
      sentimentScore: h.sentimentScore,
      confidencePct: h.confidencePct,
      signalCount: h.signalCount,
      topTheme: h.topTheme ?? "Quiet day",
    }));

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Constitutional Zeitgeist"
        icon={Waves}
        title="The pulse of the constitutional economy"
        subtitle="Daily platform sentiment — synthesized from governance, operational, and reputational signals across the last 24 hours. Sentiment is informational, NOT investment advice."
      />

      <ZeitgeistClient latest={serializedLatest} history={serializedHistory} />
    </div>
  );
}

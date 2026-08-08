import { db } from "@/lib/db";
import { egp } from "@/lib/aurienta/format";
import { Activity, Share2, Banknote, FileCheck, Vote, GraduationCap } from "lucide-react";
import { timeAgo } from "@/lib/aurienta/format";

const ICONS: Record<string, React.ElementType> = {
  share_issued: Share2,
  funds_received: Banknote,
  milestone_released: FileCheck,
  expense_approved: FileCheck,
  proposal_executed: Vote,
  cre_decision: Activity,
  graduation: GraduationCap,
  share_transferred: Share2,
  dividend_paid: Banknote,
};

const LABELS: Record<string, string> = {
  share_issued: "Equity units issued",
  funds_received: "Funds received in Law Firm Client Account",
  milestone_released: "Milestone released",
  expense_approved: "Expense approved",
  proposal_executed: "Proposal executed",
  cre_decision: "CRE decision logged",
  graduation: "Enterprise graduated",
  share_transferred: "Units transferred",
  dividend_paid: "Dividend distributed",
};

export async function ActivityFeed({
  events,
}: {
  events: {
    id: string;
    eventType: string;
    payload: string;
    timestamp: Date;
    enterprise: { name: string; tier: string } | null;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Activity className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-lg font-semibold">Recent activity</h2>
      </div>
      {events.length === 0 ? (
        <p className="py-6 text-center font-sans text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ol className="relative flex flex-col gap-4 border-l border-gold/10 pl-4">
          {events.map((e) => {
            const Icon = ICONS[e.eventType] ?? Activity;
            let detail = "";
            try {
              const p = JSON.parse(e.payload);
              if (p.amount) detail = egp(p.amount, { compact: p.amount > 100_000 });
              else if (p.equityUnits) detail = `${p.equityUnits.toLocaleString()} Equity Units`;
              else if (p.title) detail = p.title;
              else if (p.action) detail = p.action;
            } catch {}
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold/20 bg-background">
                  <Icon className="h-2.5 w-2.5 text-gold" />
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-sans text-xs font-medium text-foreground">
                    {LABELS[e.eventType] ?? e.eventType}
                  </p>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground/80">
                    {timeAgo(e.timestamp)}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">
                  {e.enterprise?.name ?? "Platform"}
                  {detail && <span className="text-foreground/70"> · {detail}</span>}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

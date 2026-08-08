import { cn } from "@/lib/utils";

// Status → { label, dot color, ring/border color }
const MILESTONE_STATUS: Record<
  string,
  { label: string; dot: string; text: string; ring: string; bg: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
    ring: "border-gold/15",
    bg: "bg-muted/40",
  },
  evidence_submitted: {
    label: "Evidence submitted",
    dot: "bg-gold",
    text: "text-gold-light",
    ring: "border-gold/40",
    bg: "bg-gold/10",
  },
  board_review: {
    label: "Board review",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-400/30",
    bg: "bg-amber-400/10",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/30",
    bg: "bg-emerald-400/10",
  },
  released: {
    label: "Released",
    dot: "bg-emerald-500",
    text: "text-emerald-300",
    ring: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-destructive",
    text: "text-destructive",
    ring: "border-destructive/30",
    bg: "bg-destructive/10",
  },
};

export function milestoneStatus(s: string) {
  return MILESTONE_STATUS[s] ?? MILESTONE_STATUS.pending;
}

const ENTERPRISE_STATUS: Record<string, { label: string; text: string; dot: string }> = {
  draft: { label: "Draft", text: "text-muted-foreground", dot: "bg-muted-foreground/60" },
  fundraising_active: {
    label: "Capital Formation Active",
    text: "text-gold-light",
    dot: "bg-gold",
  },
  fundraising_closed: { label: "Capital Formation closed", text: "text-foreground", dot: "bg-gold/60" },
  active: { label: "Active", text: "text-emerald-300", dot: "bg-emerald-400" },
  graduation_pending: {
    label: "Graduation pending",
    text: "text-gold-light",
    dot: "bg-gold",
  },
  graduated: { label: "Sovereign", text: "text-emerald-300", dot: "bg-emerald-500" },
};

export function enterpriseStatus(s: string) {
  return ENTERPRISE_STATUS[s] ?? ENTERPRISE_STATUS.draft;
}

export function HealthPill({ rating }: { rating: string | null }) {
  if (!rating) return null;
  const tone =
    rating.startsWith("AA") || rating.startsWith("AAA")
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : rating.startsWith("A") || rating.startsWith("BBB")
        ? "border-gold/30 bg-gold/10 text-gold-light"
        : "border-amber-400/30 bg-amber-400/10 text-amber-300";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs font-semibold",
        tone
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {rating}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-gradient px-2.5 py-0.5 font-serif text-[11px] font-semibold text-black">
      Tier {tier}
    </span>
  );
}

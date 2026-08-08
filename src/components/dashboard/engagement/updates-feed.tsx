"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Newspaper,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Loader2,
  Building2,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type UpdateRow = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSlug: string;
  title: string;
  body: string;
  attachmentsCid: string | null;
  aiSummary: string | null;
  aiAudienceCapital: string | null;
  aiSentiment: string | null;
  isMilestone: boolean;
  milestoneType: string | null;
  createdAt: string;
  author: {
    legalName: string;
    avatarColor: string;
    primaryIntent: string | null;
  };
};

type EnterpriseOption = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Props = {
  initialUpdates: UpdateRow[];
  enterprises: EnterpriseOption[];
  canPost: boolean;
};

/**
 * UpdatesFeed — gold-themed feed of enterprise updates across all of the
 * signed-in user's enterprises. Each card shows the title, author, date,
 * Brain AI summary badge, sentiment indicator (green/amber/red), and a
 * collapsible body. Founding operators / managers / board members /
 * company owners see a "Post update" button that opens a dialog which
 * submits to /api/enterprise-updates.
 */
export function UpdatesFeed({ initialUpdates, enterprises, canPost }: Props) {
  const [updates, setUpdates] = React.useState<UpdateRow[]>(initialUpdates);
  const [open, setOpen] = React.useState(false);
  const reduceMotion = useReducedMotion();

  const handlePosted = (row: UpdateRow) => {
    setUpdates((prev) => [row, ...prev]);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
            <Newspaper className="h-4 w-4 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold">Updates feed</h2>
            <p className="font-sans text-xs text-muted-foreground">
              {updates.length} update{updates.length === 1 ? "" : "s"} across {enterprises.length} enterprise{enterprises.length === 1 ? "" : "s"} · Brain AI summarized
            </p>
          </div>
        </div>

        {canPost && enterprises.length > 0 && (
          <PostUpdateDialog
            enterprises={enterprises}
            open={open}
            onOpenChange={setOpen}
            onPosted={handlePosted}
          />
        )}
      </div>

      {/* Feed */}
      {updates.length === 0 ? (
        <Card className="border-gold/12 bg-background/40">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Newspaper className="h-10 w-10 text-gold/30" />
            <div>
              <p className="font-serif text-base font-semibold">No updates yet</p>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                {canPost
                  ? "Post the first update to keep your capital partners informed."
                  : "When founders post updates, they will appear here with a Brain AI summary."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {updates.map((u) => (
              <motion.li
                key={u.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
              >
                <UpdateCard update={u} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

// ── Update card ──
function UpdateCard({ update }: { update: UpdateRow }) {
  const [expanded, setExpanded] = React.useState(false);
  const sentiment = (update.aiSentiment ?? "neutral") as "positive" | "neutral" | "negative";

  return (
    <Card
      className={cn(
        "border-gold/12 bg-background/40 transition-colors hover:border-gold/20",
        update.isMilestone && "border-gold/40 bg-gold/[0.05]"
      )}
    >
      <CardHeader className="pb-3">
        {/* Enterprise + author row */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/enterprise/${update.enterpriseSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.04] px-2.5 py-1 font-sans text-[11px] text-gold-light transition-colors hover:border-gold/40 hover:bg-gold/[0.08]"
          >
            <Building2 className="h-3 w-3" />
            {update.enterpriseName}
          </Link>
          {update.isMilestone && (
            <Badge className="border-gold/40 bg-gold/15 text-[10px] uppercase tracking-wider text-gold-light">
              <Trophy className="mr-1 h-2.5 w-2.5" />
              {update.milestoneType ?? "milestone"}
            </Badge>
          )}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/85">
            {formatDate(new Date(update.createdAt))}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2 font-serif text-base font-semibold leading-snug sm:text-lg">
          {update.title}
        </h3>

        {/* Author + sentiment row */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{
                background: `linear-gradient(135deg, ${update.author.avatarColor}, #b8860b)`,
                color: "#0a0a0b",
              }}
            >
              {update.author.legalName.charAt(0)}
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              {update.author.legalName}
            </span>
          </span>
          <SentimentBadge sentiment={sentiment} />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* AI summary badge */}
        {update.aiSummary && (
          <div className="mb-3 rounded-xl border border-gold/15 bg-gold/[0.03] px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-light/80">
                Brain AI summary
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-foreground/90">
              {update.aiSummary}
            </p>
          </div>
        )}

        {/* Collapsible body */}
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "font-sans text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap",
              !expanded && "line-clamp-3"
            )}
          >
            {update.body}
          </p>
          {update.body.length > 240 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 self-start font-sans text-xs text-gold transition-colors hover:text-gold-light"
            >
              {expanded ? (
                <>
                  Show less <ChevronDown className="h-3 w-3 rotate-180" />
                </>
              ) : (
                <>
                  Read more <ChevronRight className="h-3 w-3" />
                </>
              )}
            </button>
          )}
          {update.attachmentsCid && (
            <div className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80">
              <Paperclip className="h-3 w-3 text-gold/70" />
              ipfs://{update.attachmentsCid.slice(0, 24)}…
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sentiment badge ──
function SentimentBadge({ sentiment }: { sentiment: "positive" | "neutral" | "negative" }) {
  const config = {
    positive: {
      label: "Positive",
      icon: TrendingUp,
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    },
    neutral: {
      label: "Neutral",
      icon: Minus,
      className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    },
    negative: {
      label: "Negative",
      icon: TrendingDown,
      className: "border-red-400/30 bg-red-400/10 text-red-300",
    },
  }[sentiment];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        config.className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

// ── Post update dialog ──
function PostUpdateDialog({
  enterprises,
  open,
  onOpenChange,
  onPosted,
}: {
  enterprises: EnterpriseOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPosted: (row: UpdateRow) => void;
}) {
  const [enterpriseId, setEnterpriseId] = React.useState(enterprises[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!enterpriseId || !title.trim() || !body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enterprise-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to post update");
      }
      const ent = enterprises.find((e) => e.id === enterpriseId)!;
      const row: UpdateRow = {
        id: data.update.id,
        enterpriseId,
        enterpriseName: ent.name,
        enterpriseSlug: ent.slug,
        title: title.trim(),
        body: body.trim(),
        attachmentsCid: null,
        aiSummary: data.update.aiSummary,
        aiAudienceCapital: data.update.aiSummary,
        aiSentiment: data.update.aiSentiment,
        isMilestone: false,
        milestoneType: null,
        createdAt: data.update.createdAt,
        author: {
          legalName: "You",
          avatarColor: "#d4af37",
          primaryIntent: null,
        },
      };
      onPosted(row);
      if (data.milestone) {
        toast.success(`Milestone reached — ${data.milestone.milestoneType} celebration posted!`);
      } else {
        toast.success(`Update posted · ${data.notifiedPartners} capital partners notified.`);
      }
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-gold-gradient text-black hover:opacity-90"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Post update
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gold/20 bg-popover sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Newspaper className="h-4 w-4 text-gold" />
            Post an enterprise update
          </DialogTitle>
          <DialogDescription className="font-sans text-xs">
            Capital partners will be notified. The Brain AI will summarize your update and
            tag its sentiment. If your enterprise has just crossed a capital formation milestone
            (25/50/75/100%), a celebratory update will be auto-posted as well.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ent-select" className="font-sans text-xs text-muted-foreground">
              Enterprise
            </Label>
            <Select value={enterpriseId} onValueChange={setEnterpriseId}>
              <SelectTrigger id="ent-select" className="border-gold/20">
                <SelectValue placeholder="Select enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · Tier {e.tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title-input" className="font-sans text-xs text-muted-foreground">
              Title
            </Label>
            <Input
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Q3 revenue update — 18% above forecast"
              className="border-gold/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body-input" className="font-sans text-xs text-muted-foreground">
              Body
            </Label>
            <Textarea
              id="body-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={16000}
              placeholder="Share what's happened since the last update, key numbers, wins, and what's next for capital partners."
              className="border-gold/20"
            />
            <span className="self-end font-mono text-[10px] text-muted-foreground/75">
              {body.length} / 16000
            </span>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="border-gold/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !body.trim()}
            className="bg-gold-gradient text-black hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Brain AI summarizing…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Post &amp; summarize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Local date formatter ──
function formatDate(d: Date): string {
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

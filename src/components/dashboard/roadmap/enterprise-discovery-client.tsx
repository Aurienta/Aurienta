"use client";

// AURIENTA — Enterprise Discovery Client (Roadmap Phase 1)
// ═══════════════════════════════════════════════════════════════
// Polished UI for the Enterprise Discovery recommendation engine.
// Partners manually select each enterprise — AURIENTA provides
// information only (compliant with Egyptian law).
//
// Layout:
//   - Header + compliance disclaimer banner
//   - Left: profile settings card (risk appetite, sectors, tiers, etc.)
//   - Right: matches list (cards with score, reasons, raised/goal)
//
// Indigo/purple theme (light, NOT blue).

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Telescope,
  Sparkles,
  ShieldCheck,
  Loader2,
  Save,
  X,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  Info,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp } from "@/lib/aurienta/format";
import {
  SECTORS,
  HEALTH_RATINGS,
  TIER_META,
} from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";

// ─── Types (shared with the server component) ──────────────────────────

export type EnterpriseSummary = {
  id: string;
  slug: string;
  name: string;
  tier: string;
  sector: string;
  healthRating: string | null;
  equityUnitPriceEgp: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  minInvestmentEgp: number;
  status: string;
  stage: string;
};

export type DiscoveryProfileClient = {
  riskAppetite: string;
  preferredSectors: string;
  preferredTiers: string;
  minHealthRating: string;
  minInvestmentEgp: number;
  maxInvestmentEgp: number;
  targetDiversification: number;
  // Optional timestamp surfaced by the server so the profile form can re-sync
  // when the underlying data changes (used as a useEffect dependency).
  updatedAt?: string;
};

export type DiscoveryMatchClient = {
  id: string;
  enterpriseId: string;
  matchScore: number;
  matchReasons: string; // JSON-encoded string[]
  dismissed: boolean;
  invested: boolean;
  enterprise: EnterpriseSummary | null;
};

type Props = {
  user: { legalName: string; sovereignTrustScore: number };
  profile: DiscoveryProfileClient | null;
  matches: DiscoveryMatchClient[];
};

// ─── Constants ─────────────────────────────────────────────────────────

const RISK_APPETITE_LABELS: Record<string, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  growth: "Growth",
  founder_aligned: "Founder-aligned",
};

const ALL_TIERS = ["A", "B", "C", "D", "E", "F"] as const;

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function safeParseReasons(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

// ─── Score color helpers ───────────────────────────────────────────────

function scoreColor(score: number): { text: string; ring: string; bg: string } {
  if (score >= 75)
    return {
      text: "text-emerald-700",
      ring: "text-emerald-500",
      bg: "bg-emerald-50 border-emerald-200",
    };
  if (score >= 50)
    return {
      text: "text-indigo-700",
      ring: "text-indigo-500",
      bg: "bg-indigo-50 border-indigo-200",
    };
  if (score >= 30)
    return {
      text: "text-amber-700",
      ring: "text-amber-500",
      bg: "bg-amber-50 border-amber-200",
    };
  return {
    text: "text-rose-700",
    ring: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
  };
}

// ─── Main component ────────────────────────────────────────────────────

export function EnterpriseDiscoveryClient({ user, profile, matches }: Props) {
  const initial: DiscoveryProfileClient = profile ?? {
    riskAppetite: "balanced",
    preferredSectors: "",
    preferredTiers: "A,B,C",
    minHealthRating: "BBB",
    minInvestmentEgp: 50,
    maxInvestmentEgp: 10000,
    targetDiversification: 5,
  };

  const [form, setForm] = React.useState<DiscoveryProfileClient>(initial);
  const [saving, setSaving] = React.useState(false);
  const [matchState, setMatchState] =
    React.useState<DiscoveryMatchClient[]>(matches);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(
    null
  );

  // Sync incoming props → state when the page reloads data.
  React.useEffect(() => {
    setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.riskAppetite, profile?.preferredTiers, profile?.updatedAt]);

  React.useEffect(() => {
    setMatchState(matches);
  }, [matches]);

  // ── Profile form handlers ──
  const selectedTiers = parseCommaList(form.preferredTiers);
  const selectedSectors = parseCommaList(form.preferredSectors);

  function toggleTier(tier: string) {
    const set = new Set(selectedTiers);
    if (set.has(tier)) set.delete(tier);
    else set.add(tier);
    setForm((f) => ({ ...f, preferredTiers: Array.from(set).join(",") }));
  }

  function toggleSector(sector: string) {
    const set = new Set(selectedSectors);
    if (set.has(sector)) set.delete(sector);
    else set.add(sector);
    setForm((f) => ({ ...f, preferredSectors: Array.from(set).join(",") }));
  }

  async function saveProfile() {
    if (form.minInvestmentEgp < 50) {
      toast.error("Minimum investment must be at least 50 EGP");
      return;
    }
    if (form.maxInvestmentEgp < form.minInvestmentEgp) {
      toast.error("Max investment must be greater than minimum");
      return;
    }
    setSaving(true);
    try {
      const res = await csrfFetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        profile?: DiscoveryProfileClient;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to save profile");
      }
      toast.success("Discovery profile saved", {
        description: "Your recommendations have been refreshed.",
      });
      // Trigger a soft reload of matches by refetching the page.
      if (data.profile) setForm(data.profile);
      // Refetch matches client-side.
      void refreshMatches();
    } catch (e) {
      toast.error("Could not save profile", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function refreshMatches() {
    try {
      const res = await fetch("/api/discovery", { cache: "no-store" });
      const data = (await res.json()) as {
        matches?: DiscoveryMatchClient[];
      };
      if (res.ok && data.matches) {
        setMatchState(data.matches);
      }
    } catch {
      // Silent — toast was already shown for the main action.
    }
  }

  // ── Match actions ──
  async function patchMatch(
    matchId: string,
    action: "dismiss" | "invested"
  ) {
    setActionLoadingId(matchId);
    try {
      const res = await csrfFetch(`/api/discovery/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Action failed");
      }
      // Optimistically update local state.
      setMatchState((curr) =>
        curr.map((m) =>
          m.id === matchId
            ? {
                ...m,
                dismissed: action === "dismiss" ? true : m.dismissed,
                invested: action === "invested" ? true : m.invested,
              }
            : m
        )
      );
      toast.success(
        action === "dismiss"
          ? "Recommendation dismissed"
          : "Marked as investing",
        {
          description:
            action === "dismiss"
              ? "You can revisit this enterprise from the market page."
              : "Continue your Capital Participation from Opportunities.",
        }
      );
    } catch (e) {
      toast.error("Could not update recommendation", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Filter the list — hide dismissed by default (toggle to show).
  const [showDismissed, setShowDismissed] = React.useState(false);
  const visibleMatches = matchState.filter(
    (m) => showDismissed || !m.dismissed
  );

  return (
    <div className="space-y-6">
      <SonnerToaster position="top-right" richColors closeButton />

      {/* ── Header ── */}
      <header className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
            <Telescope className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700/80">
            Roadmap · Phase 1
          </span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
          Enterprise Discovery
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Recommendation engine — you manually select each enterprise. AURIENTA
          provides information, not auto-investment. Welcome,{" "}
          <span className="font-medium text-foreground">
            {user.legalName || "Partner"}
          </span>
          .
        </p>
      </header>

      {/* ── Compliance disclaimer banner ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900">
            Discovery is informational only
          </p>
          <p className="text-xs leading-relaxed text-amber-800/90">
            AURIENTA does not auto-diversify, auto-debit, or manage funds. Each
            investment is your individual decision. This complies with Egyptian
            law — AURIENTA is not a fund manager, not a deposit-taker, and
            never holds your capital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* ── Profile settings card ── */}
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <ShieldCheck className="h-4 w-4" />
              Your discovery profile
            </CardTitle>
            <CardDescription>
              Tune these to re-rank the recommendation list. Saves to your
              DiscoveryProfile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Risk appetite */}
            <div className="space-y-1.5">
              <Label htmlFor="risk-appetite" className="text-indigo-900">
                Risk appetite
              </Label>
              <Select
                value={form.riskAppetite}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, riskAppetite: v }))
                }
              >
                <SelectTrigger id="risk-appetite" className="w-full bg-white">
                  <SelectValue placeholder="Select risk appetite" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RISK_APPETITE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred tiers */}
            <div className="space-y-1.5">
              <Label className="text-indigo-900">Preferred tiers</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_TIERS.map((tier) => {
                  const checked = selectedTiers.includes(tier);
                  return (
                    <label
                      key={tier}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
                        checked
                          ? "border-indigo-300 bg-indigo-100 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-indigo-50"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTier(tier)}
                      />
                      <span className="font-medium">Tier {tier}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {TIER_META[tier]?.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preferred sectors */}
            <div className="space-y-1.5">
              <Label className="text-indigo-900">Preferred sectors</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(SECTORS).map(([key, meta]) => {
                  const checked = selectedSectors.includes(key);
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
                        checked
                          ? "border-purple-300 bg-purple-100 text-purple-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-purple-50"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSector(key)}
                      />
                      <span className="font-medium">{meta.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave empty for sector-neutral ranking.
              </p>
            </div>

            {/* Min health rating */}
            <div className="space-y-1.5">
              <Label htmlFor="min-health" className="text-indigo-900">
                Minimum health rating
              </Label>
              <Select
                value={form.minHealthRating}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, minHealthRating: v }))
                }
              >
                <SelectTrigger id="min-health" className="w-full bg-white">
                  <SelectValue placeholder="Select minimum rating" />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_RATINGS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} {r === "AAA" && "(best)"} {r === "C" && "(lowest)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Investment range */}
            <div className="space-y-2">
              <Label className="text-indigo-900">Investment range (EGP)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Min</span>
                  <Input
                    type="number"
                    min={50}
                    step={50}
                    value={form.minInvestmentEgp}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minInvestmentEgp: Number(e.target.value) || 0,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Max</span>
                  <Input
                    type="number"
                    min={50}
                    step={100}
                    value={form.maxInvestmentEgp}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxInvestmentEgp: Number(e.target.value) || 0,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Target diversification slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-indigo-900">Target diversification</Label>
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-white text-indigo-700"
                >
                  {form.targetDiversification} / 10
                </Badge>
              </div>
              <Slider
                value={[form.targetDiversification]}
                min={1}
                max={10}
                step={1}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    targetDiversification: v[0] ?? 5,
                  }))
                }
                className="text-indigo-500"
              />
              <p className="text-[11px] text-muted-foreground">
                How many enterprises you aim to diversify across (informational
                only — AURIENTA does not auto-diversify).
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save profile & refresh
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* ── Matches list ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-indigo-900">
                Recommended enterprises
              </h2>
              <p className="text-xs text-muted-foreground">
                Ranked by Constitutional Match Score. Review each manually —
                you decide.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDismissed((v) => !v)}
                className="border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
              >
                {showDismissed ? "Hide dismissed" : "Show dismissed"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMatches}
                className="border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {visibleMatches.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="max-h-[28rem] rounded-xl border border-indigo-100 bg-white">
              <div className="space-y-3 p-4">
                {visibleMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onAction={patchMatch}
                    actionLoading={actionLoadingId === m.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Sovereign trust footer */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero Custody</span>
            <span className="text-indigo-200">|</span>
            <span>Manual selection</span>
            <span className="text-indigo-200">|</span>
            <span>
              STS {user.sovereignTrustScore ?? 0} ·{" "}
              {(user.sovereignTrustScore ?? 0) >= 80
                ? "Trusted Contributor"
                : "Active Member"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Match card sub-component ──────────────────────────────────────────

function MatchCard({
  match,
  onAction,
  actionLoading,
}: {
  match: DiscoveryMatchClient;
  onAction: (matchId: string, action: "dismiss" | "invested") => void;
  actionLoading: boolean;
}) {
  const ent = match.enterprise;
  const reasons = safeParseReasons(match.matchReasons);
  const colors = scoreColor(match.matchScore);
  const goal = ent?.fundraisingGoalEgp ?? 0;
  const raised = ent?.raisedEgp ?? 0;
  const raisedPct =
    goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;

  if (!ent) {
    return (
      <Card className="border-dashed border-slate-300 bg-slate-50">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Enterprise details unavailable for match {match.id.slice(-6)}.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border transition-shadow hover:shadow-md",
        match.dismissed
          ? "border-slate-200 bg-slate-50/60 opacity-70"
          : "border-indigo-100 bg-white"
      )}
    >
      <CardContent className="space-y-4 py-4">
        {/* Top row: identity + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/enterprise/${ent.slug}`}
                className="font-serif text-lg font-semibold text-indigo-900 hover:underline"
              >
                {ent.name}
              </Link>
              <Badge
                variant="outline"
                className="border-indigo-200 bg-indigo-50 text-indigo-700"
              >
                Tier {ent.tier} · {TIER_META[ent.tier]?.name ?? ent.tier}
              </Badge>
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-50 text-purple-700"
              >
                {SECTORS[ent.sector]?.label ?? ent.sector}
              </Badge>
              {ent.healthRating && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  {ent.healthRating}
                </Badge>
              )}
              {match.invested && (
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="h-3 w-3" />
                  Investing
                </Badge>
              )}
              {match.dismissed && !match.invested && (
                <Badge variant="secondary" className="bg-slate-200">
                  Dismissed
                </Badge>
              )}
            </div>
            {ent.slug && (
              <p className="font-mono text-[11px] text-muted-foreground">
                /enterprise/{ent.slug}
              </p>
            )}
          </div>

          {/* Score */}
          <div
            className={cn(
              "flex flex-col items-center rounded-lg border px-3 py-2",
              colors.bg
            )}
          >
            <span
              className={cn(
                "font-serif text-2xl font-bold leading-none",
                colors.text
              )}
            >
              {match.matchScore}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              match
            </span>
          </div>
        </div>

        {/* Match reasons */}
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reasons.slice(0, 6).map((r, i) => (
              <Badge
                key={`${i}-${r}`}
                variant="outline"
                className="border-indigo-100 bg-indigo-50/60 px-2 py-0.5 text-[11px] font-normal text-indigo-800"
              >
                {r}
              </Badge>
            ))}
          </div>
        )}

        {/* Fundraising progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Capital formation progress
            </span>
            <span className="font-mono text-foreground">
              {raisedPct}% · {egp(raised, { compact: true })} /{" "}
              {egp(goal, { compact: true })}
            </span>
          </div>
          <Progress
            value={raisedPct}
            className="h-1.5 bg-indigo-100 [&>[data-slot=progress-indicator]]:bg-indigo-500"
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md border border-indigo-50 bg-indigo-50/30 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Equity unit
            </p>
            <p className="font-mono text-sm font-medium text-foreground">
              {egp(ent.equityUnitPriceEgp)}
            </p>
          </div>
          <div className="rounded-md border border-indigo-50 bg-indigo-50/30 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Min entry
            </p>
            <p className="font-mono text-sm font-medium text-foreground">
              {egp(ent.minInvestmentEgp)}
            </p>
          </div>
          <div className="rounded-md border border-indigo-50 bg-indigo-50/30 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Stage
            </p>
            <p className="font-mono text-sm font-medium text-foreground">
              {ent.stage.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-indigo-50 pt-3">
          <Button
            asChild
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Link href="/dashboard/market">
              <ExternalLink className="h-3.5 w-3.5" />
              View enterprise
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <Link href="/dashboard/opportunities">
              <TrendingUp className="h-3.5 w-3.5" />
              Capital Participation
            </Link>
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading || match.invested}
            onClick={() => onAction(match.id, "invested")}
            className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark as investing
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading || match.dismissed}
            onClick={() => onAction(match.id, "dismiss")}
            className="border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="border-dashed border-indigo-200 bg-indigo-50/30">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <Info className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="font-serif text-base font-semibold text-indigo-900">
            No matches yet — adjust your profile
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Try widening your preferred tiers, lowering the minimum health
            rating, or increasing your investment range. Recommendations are
            informational only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton (exported for the page-level loading.tsx) ─────────

export function EnterpriseDiscoverySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

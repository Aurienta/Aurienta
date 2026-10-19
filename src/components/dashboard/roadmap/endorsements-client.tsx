"use client";

// Constitutional Endorsement — client surface.
//
// Reputation-as-collateral, NOT financial staking. Partners ENDORSE
// enterprises with their Sovereign Trust Score (reputation only). Endorsements
// affect STS on resolution (success = +stakeSts, failure = -stakeSts).
//
// Theme: indigo + purple on light bg. NO blue.
//
// Responsibilities:
//  - Show the user's STS + available endorsement capacity (used / max).
//  - "Endorse Enterprise" form (enterprise select + STS slider 1..15 capped
//    by available capacity). POST /api/endorsements. Surface CRE verdict on
//    rejection (reason + policy + decisionToken).
//  - "My Endorsements" list (max-h-[28rem] overflow-y-auto) — cards with
//    enterprise name, stakeSts, outcome badge, stsDelta, dates. "Resolve"
//    success/failure buttons when the user is a manager/founder of the
//    targeted enterprise.
//  - "Endorsements on your enterprises" section (manager view) so founders /
//    managers can see who endorsed them and resolve those endorsements.
//  - Stats card (total endorsements, total STS staked, success rate).
//  - Empty / loading / error states.

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HandCoins,
  Loader2,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import { timeAgo } from "@/lib/aurienta/format";

// ── Types (mirror server-side shapes; declared locally so the client bundle
// doesn't pull in Prisma types).
type Endorsement = {
  id: string;
  endorserId: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  enterpriseSlug: string;
  stakeSts: number;
  active: boolean;
  outcome: "pending" | "success" | "failure";
  stsDelta: number;
  createdAt: string;
  resolvedAt: string | null;
};

type ManagedEnterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  role: string;
};

type ActiveEnterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  tagline: string;
};

type User = {
  id: string;
  legalName: string;
  sovereignTrustScore: number;
  tier: string;
};

type Constants = {
  maxPerUser: number;
  stakeCap: number;
  minSts: number;
};

type CreVerdictResponse = {
  error: string;
  reason?: string;
  policy?: string;
  decisionToken?: string;
};

// ── Outcome badge styling ──
const OUTCOME_META: Record<
  Endorsement["outcome"],
  { label: string; cls: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    cls:
      "border-indigo-400/40 bg-indigo-400/10 text-indigo-600",
    icon: Clock,
  },
  success: {
    label: "Success",
    cls:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  failure: {
    label: "Failure",
    cls: "border-rose-500/40 bg-rose-500/10 text-rose-600",
    icon: XCircle,
  },
};

export function EndorsementsClient(props: {
  user: User;
  myEndorsements: Endorsement[];
  managedEnterprises: ManagedEnterprise[];
  endorsementsOnManagedEnterprises: Endorsement[];
  activeEnterprises: ActiveEnterprise[];
  constants: Constants;
}) {
  const router = useRouter();
  const {
    user,
    myEndorsements,
    managedEnterprises,
    endorsementsOnManagedEnterprises,
    activeEnterprises,
    constants,
  } = props;

  // ── Form state ──
  const [selectedEnterpriseId, setSelectedEnterpriseId] = React.useState<string>("");
  const [stakeSts, setStakeSts] = React.useState<number>(5);
  const [submitting, setSubmitting] = React.useState(false);
  // Verdict error from the last rejection (so we can show policy + decisionToken).
  const [verdictError, setVerdictError] = React.useState<CreVerdictResponse | null>(null);

  // ── Resolve state ── (keyed by endorsement id so multiple buttons don't
  // collide while resolving different endorsements).
  const [resolving, setResolving] = React.useState<Record<string, "success" | "failure" | undefined>>({});

  // ── Derived ──
  const activeCount = myEndorsements.filter((e) => e.active).length;
  const availableSlots = Math.max(0, constants.maxPerUser - activeCount);
  // Cap the slider by available slots * stake cap. If no slots, slider is 0.
  const sliderMax = availableSlots > 0 ? constants.stakeCap : 0;
  const sliderValue = Math.min(stakeSts, sliderMax);
  const selectedEnterprise = activeEnterprises.find((e) => e.id === selectedEnterpriseId);

  // Stats — derived from the user's own endorsements.
  const stats = React.useMemo(() => {
    const total = myEndorsements.length;
    const totalSts = myEndorsements.reduce((s, e) => s + e.stakeSts, 0);
    const resolved = myEndorsements.filter((e) => !e.active);
    const successes = resolved.filter((e) => e.outcome === "success");
    const successRate =
      resolved.length === 0 ? 0 : (successes.length / resolved.length) * 100;
    return { total, totalSts, successRate, resolvedCount: resolved.length };
  }, [myEndorsements]);

  // The set of enterprise IDs the user manages — used to show Resolve buttons.
  const managedIds = React.useMemo(
    () => new Set(managedEnterprises.map((m) => m.id)),
    [managedEnterprises]
  );

  // Reset slider when capacity drops below current value.
  React.useEffect(() => {
    if (stakeSts > sliderMax && sliderMax > 0) setStakeSts(sliderMax);
  }, [sliderMax, stakeSts]);

  // ── Submit handler ──
  async function handleCreate() {
    setVerdictError(null);
    if (!selectedEnterpriseId) {
      toast.error("Select an enterprise", {
        description: "Choose an enterprise to endorse.",
      });
      return;
    }
    if (availableSlots <= 0) {
      toast.error("No endorsement capacity", {
        description: `You already have ${activeCount}/${constants.maxPerUser} active endorsements. Resolve one first.`,
      });
      return;
    }
    if (stakeSts < 1 || stakeSts > constants.stakeCap) {
      toast.error("Invalid stake", {
        description: `Stake must be between 1 and ${constants.stakeCap} STS.`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterpriseId,
          stakeSts,
        }),
      });
      const data = (await res.json()) as CreVerdictResponse & { endorsement?: Endorsement };
      if (!res.ok) {
        setVerdictError(data);
        toast.error("CRE denied endorsement", {
          description: data.reason ?? data.error,
        });
        return;
      }
      toast.success("Endorsement created", {
        description: `Staked ${stakeSts} STS reputation on ${selectedEnterprise?.name ?? "enterprise"}.`,
      });
      setSelectedEnterpriseId("");
      setStakeSts(5);
      router.refresh();
    } catch (e) {
      toast.error("Network error", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Resolve handler ──
  async function handleResolve(
    endorsementId: string,
    outcome: "success" | "failure",
    enterpriseName: string
  ) {
    if (!window.confirm(
      `Resolve this endorsement as ${outcome.toUpperCase()}? ` +
      `The endorser will ${outcome === "success" ? "gain" : "lose"} STS reputation. ` +
      `This cannot be undone.`
    )) {
      return;
    }
    setResolving((prev) => ({ ...prev, [endorsementId]: outcome }));
    try {
      const res = await csrfFetch(`/api/endorsements/${endorsementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const data = (await res.json()) as { error?: string; reason?: string };
      if (!res.ok) {
        toast.error("Could not resolve", {
          description: data.error ?? data.reason ?? "Unknown error",
        });
        return;
      }
      toast.success(outcome === "success" ? "Marked success" : "Marked failure", {
        description: `Endorsement on ${enterpriseName} resolved.`,
      });
      router.refresh();
    } catch (e) {
      toast.error("Network error", { description: (e as Error).message });
    } finally {
      setResolving((prev) => {
        const next = { ...prev };
        delete next[endorsementId];
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ── Header ── */}
      <header className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ThumbsUp className="h-5 w-5 text-indigo-600" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700/80">
            Roadmap · Phase 3
          </span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">
          Constitutional Endorsement
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-sm text-slate-600">
          Reputation-as-collateral — endorse enterprises with your Sovereign Trust Score.
        </p>

        {/* ── Compliance banner (indigo) ── */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-300/60 bg-indigo-100/60 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <p className="font-sans text-sm leading-relaxed text-indigo-900">
            <strong className="font-semibold">Reputation only.</strong>{" "}
            Endorsements affect reputation (STS) only — <strong>NOT</strong> financial staking.
            No dividends, no financial value, no derivatives. This is a merit-based trust network.
          </p>
        </div>

        {/* ── User STS + capacity strip ── */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill
            label="Your STS"
            value={user.sovereignTrustScore}
            sub={`Min ${constants.minSts} to endorse`}
            tone="indigo"
          />
          <StatPill
            label="Capacity used"
            value={`${activeCount} / ${constants.maxPerUser}`}
            sub={`${availableSlots} slot${availableSlots === 1 ? "" : "s"} free`}
            tone="purple"
          />
          <StatPill
            label="Your tier"
            value={user.tier}
            sub="Member tier"
            tone="indigo"
          />
          <StatPill
            label="Max stake"
            value={`${constants.stakeCap} STS`}
            sub="Per endorsement"
            tone="purple"
          />
        </div>
      </header>

      {/* ── Two-column: form (left) + stats (right) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Endorse Enterprise form ── */}
        <section className="lg:col-span-3 rounded-2xl border border-indigo-200/60 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Endorse an enterprise
            </h2>
          </div>
          <p className="mt-1 font-sans text-xs text-slate-500">
            Select an active enterprise and stake a portion of your STS reputation. The stake is locked until the enterprise&apos;s founder / manager resolves the endorsement.
          </p>

          {activeEnterprises.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-indigo-500" />
              <p className="mt-2 font-sans text-sm font-medium text-slate-700">
                No active enterprises available to endorse.
              </p>
              <p className="mt-1 font-sans text-xs text-slate-500">
                You may have already endorsed all eligible enterprises, or no active enterprises match your endorsement criteria.
              </p>
            </div>
          ) : availableSlots <= 0 ? (
            <div className="mt-5 rounded-xl border border-indigo-300/60 bg-indigo-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-indigo-600" />
                <div className="flex-1">
                  <p className="font-sans text-sm font-medium text-indigo-900">
                    Endorsement capacity reached
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-indigo-700">
                    You have {activeCount} of {constants.maxPerUser} active endorsements. Resolve an existing one to free up a slot.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-5">
              {/* Enterprise select */}
              <div>
                <Label
                  htmlFor="endorsement-enterprise"
                  className="text-xs uppercase tracking-wider text-slate-500"
                >
                  Enterprise to endorse
                </Label>
                <select
                  id="endorsement-enterprise"
                  value={selectedEnterpriseId}
                  onChange={(e) => setSelectedEnterpriseId(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 font-sans text-sm text-slate-900 shadow-xs transition-colors hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Select an enterprise…</option>
                  {activeEnterprises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — Tier {e.tier} · {e.sector}
                    </option>
                  ))}
                </select>
                {selectedEnterprise?.tagline && (
                  <p className="mt-1.5 font-sans text-xs text-slate-500">
                    {selectedEnterprise.tagline}
                  </p>
                )}
              </div>

              {/* STS slider */}
              <div>
                <div className="flex items-baseline justify-between">
                  <Label
                    htmlFor="endorsement-stake"
                    className="text-xs uppercase tracking-wider text-slate-500"
                  >
                    Stake STS (reputation)
                  </Label>
                  <span className="font-serif text-2xl font-semibold text-indigo-700">
                    {sliderValue}
                  </span>
                </div>
                <Slider
                  id="endorsement-stake"
                  min={1}
                  max={sliderMax || 1}
                  step={1}
                  value={[sliderValue]}
                  onValueChange={(v) => setStakeSts(Array.isArray(v) ? (v[0] ?? 1) : v)}
                  className="mt-3"
                />
                <div className="mt-1 flex items-center justify-between font-sans text-[11px] text-slate-400">
                  <span>1 STS (minimum)</span>
                  <span>{constants.stakeCap} STS (maximum)</span>
                </div>
                <p className="mt-2 font-sans text-xs text-slate-500">
                  On resolution: <span className="font-medium text-emerald-600">success = +{sliderValue} STS</span>,{" "}
                  <span className="font-medium text-rose-600">failure = −{sliderValue} STS</span>. Reputation only — no financial value.
                </p>
              </div>

              {/* CRE verdict rejection (if any) */}
              {verdictError && (
                <div className="rounded-xl border border-rose-300/60 bg-rose-50 p-4">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <p className="font-sans text-sm font-medium text-rose-900">
                        CRE denial — {verdictError.reason ?? verdictError.error}
                      </p>
                      {verdictError.policy && (
                        <p className="mt-1 font-sans text-xs text-rose-700">
                          Policy:{" "}
                          <code className="rounded bg-rose-100 px-1 py-0.5 font-mono text-[10px]">
                            {verdictError.policy}
                          </code>
                        </p>
                      )}
                      {verdictError.decisionToken && (
                        <p className="mt-1 font-mono text-[10px] text-rose-500/80">
                          decision token: {verdictError.decisionToken.slice(0, 36)}…
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedEnterpriseId("");
                    setStakeSts(5);
                    setVerdictError(null);
                  }}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting || !selectedEnterpriseId || availableSlots <= 0}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4" /> Endorse with {sliderValue} STS
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── Stats card ── */}
        <aside className="lg:col-span-2 rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-purple-600" />
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Your endorsement footprint
            </h2>
          </div>
          <p className="mt-1 font-sans text-xs text-slate-500">
            Aggregate over your active + resolved endorsements.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile
              label="Total endorsements"
              value={stats.total}
              sub={`${activeCount} active`}
            />
            <StatTile
              label="Total STS staked"
              value={stats.totalSts}
              sub="Across all outcomes"
            />
            <StatTile
              label="Resolved"
              value={stats.resolvedCount}
              sub="With verdict"
            />
            <StatTile
              label="Success rate"
              value={`${stats.successRate.toFixed(0)}%`}
              sub={stats.resolvedCount === 0 ? "No data yet" : `${stats.resolvedCount} resolved`}
            />
          </div>
        </aside>
      </div>

      {/* ── My Endorsements ── */}
      <section className="rounded-2xl border border-indigo-200/60 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              My endorsements
            </h2>
          </div>
          <Badge
            variant="outline"
            className="border-indigo-200 text-indigo-700"
          >
            {myEndorsements.length} total
          </Badge>
        </div>

        {myEndorsements.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={ThumbsUp}
              title="No Endorsements Yet"
              description="Endorse enterprises with your Sovereign Trust Score to build the constitutional trust network."
            />
          </div>
        ) : (
          <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {myEndorsements.map((e) => (
              <EndorsementCard
                key={e.id}
                endorsement={e}
                canResolve={managedIds.has(e.enterpriseId)}
                resolving={resolving[e.id]}
                onResolve={(outcome) =>
                  handleResolve(e.id, outcome, e.enterpriseName)
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Manager view: endorsements on enterprises I manage ── */}
      {managedEnterprises.length > 0 && (
        <section className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-white to-purple-50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-purple-600" />
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Endorsements on your enterprises
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-purple-200 text-purple-700"
            >
              {endorsementsOnManagedEnterprises.length} total
            </Badge>
          </div>
          <p className="mt-1 font-sans text-xs text-slate-500">
            As a manager / founder of these enterprises, you can resolve pending endorsements.
            Resolving awards or forfeits the endorser&apos;s STS reputation.
          </p>

          {endorsementsOnManagedEnterprises.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center">
              <ShieldAlert className="mx-auto h-6 w-6 text-purple-500" />
              <p className="mt-2 font-sans text-sm font-medium text-slate-700">
                No endorsements on your enterprises yet
              </p>
              <p className="mt-1 font-sans text-xs text-slate-500">
                When partners endorse your enterprise, their endorsements will appear here for resolution.
              </p>
            </div>
          ) : (
            <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {endorsementsOnManagedEnterprises.map((e) => (
                <EndorsementCard
                  key={e.id}
                  endorsement={e}
                  canResolve={managedIds.has(e.enterpriseId)}
                  resolving={resolving[e.id]}
                  onResolve={(outcome) =>
                    handleResolve(e.id, outcome, e.enterpriseName)
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── Stat pill (header strip) ──
function StatPill({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "indigo" | "purple";
}) {
  const toneCls =
    tone === "indigo"
      ? "border-indigo-200 bg-white/70"
      : "border-purple-200 bg-white/70";
  const valueCls =
    tone === "indigo" ? "text-indigo-700" : "text-purple-700";
  return (
    <div className={cn("rounded-xl border px-4 py-2.5 backdrop-blur-sm", toneCls)}>
      <p className="font-sans text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={cn("font-serif text-xl font-semibold", valueCls)}>{value}</p>
      <p className="font-sans text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

// ── Stat tile (sidebar) ──
function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-purple-200/60 bg-white/80 p-3">
      <p className="font-sans text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 font-serif text-2xl font-semibold text-purple-700">
        {value}
      </p>
      <p className="font-sans text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

// ── Endorsement card ──
function EndorsementCard({
  endorsement,
  canResolve,
  resolving,
  onResolve,
}: {
  endorsement: Endorsement;
  canResolve: boolean;
  resolving?: "success" | "failure";
  onResolve: (outcome: "success" | "failure") => void;
}) {
  const meta = OUTCOME_META[endorsement.outcome];
  const OutcomeIcon = meta.icon;
  const showResolve = canResolve && endorsement.active;

  return (
    <div className="rounded-xl border border-indigo-200/60 bg-white p-4 transition-colors hover:border-indigo-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-base font-semibold text-slate-900">
              {endorsement.enterpriseName}
            </p>
            <Badge
              variant="outline"
              className="border-indigo-200 text-indigo-700"
            >
              Tier {endorsement.enterpriseTier}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <HandCoins className="h-3 w-3 text-indigo-500" />
              Stake: <strong className="text-slate-700">{endorsement.stakeSts} STS</strong>
            </span>
            <span>Created {timeAgo(new Date(endorsement.createdAt))}</span>
            {endorsement.resolvedAt && (
              <span>Resolved {timeAgo(new Date(endorsement.resolvedAt))}</span>
            )}
          </div>
        </div>

        {/* Outcome badge */}
        <Badge className={cn("border", meta.cls)}>
          <OutcomeIcon className="h-3 w-3" />
          {meta.label}
          {endorsement.outcome !== "pending" && (
            <span className="ml-1 font-mono text-[10px]">
              {endorsement.stsDelta >= 0 ? "+" : ""}
              {endorsement.stsDelta} STS
            </span>
          )}
        </Badge>
      </div>

      {/* Resolve buttons — only on pending endorsements on enterprises I manage */}
      {showResolve && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-indigo-100 pt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onResolve("failure")}
            disabled={resolving !== undefined}
            className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400"
          >
            {resolving === "failure" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Mark failure
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onResolve("success")}
            disabled={resolving !== undefined}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {resolving === "success" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark success
          </Button>
        </div>
      )}
    </div>
  );
}

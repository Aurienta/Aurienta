"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ListOrdered,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Trophy,
  Sparkles,
  CheckCircle2,
  Info,
  AlertCircle,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { egp } from "@/lib/aurienta/format";
import {
  PHASE_MIN_STS,
  isPhaseEligible,
  type PriorityAllocation,
} from "@/lib/aurienta/priority-allocation";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

// ── Types ──
type User = {
  id: string;
  legalName: string;
  sovereignTrustScore: number;
  tier: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  fundraisingGoalEgp: number;
  raisedEgp: number;
  equityUnitPriceEgp: number;
};

type RankingRow = {
  userId: string;
  legalName: string;
  stsAtAllocation: number;
  allocationRank: number;
  allocatedEgp: number;
  allocatedAt: string | null;
};

type Props = {
  user: User;
  allocations: PriorityAllocation[];
  enterprises: Enterprise[];
};

// ── Phase metadata ──
const PHASE_META: Record<
  1 | 2 | 3,
  { label: string; minSts: number; tier: string; accent: string }
> = {
  1: {
    label: "Phase 1",
    minSts: 50,
    tier: "Trusted Contributor+",
    accent: "violet",
  },
  2: {
    label: "Phase 2",
    minSts: 35,
    tier: "Active Member+",
    accent: "purple",
  },
  3: {
    label: "Phase 3",
    minSts: 0,
    tier: "Open to all verified",
    accent: "fuchsia",
  },
};

export function PriorityAllocationClient({
  user,
  allocations,
  enterprises,
}: Props) {
  const router = useRouter();

  // ── Register-interest form state ──
  const [regEnterpriseId, setRegEnterpriseId] = React.useState<string>("");
  const [regPhase, setRegPhase] = React.useState<"1" | "2" | "3" | "">("");
  const [submitting, setSubmitting] = React.useState(false);
  const [verdictError, setVerdictError] = React.useState<string | null>(null);

  // ── Rankings viewer state ──
  const [rankEnterpriseId, setRankEnterpriseId] = React.useState<string>("");
  const [rankPhase, setRankPhase] = React.useState<"1" | "2" | "3" | "">("");
  const [rankings, setRankings] = React.useState<RankingRow[] | null>(null);
  const [rankingsLoading, setRankingsLoading] = React.useState(false);
  const [rankingsError, setRankingsError] = React.useState<string | null>(
    null
  );

  const userSts = user.sovereignTrustScore;

  // ── Submit handler ──
  async function handleRegister() {
    setVerdictError(null);
    if (!regEnterpriseId) {
      setVerdictError("Select an enterprise first.");
      return;
    }
    if (!regPhase) {
      setVerdictError("Select a window phase.");
      return;
    }
    const phaseNum = Number.parseInt(regPhase, 10) as 1 | 2 | 3;
    if (!isPhaseEligible(userSts, phaseNum)) {
      setVerdictError(
        `Your STS (${userSts}) does not meet the minimum for Phase ${phaseNum} (requires STS >= ${PHASE_MIN_STS[phaseNum]}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/priority-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: regEnterpriseId,
          windowPhase: phaseNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error ?? "Registration denied by CRE policy.";
        setVerdictError(reason);
        toast.error("Priority allocation denied", {
          description: reason,
        });
        return;
      }
      toast.success("Interest registered", {
        description: `You are rank #${data.allocation.allocationRank} in Phase ${phaseNum}.`,
      });
      setRegPhase("");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setVerdictError(msg);
      toast.error("Could not register interest", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Rankings fetcher ──
  async function handleLoadRankings() {
    if (!rankEnterpriseId || !rankPhase) {
      setRankingsError("Select an enterprise and phase to view rankings.");
      return;
    }
    setRankingsError(null);
    setRankingsLoading(true);
    setRankings(null);
    try {
      const url = `/api/priority-allocation/rankings?enterpriseId=${encodeURIComponent(
        rankEnterpriseId
      )}&windowPhase=${rankPhase}`;
      const res = await csrfFetch(url, { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        setRankingsError(data?.error ?? "Failed to load rankings.");
        return;
      }
      setRankings(data.rankings ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setRankingsError(msg);
    } finally {
      setRankingsLoading(false);
    }
  }

  // Auto-load rankings when both selects are chosen.
  React.useEffect(() => {
    if (rankEnterpriseId && rankPhase) {
      handleLoadRankings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankEnterpriseId, rankPhase]);

  // ── Render helpers ──
  function stsBadge(sts: number, required: number) {
    const ok = sts >= required;
    return (
      <Badge
        variant="outline"
        className={
          ok
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        }
      >
        {ok ? "Eligible" : "Below minimum"}
      </Badge>
    );
  }

  return (
    <div className="light">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        {/* ── Header ── */}
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <ListOrdered className="h-5 w-5 text-indigo-600" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
              STS Priority Window
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
            STS Priority Allocation
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
            Deterministic, STS-weighted priority access to capital formation
            rounds. Higher Sovereign Trust Score earns earlier (lower-rank)
            access — fully transparent, fully constitutional.
          </p>
        </header>

        {/* ── Compliance banner ── */}
        <div className="rounded-xl border border-indigo-300/60 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-indigo-900">
                This is NOT a lottery.
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-indigo-900/80">
                Allocation is deterministic — higher Sovereign Trust Score earns
                earlier access. No random element. Compliant with Egyptian law
                (Gambling Law 10/1956).
              </p>
            </div>
          </div>
        </div>

        {/* ── User STS + Phase eligibility ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">
                Your STS
              </span>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-indigo-700">
              {userSts}
            </p>
            <p className="mt-1 font-mono text-[11px] text-indigo-900/60">
              {user.tier}
            </p>
          </div>

          {([1, 2, 3] as const).map((p) => (
            <div
              key={p}
              className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">
                  {PHASE_META[p].label}
                </span>
                {stsBadge(userSts, PHASE_META[p].minSts)}
              </div>
              <p className="mt-2 font-serif text-2xl font-semibold text-indigo-950">
                STS &ge; {PHASE_META[p].minSts}
              </p>
              <p className="mt-1 font-sans text-xs text-indigo-900/60">
                {PHASE_META[p].tier}
              </p>
            </div>
          ))}
        </div>

        {/* ── Phase explanation ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-base font-semibold text-indigo-950">
              How the three-phase window works
            </h2>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="font-sans text-xs font-semibold text-indigo-700">
                Phase 1 — Earliest
              </p>
              <p className="mt-1 font-sans text-xs text-indigo-900/70">
                Trusted Contributor+ (STS &ge; 50) register first. Highest STS
                gets rank #1.
              </p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="font-sans text-xs font-semibold text-indigo-700">
                Phase 2 — Mid
              </p>
              <p className="mt-1 font-sans text-xs text-indigo-900/70">
                Active Member+ (STS &ge; 35) join after Phase 1 closes. Rank
                still deterministic by STS.
              </p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="font-sans text-xs font-semibold text-indigo-700">
                Phase 3 — Open
              </p>
              <p className="mt-1 font-sans text-xs text-indigo-900/70">
                All verified partners may participate. No STS minimum, ranked
                among the open phase registrants.
              </p>
            </div>
          </div>
        </div>

        {/* ── Register interest ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-indigo-950">
              Register Interest
            </h2>
          </div>

          {enterprises.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-indigo-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="font-sans text-xs">
                No enterprises are currently in fundraising_active status. Check
                back when a new capital formation round opens.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Enterprise
                </label>
                <Select
                  value={regEnterpriseId}
                  onValueChange={(v) => {
                    setRegEnterpriseId(v);
                    setVerdictError(null);
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full bg-white">
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

              <div>
                <label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Window Phase
                </label>
                <Select
                  value={regPhase}
                  onValueChange={(v) => {
                    setRegPhase(v as "1" | "2" | "3");
                    setVerdictError(null);
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full bg-white">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {([1, 2, 3] as const).map((p) => {
                      const eligible = isPhaseEligible(userSts, p);
                      return (
                        <SelectItem
                          key={p}
                          value={String(p)}
                          disabled={!eligible}
                        >
                          {PHASE_META[p].label} — STS &ge;{" "}
                          {PHASE_META[p].minSts}
                          {!eligible ? " (not eligible)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleRegister}
                  disabled={submitting || !regEnterpriseId || !regPhase}
                  className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Register Interest
                </Button>
              </div>
            </div>
          )}

          {verdictError ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-sans text-xs font-semibold">
                  CRE verdict — denied
                </p>
                <p className="mt-0.5 font-sans text-xs">{verdictError}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── My Allocations ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">
                My Allocations
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-indigo-300/60 text-indigo-700"
            >
              {allocations.length} registered
            </Badge>
          </div>

          {allocations.length === 0 ? (
            <div className="py-2">
              <EmptyState
                icon={ListOrdered}
                title="No Allocations Yet"
                description="Register interest in capital formation rounds to get STS-weighted priority access."
              />
            </div>
          ) : (
            <div className="priority-scroll max-h-[28rem] overflow-y-auto rounded-lg border border-indigo-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60 hover:bg-indigo-50/60">
                    <TableHead className="text-indigo-900/70">Enterprise</TableHead>
                    <TableHead className="text-indigo-900/70">Phase</TableHead>
                    <TableHead className="text-right text-indigo-900/70">Your Rank</TableHead>
                    <TableHead className="text-right text-indigo-900/70">STS at Allocation</TableHead>
                    <TableHead className="text-right text-indigo-900/70">Allocated</TableHead>
                    <TableHead className="text-right text-indigo-900/70">Allocated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a) => (
                    <TableRow key={a.id} className="border-indigo-50">
                      <TableCell className="font-medium text-indigo-950">
                        {a.enterpriseName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-indigo-300/60 text-indigo-700"
                        >
                          {PHASE_META[a.windowPhase].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                          #{a.allocationRank}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-indigo-900/80">
                        {a.stsAtAllocation}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {a.allocatedAt ? (
                          <span className="text-emerald-700">
                            {egp(a.allocatedEgp)}
                          </span>
                        ) : (
                          <span className="text-indigo-700">pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-indigo-900/60">
                        {a.allocatedAt
                          ? new Date(a.allocatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ── Rankings viewer ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-indigo-950">
              Rankings
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                Enterprise
              </label>
              <Select
                value={rankEnterpriseId}
                onValueChange={(v) => {
                  setRankEnterpriseId(v);
                  setRankingsError(null);
                }}
              >
                <SelectTrigger className="mt-1.5 w-full bg-white">
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

            <div>
              <label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                Window Phase
              </label>
              <Select
                value={rankPhase}
                onValueChange={(v) => {
                  setRankPhase(v as "1" | "2" | "3");
                  setRankingsError(null);
                }}
              >
                <SelectTrigger className="mt-1.5 w-full bg-white">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {([1, 2, 3] as const).map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {PHASE_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            {rankingsLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-indigo-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-sans text-sm">Loading rankings…</span>
              </div>
            ) : rankingsError ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="font-sans text-xs">{rankingsError}</p>
              </div>
            ) : !rankEnterpriseId || !rankPhase ? (
              <div className="py-10 text-center">
                <Trophy className="mx-auto h-8 w-8 text-indigo-300" />
                <p className="mt-2 font-sans text-sm text-indigo-950/60">
                  Select an enterprise and phase to view the deterministic
                  ranking.
                </p>
              </div>
            ) : rankings && rankings.length === 0 ? (
              <div className="py-10 text-center">
                <ListOrdered className="mx-auto h-8 w-8 text-indigo-300" />
                <p className="mt-2 font-sans text-sm text-indigo-950/60">
                  No allocations registered for this phase yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-indigo-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50/60 hover:bg-indigo-50/60">
                      <TableHead className="text-indigo-900/70">Rank</TableHead>
                      <TableHead className="text-indigo-900/70">Participant</TableHead>
                      <TableHead className="text-right text-indigo-900/70">STS at Allocation</TableHead>
                      <TableHead className="text-right text-indigo-900/70">Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings?.map((r, idx) => {
                      const isYou = r.userId === user.id;
                      return (
                        <TableRow
                          key={`${r.userId}-${idx}`}
                          className={
                            isYou
                              ? "border-indigo-200 bg-indigo-100/70"
                              : "border-indigo-50"
                          }
                        >
                          <TableCell className="font-mono">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isYou
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              #{r.allocationRank}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-indigo-950">
                            {r.legalName}
                            {isYou ? (
                              <span className="ml-2 rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-900">
                                You
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right font-mono text-indigo-900/80">
                            {r.stsAtAllocation}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {r.allocatedAt ? (
                              <span className="text-emerald-700">
                                {egp(r.allocatedEgp)}
                              </span>
                            ) : (
                              <span className="text-indigo-700">pending</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Determinism proof */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="font-sans text-xs text-indigo-900/70">
              Rankings are computed by sorting STS descending — fully
              transparent, no randomness. Rank #1 is the highest STS registrant
              at the moment they registered; ties share the same rank number,
              ordered by registration time.
            </p>
          </div>
        </div>

        {/* ── Footer note ── */}
        <footer className="border-t border-indigo-200/60 pt-4 font-mono text-xs text-indigo-900/60">
          Constitutional allocation · deterministic · Gambling Law 10/1956
          compliant
        </footer>
      </div>

      {/* ── Custom scrollbar for the My Allocations list ── */}
      <style jsx>{`
        .priority-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgb(99 102 241 / 0.4) transparent;
        }
        .priority-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .priority-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .priority-scroll::-webkit-scrollbar-thumb {
          background-color: rgb(99 102 241 / 0.35);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .priority-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgb(79 70 229 / 0.6);
        }
      `}</style>
    </div>
  );
}

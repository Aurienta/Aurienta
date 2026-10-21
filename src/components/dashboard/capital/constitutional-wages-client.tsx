"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Banknote,
  Loader2,
  Sparkles,
  Megaphone,
  Building2,
  Users,
  TrendingUp,
  Globe,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import type {
  WageBand,
  SectorBenchmark,
} from "@/lib/aurienta/constitutional-wages";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  status: string;
};

const ROLE_LABELS: Record<string, string> = {
  founding_operator: "Founding Operator",
  manager: "Manager",
  employee: "Employee",
  board_member: "Board Member",
};

export function ConstitutionalWagesClient({
  enterprises,
  initialBands,
  initialBenchmarks,
  initialEnterpriseId,
}: {
  enterprises: Enterprise[];
  initialBands: WageBand[];
  initialBenchmarks: SectorBenchmark[];
  initialEnterpriseId: string;
}) {
  const [selectedEntId, setSelectedEntId] = React.useState(initialEnterpriseId);
  const [bands, setBands] = React.useState(initialBands);
  const [benchmarks, setBenchmarks] = React.useState(initialBenchmarks);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const selected = enterprises.find((e) => e.id === selectedEntId);
  const hasBands = bands.length > 0;
  const allPublished = hasBands && bands.every((b) => b.publishedAt);
  const somePublished = hasBands && bands.some((b) => b.publishedAt);

  async function refresh(enterpriseId: string, sector: string) {
    setLoading(true);
    try {
      const [bandsRes, benchRes] = await Promise.all([
        fetch(
          `/api/wages/bands?enterpriseId=${encodeURIComponent(enterpriseId)}&includeUnpublished=true`,
          { cache: "no-store" }
        ),
        sector
          ? fetch(`/api/wages/benchmarks?sector=${encodeURIComponent(sector)}`, {
              cache: "no-store",
            })
          : Promise.resolve(null),
      ]);
      if (bandsRes.ok) {
        const data = await bandsRes.json();
        setBands(data.bands ?? []);
      }
      if (benchRes && benchRes.ok) {
        const data = await benchRes.json();
        setBenchmarks(data.benchmarks ?? []);
      }
    } catch (e) {
      toast.error("Failed to load wage data", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (selectedEntId) {
      const ent = enterprises.find((e) => e.id === selectedEntId);
      refresh(selectedEntId, ent?.sector ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntId]);

  async function handleGenerate() {
    if (!selectedEntId) return;
    setGenerating(true);
    try {
      const res = await csrfFetch("/api/wages/bands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEntId,
          action: "generate",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setBands(data.bands ?? []);
      toast.success("AI wage bands generated", {
        description: "4 constitutional roles · CRE-validated",
      });
    } catch (e) {
      toast.error("AI generation failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!selectedEntId) return;
    setPublishing(true);
    try {
      const res = await csrfFetch("/api/wages/bands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEntId,
          action: "publish",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setBands(data.bands ?? []);
      toast.success("Wage bands published", {
        description: "Now visible in sector benchmarks + enterprise profile",
      });
    } catch (e) {
      toast.error("Publishing failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setPublishing(false);
    }
  }

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={Banknote}
          title="No enterprises yet"
          description="Join or found an enterprise to generate constitutional wage bands."
        />
      </div>
    );
  }

  const benchmarkByRole = new Map(benchmarks.map((b) => [b.role, b]));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-100">
            <Banknote className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              REC-5 · Constitutional Wages
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Transparent salary bands, constitutionally enforced
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              AI-generated bands per role (founding operator, manager, employee,
              board member). Every band clears the national minimum wage and
              respects min &lt; median &lt; max — enforced by CRE.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enterprise selector + actions */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100 pb-3">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Building2 className="h-4 w-4 text-indigo-600" /> Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Select value={selectedEntId} onValueChange={setSelectedEntId}>
              <SelectTrigger className="border-slate-300 bg-white">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="font-sans">{e.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">
                      T{e.tier} · {e.sector}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-700">
                  Tier {selected.tier}
                </Badge>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  <Globe className="mr-1 h-3 w-3" /> {selected.sector}
                </Badge>
                {hasBands && (
                  <Badge
                    variant="outline"
                    className={
                      allPublished
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-amber-300 bg-amber-50 text-amber-700"
                    }
                  >
                    {allPublished ? (
                      <>
                        <Eye className="mr-1 h-3 w-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" /> Draft
                      </>
                    )}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-white">
          <CardContent className="flex h-full flex-col items-start justify-center gap-2 p-4">
            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedEntId}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate AI Wage Bands
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || !hasBands || allPublished}
              variant="outline"
              className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
            >
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Megaphone className="mr-2 h-4 w-4" />
              )}
              Publish Bands
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wage bands table */}
      <Card className="border-indigo-200 bg-white">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
            <Banknote className="h-4 w-4 text-indigo-600" /> Wage Bands
            <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
              {bands.length} {loading ? "· loading…" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {bands.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="No wage bands yet"
              description="Click 'Generate AI Wage Bands' to derive min/median/max for each role using the salary engine's tier multiplier + Cairo regional adjustment."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-indigo-100">
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Role
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Min
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Median
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Max
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Sector median
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bands.map((b) => {
                  const bench = benchmarkByRole.get(b.role);
                  const aboveSector =
                    bench && bench.medianOfMedians > 0
                      ? b.medianSalaryEgp >= bench.medianOfMedians
                      : null;
                  return (
                    <TableRow key={b.id} className="border-indigo-50 hover:bg-indigo-50/40">
                      <TableCell className="font-sans text-sm font-medium text-slate-900">
                        {ROLE_LABELS[b.role] ?? b.role}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {egp(b.minSalaryEgp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-slate-900">
                        {egp(b.medianSalaryEgp)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {egp(b.maxSalaryEgp)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {bench && bench.medianOfMedians > 0 ? (
                          <span className="flex items-center gap-1">
                            {egp(bench.medianOfMedians)}
                            {aboveSector !== null && (
                              <span
                                className={
                                  aboveSector
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }
                              >
                                {aboveSector ? "▲" : "▼"}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {b.publishedAt ? (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sector benchmarks */}
      {selected?.sector && (
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Sector Benchmarks
              <Badge variant="outline" className="ml-auto border-slate-300 bg-slate-50 text-slate-600">
                {selected.sector}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {benchmarks.length === 0 || benchmarks.every((b) => b.enterpriseCount === 0) ? (
              <EmptyState
                icon={Users}
                title="No published benchmarks yet"
                description="When enterprises in this sector publish their wage bands, the median-of-medians by role will appear here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {benchmarks.map((b) => (
                  <div
                    key={b.role}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
                  >
                    <p className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      {ROLE_LABELS[b.role] ?? b.role}
                    </p>
                    <p className="mt-1.5 font-serif text-xl font-semibold text-slate-900">
                      {b.medianOfMedians > 0 ? egp(b.medianOfMedians) : "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {b.enterpriseCount} {b.enterpriseCount === 1 ? "enterprise" : "enterprises"}
                    </p>
                    {b.minMedian > 0 && (
                      <p className="mt-1 font-mono text-[10px] text-slate-500">
                        range {egp(b.minMedian, { compact: true })} – {egp(b.maxMedian, { compact: true })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

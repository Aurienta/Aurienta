"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  HardHat,
  ShieldCheck,
  AlertCircle,
  Crown,
  TrendingUp,
  Users,
  ChevronDown,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Badge } from "@/components/ui/badge";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type WorkforceRow = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  enterpriseSlug: string;
  userId: string;
  legalName: string;
  avatarColor: string;
  sovereignTrustScore: number;
  userTier: string;
  position: string;
  department: string;
  employmentType: string;
  compensationBand: string;
  monthlySalaryEgp: number;
  nosiStatus: string;
  nosiNumber: string | null;
  nosiRegisteredAt: string | null;
  keyPerson: boolean;
  equityConversionPct: number;
  hireDate: string;
};

type EntLite = {
  id: string;
  name: string;
  tier: string;
  slug: string;
  employeeCount: number;
  nosiCompliantPct: number;
};

const NOSI_LABELS: Record<string, { label: string; cls: string }> = {
  registered: { label: "Registered", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  pending: { label: "Pending", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  missing: { label: "Missing", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" },
};

const EMP_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

export function WorkforceRegistryClient({
  employees,
  enterprises,
}: {
  employees: WorkforceRow[];
  enterprises: EntLite[];
}) {
  const [activeEnt, setActiveEnt] = React.useState<string>("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered =
    activeEnt === "all" ? employees : employees.filter((e) => e.enterpriseId === activeEnt);

  const totalHeadcount = employees.length;
  const totalMonthly = employees.reduce((s, e) => s + e.monthlySalaryEgp, 0);
  const nosiOk = employees.filter((e) => e.nosiStatus === "registered").length;
  const nosiPct = totalHeadcount > 0 ? (nosiOk / totalHeadcount) * 100 : 0;
  const keyPeople = employees.filter((e) => e.keyPerson).length;
  const equityEarners = employees.filter((e) => e.equityConversionPct > 0).length;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Workforce Partners", value: String(totalHeadcount), icon: Users },
          { label: "Monthly payroll", value: egp(totalMonthly, { compact: true }), icon: TrendingUp },
          { label: "NOSI compliance", value: pct(nosiPct, 0), icon: ShieldCheck, danger: nosiPct < 100 },
          { label: "Key persons", value: String(keyPeople), icon: Crown },
          { label: "Equity earners", value: String(equityEarners), icon: HardHat },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-gold/15 glass-gold p-4"
          >
            <div className="flex items-center justify-between">
              <kpi.icon className={cn("h-4 w-4", kpi.danger ? "text-rose-400" : "text-gold")} />
              {kpi.danger && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
            </div>
            <div className={cn("mt-2 font-serif text-2xl font-semibold", kpi.danger && "text-rose-300")}>
              {kpi.value}
            </div>
            <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enterprise filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveEnt("all")}
          className={cn(
            "rounded-full border px-4 py-1.5 font-sans text-xs transition-colors",
            activeEnt === "all"
              ? "border-gold/40 bg-gold/12 text-gold-light"
              : "border-gold/15 text-muted-foreground hover:text-foreground"
          )}
        >
          All ({employees.length})
        </button>
        {enterprises.map((e) => {
          const count = employees.filter((emp) => emp.enterpriseId === e.id).length;
          return (
            <button
              key={e.id}
              onClick={() => setActiveEnt(e.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 font-sans text-xs transition-colors",
                activeEnt === e.id
                  ? "border-gold/40 bg-gold/12 text-gold-light"
                  : "border-gold/15 text-muted-foreground hover:text-foreground"
              )}
            >
              {e.name} · T{e.tier} ({count})
            </button>
          );
        })}
      </div>

      {/* Registry table */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Registry</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {filtered.length} record{filtered.length === 1 ? "" : "s"} · ledger-immutable
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-[#0c0c0f]/95 backdrop-blur">
              <tr className="border-b border-gold/12 font-sans text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Partner</th>
                <th className="px-4 py-2.5 font-medium">Enterprise / Role</th>
                <th className="px-4 py-2.5 font-medium">Compensation</th>
                <th className="px-4 py-2.5 font-medium">NOSI</th>
                <th className="px-4 py-2.5 font-medium">Equity</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const isOpen = openId === e.id;
                const nosiMeta = NOSI_LABELS[e.nosiStatus] ?? NOSI_LABELS.missing;
                return (
                  <React.Fragment key={e.id}>
                    <tr
                      onClick={() => setOpenId(isOpen ? null : e.id)}
                      className="cursor-pointer border-b border-gold/8 transition-colors hover:bg-gold/[0.04]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-semibold text-[#0a0a0b]"
                            style={{ background: e.avatarColor }}
                            aria-hidden
                          >
                            {e.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif text-sm font-medium">{e.legalName}</span>
                              {e.keyPerson && <Crown className="h-3 w-3 text-gold" aria-label="Key person" />}
                            </div>
                            <span className="font-sans text-xs text-muted-foreground">
                              STS {e.sovereignTrustScore} · {e.userTier}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-sans text-xs">{e.enterpriseName}</div>
                        <div className="font-sans text-xs text-muted-foreground">
                          {e.position} · {e.department}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gold-light">{egp(e.monthlySalaryEgp)}</div>
                        <div className="font-sans text-xs text-muted-foreground">{e.compensationBand}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
                            nosiMeta.cls
                          )}
                        >
                          {nosiMeta.label}
                        </span>
                        {e.nosiNumber && (
                          <div className="mt-1 font-mono text-[11px] text-muted-foreground/85">{e.nosiNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {e.equityConversionPct > 0 ? (
                          <Badge variant="outline" className="border-gold/30 bg-gold/8 text-gold-light">
                            {pct(e.equityConversionPct, 1)} → equity
                          </Badge>
                        ) : (
                          <span className="font-sans text-xs text-muted-foreground/80">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-gold/8 bg-foreground/[0.015]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <Detail label="Employment type" value={EMP_TYPE_LABELS[e.employmentType] ?? e.employmentType} />
                            <Detail label="Hired" value={timeAgo(new Date(e.hireDate))} />
                            <Detail label="NOSI registered" value={e.nosiRegisteredAt ? timeAgo(new Date(e.nosiRegisteredAt)) : "—"} />
                            <Detail label="Department" value={e.department} />
                            <Detail label="Position" value={e.position} />
                            <Detail label="Compensation band" value={e.compensationBand} />
                            <Detail label="Equity conversion" value={pct(e.equityConversionPct, 1)} />
                            <Detail label="Sovereign Trust Score" value={String(e.sovereignTrustScore)} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center font-sans text-sm text-muted-foreground">
                    No workforce records match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        NOSI = National Social Insurance.  Tier A–F rules require 100% NOSI registration before
        any graduation vote.  Compensation bands are visible to all Equity-Unit holders by
        constitutional rule (Transparency Doctrine, Vol 3.4).
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
      <div className="mt-0.5 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

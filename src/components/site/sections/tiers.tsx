"use client";

import { Reveal, StaggerGroup, staggerItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { motion } from "framer-motion";
import { GraduationCap, ChevronRight } from "lucide-react";

const TIERS = [
  {
    tier: "A",
    name: "Micro",
    form: "LLC",
    raise: "Up to 3M EGP",
    min: "50 EGP",
    equity: "5% Founding Operator",
    fee: "5% + 2.5%",
    trait: "First-time Founding Operators",
    accent: "from-amber-400/20",
  },
  {
    tier: "B",
    name: "Small",
    form: "LLC",
    raise: "Up to 25M EGP",
    min: "50 EGP",
    equity: "5% + 5% conditional",
    fee: "5% + 2.5%",
    trait: "Experienced operators",
    accent: "from-yellow-500/20",
  },
  {
    tier: "C",
    name: "Growth",
    form: "LLC",
    raise: "Unlimited",
    min: "50 EGP",
    equity: "10% + 25% vesting",
    fee: "5% + 2.5%",
    trait: "ERP mandatory",
    accent: "from-amber-500/20",
  },
  {
    tier: "D",
    name: "Established",
    form: "LLC",
    raise: "Unlimited",
    min: "50,000 EGP",
    equity: "Owner ≥ 51%",
    fee: "5% + 2.5%",
    trait: "Existing companies",
    accent: "from-yellow-600/20",
  },
  {
    tier: "E",
    name: "University",
    form: "SPV",
    raise: "Up to 5M EGP",
    min: "50 EGP",
    equity: "0% Founding Operator",
    fee: "1%",
    trait: "Research spinouts",
    accent: "from-amber-300/20",
  },
  {
    tier: "F",
    name: "Joint Stock",
    form: "JSC",
    raise: "Unlimited",
    min: "1 unit",
    equity: "Per bylaws",
    fee: "5% + 2.5%",
    trait: "EGX listing",
    accent: "from-yellow-400/20",
  },
];

const COMPARISON = [
  { label: "Legal form", a: "LLC", b: "LLC", c: "LLC", d: "LLC", e: "SPV", f: "JSC" },
  { label: "Max raise", a: "3M EGP", b: "25M EGP", c: "Unlimited", d: "Unlimited", e: "5M EGP", f: "Unlimited" },
  { label: "Min. Capital Participation", a: "50 EGP", b: "50 EGP", c: "50 EGP", d: "50,000 EGP", e: "50 EGP", f: "1 unit" },
  { label: "Founding Operator equity", a: "5% + 5%", b: "5% + 5%", c: "10% + 25% vest", d: "Owner ≥51%", e: "0%", f: "By bylaws" },
  { label: "Platform fee", a: "5%", b: "5%", c: "5%", d: "5%", e: "1%", f: "5%" },
  { label: "Consulting fee", a: "2.5%", b: "2.5%", c: "2.5%", d: "2.5%", e: "—", f: "2.5%" },
  { label: "ERP", a: "Lite", b: "Optional", c: "Mandatory", d: "Mandatory", e: "—", f: "Mandatory" },
  { label: "Annual audit", a: "Compilation", b: "Review", c: "Statutory", d: "Statutory", e: "Grant", f: "FRA statutory" },
];

export function Tiers() {
  return (
    <section id="tiers" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Enterprise Tiers A–F"
          title={
            <>
              A constitutional ladder from
              <span className="text-gold-gradient"> microenterprise to sovereign JSC.</span>
            </>
          }
          description="Six tiers govern formation, Capital Formation caps, Founding Operator equity, fees, and the path to graduation. Every tier is a legally recognised structure under Egyptian law."
        />

        {/* tier cards */}
        <StaggerGroup className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t) => (
            <motion.div
              key={t.tier}
              variants={staggerItem}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/30"
            >
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.accent} to-transparent blur-2xl`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-5xl font-semibold text-gold-gradient">T{t.tier}</span>
                    <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Tier {t.tier}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-semibold">{t.name}</h3>
                  <span className="mt-1 inline-block font-mono text-xs uppercase tracking-wider text-gold/60">
                    {t.form} · {t.trait}
                  </span>
                </div>
              </div>

              <dl className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gold/10 pt-5">
                <div>
                  <dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Max raise</dt>
                  <dd className="mt-0.5 font-sans text-sm font-medium text-foreground">{t.raise}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Min. participation</dt>
                  <dd className="mt-0.5 font-sans text-sm font-medium text-foreground">{t.min}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Founding Operator equity</dt>
                  <dd className="mt-0.5 font-sans text-sm font-medium text-foreground">{t.equity}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Fees</dt>
                  <dd className="mt-0.5 font-sans text-sm font-medium text-foreground">{t.fee}</dd>
                </div>
              </dl>
            </motion.div>
          ))}
        </StaggerGroup>

        {/* graduation path */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-gold/10 bg-background/40 p-5">
            <GraduationCap className="h-5 w-5 text-gold" />
            <span className="font-sans text-sm text-muted-foreground">Graduation path:</span>
            {["A", "B", "C", "D", "E", "F"].map((t, i) => (
              <span key={t} className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 bg-gold/5 font-serif text-sm font-semibold text-gold-light">
                  {t}
                </span>
                {i < 5 && <ChevronRight className="h-3.5 w-3.5 text-gold/40" />}
              </span>
            ))}
            <span className="ml-2 font-sans text-xs text-muted-foreground">→ Sovereign Independence</span>
          </div>
        </Reveal>

        {/* comparison table */}
        <Reveal delay={0.15}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-gold/12">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gold/15 bg-gold/[0.04]">
                    <th className="px-5 py-4 font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Parameter
                    </th>
                    {TIERS.map((t) => (
                      <th key={t.tier} className="px-5 py-4 text-center">
                        <span className="font-serif text-lg font-semibold text-gold-gradient">T{t.tier}</span>
                        <span className="block font-sans text-xs uppercase tracking-wider text-muted-foreground">
                          {t.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-b border-gold/8 ${i % 2 ? "bg-background/20" : ""}`}
                    >
                      <td className="px-5 py-3.5 font-sans text-sm text-muted-foreground">{row.label}</td>
                      {[row.a, row.b, row.c, row.d, row.e, row.f].map((v, j) => (
                        <td key={j} className="px-5 py-3.5 text-center font-sans text-sm text-foreground/90">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

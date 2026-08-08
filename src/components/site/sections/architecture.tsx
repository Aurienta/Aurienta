"use client";

import { Reveal, StaggerGroup, staggerItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { motion } from "framer-motion";
import { Cpu, Landmark, Database, Coins, ArrowRight } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";

const SYSTEMS = [
  {
    icon: Cpu,
    title: "Constitutional Runtime Engine",
    tag: "CRE",
    body: "Deterministic, fail-secure policy-as-code. Isolated WebAssembly modules execute Rego policies across a 3-node Raft consensus. Every decision is signed with an HSM-backed Ed25519 key and wrapped in a 5-second decision token.",
    meta: "p95 < 50ms · 1,000 req/s",
  },
  {
    icon: Landmark,
    title: "Law Firm Client Account",
    tag: "Zero Custody",
    body: "Bankruptcy-removable accounts held by FRA-licensed law firms with ≥100M EGP insurance. Three firms per jurisdiction, automatic failover. AURIENTA orchestrates metadata only — it can never touch the funds.",
    meta: "Balance verified every 60s",
  },
  {
    icon: Database,
    title: "Ownership Ledger",
    tag: "Immutable",
    body: "An append-only PostgreSQL table with a SHA3-256 hash chain. Every Equity Unit, transfer, and governance action is an event. All state is derived from events — no in-place updates. Hourly Merkle roots anchor to the Stellar blockchain.",
    meta: "Court-admissible evidence",
  },
  {
    icon: Coins,
    title: "Equity Units",
    tag: "One Unit · One Vote",
    body: "Each Equity Unit carries one vote. No super-voting, no Founding Operator vetoes. Workforce Partners may convert up to 10% of monthly salary into units at a 15% discount. Trades occur within a ±5% constitutional price band.",
    meta: "From 50 EGP per unit",
  },
];

const JOURNEY = [
  {
    step: "Save",
    title: "500 EGP saved",
    body: "Layla, a Cairo university student, sets aside 500 EGP from freelance work.",
  },
  {
    step: "Verify",
    title: "Identity in <5 min",
    body: "National ID OCR, liveness + deepfake detection, face match — Sovereign Trust Score 65.",
  },
  {
    step: "Participate",
    title: "10 Equity Units",
    body: "She becomes a Capital Partner in “Street Bites”, acquiring 10 units at 50 EGP each.",
  },
  {
    step: "Own",
    title: "Funds to Law Firm Client Account",
    body: "Capital flows directly to the law firm's account — never to AURIENTA. The ledger updates.",
  },
  {
    step: "Govern",
    title: "Vote & earn",
    body: "She votes on budgets via constitutional consensus, receives dividends, and may sell on the Enterprise Registry.",
  },
];

export function Architecture() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 -z-10 aurienta-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Infrastructure"
          title={
            <>
              Four systems that make capital
              <br />
              <span className="text-gold-gradient">constitutionally unbreakable.</span>
            </>
          }
          description="Friction is engineered out, not managed. Each layer is deterministic, auditable, and unable to be bypassed — by any party."
        />

        <StaggerGroup className="mt-16 grid gap-5 md:grid-cols-2">
          {SYSTEMS.map((s) => (
            <motion.div
              key={s.title}
              variants={staggerItem}
              className="group relative overflow-hidden rounded-2xl glass-gold p-7 transition-all duration-500 hover:gold-glow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient text-black">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-xs uppercase tracking-wider text-gold-light/80">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-gold/10 pt-4">
                <GoldStar className="h-3 w-3" />
                <span className="font-mono text-[11px] text-gold/70">{s.meta}</span>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>

        {/* Layla's journey */}
        <Reveal delay={0.1}>
          <div className="mt-20 overflow-hidden rounded-3xl border border-gold/12 bg-gradient-to-br from-background to-[#0c0c10] p-8 sm:p-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/80">
                  A worked example
                </span>
                <h3 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                  From 500 EGP to Constitutional Partner
                </h3>
              </div>
              <p className="max-w-sm font-sans text-sm text-muted-foreground">
                Every Network Participant — from a student with 50 EGP to a sovereign fund —
                becomes a legally recognised Constitutional Partner.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {JOURNEY.map((j, i) => (
                <Reveal key={j.step} delay={i * 0.08}>
                  <div className="relative h-full rounded-2xl border border-gold/10 bg-background/40 p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gold/60">0{i + 1}</span>
                      <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-gold-light/80">
                        {j.step}
                      </span>
                    </div>
                    <h4 className="mt-3 font-serif text-lg font-semibold leading-tight">
                      {j.title}
                    </h4>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">
                      {j.body}
                    </p>
                    {i < JOURNEY.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-gold/40 md:block" />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { motion, useInView, animate, useMotionValue } from "framer-motion";
import {
  Building2,
  Users,
  TrendingUp,
  ShieldCheck,
  Lock,
  Cpu,
  Landmark,
  Coins,
} from "lucide-react";
import { WideCard, StatCard, BentoGrid, WideStatBar } from "@/components/ui/premium-card";

// Animated counter component
function CountUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setDisplay(
          v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        ),
    });
    return () => controls.stop();
  }, [inView, to, decimals, mv]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WIDE STATS BAR — Premium horizontal stats below hero
// ═══════════════════════════════════════════════════════════════════
export function WideStatsBar() {
  const stats = [
    {
      label: "Capital Deployed",
      value: <CountUp to={280.5} suffix="M" prefix="" decimals={1} />,
      suffix: " EGP",
      icon: Coins,
      trend: "up" as const,
      trendValue: "+12.3% QoQ",
      sub: "Real-economy capital",
    },
    {
      label: "Active Partners",
      value: <CountUp to={5} suffix="" />,
      suffix: "",
      icon: Users,
      trend: "up" as const,
      trendValue: "+3 this month",
      sub: "Verified & KYC-completed",
    },
    {
      label: "Enterprises",
      value: <CountUp to={4} suffix="" />,
      suffix: "",
      icon: Building2,
      trend: "up" as const,
      trendValue: "1 graduated",
      sub: "Tiers A through F",
    },
    {
      label: "CRE Uptime",
      value: <CountUp to={99.95} suffix="%" decimals={2} />,
      suffix: "",
      icon: ShieldCheck,
      trend: "up" as const,
      trendValue: "Constitutional SLA met",
      sub: "AI-enforced governance",
    },
  ];

  return (
    <section className="relative mx-auto -mt-16 max-w-7xl px-5 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <WideCard
          variant="dark"
          glow
          hover={false}
          className="rounded-3xl border-gold/20 shadow-[0_30px_80px_-30px_rgba(212,175,55,0.35)]"
        >
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                {/* Divider (except first) */}
                {i > 0 && (
                  <div className="absolute -left-3 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-gold/20 to-transparent lg:block" />
                )}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/8 border border-gold/20">
                    <stat.icon className="h-4.5 w-4.5 text-gold" />
                  </div>
                  <span className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="mt-3 font-serif text-2xl font-bold text-gold-gradient sm:text-3xl">
                  {stat.value}
                  <span className="text-lg sm:text-xl">{stat.suffix}</span>
                </div>
                <p className="mt-1 font-sans text-[11px] text-muted-foreground/70">
                  {stat.sub}
                </p>
                {stat.trend && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trendValue}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </WideCard>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BENTO FEATURES GRID — Wide cards showing platform features
// ═══════════════════════════════════════════════════════════════════
export function BentoFeatures() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/90">
          <ShieldCheck className="h-3 w-3" />
          Constitutional Infrastructure
        </span>
        <h2 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Built on <span className="text-gold-gradient">unbreakable rules</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-base text-muted-foreground sm:text-lg">
          Six pillars of constitutional trust — enforced by AI, verified by
          auditors, protected by Egyptian law.
        </p>
      </motion.div>

      <BentoGrid cols={3} className="gap-4 sm:gap-5">
        {/* Featured wide card (spans 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-2"
        >
          <WideCard variant="gold" glow hover className="h-full">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/12 border border-gold/30">
                  <Lock className="h-7 w-7 text-gold" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                  Zero Custody. Absolute Trust.
                </h3>
                <p className="mt-2 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
                  Your capital flows directly to licensed Egyptian law firm
                  client accounts. AURIENTA never holds, moves, or delays your
                  funds. Every transfer is Ed25519-signed and recorded on the
                  immutable ownership ledger.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:w-48">
                <div className="rounded-xl border border-gold/15 bg-background/40 p-3">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    Escrow Held
                  </div>
                  <div className="mt-1 font-serif text-xl font-bold text-gold-gradient">
                    16.78M EGP
                  </div>
                </div>
                <div className="rounded-xl border border-gold/15 bg-background/40 p-3">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    Law Firms
                  </div>
                  <div className="mt-1 font-serif text-xl font-bold text-gold-gradient">
                    2 Active
                  </div>
                </div>
                <div className="rounded-xl border border-gold/15 bg-background/40 p-3">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    Insurance
                  </div>
                  <div className="mt-1 font-serif text-xl font-bold text-gold-gradient">
                    220M EGP
                  </div>
                </div>
              </div>
            </div>
          </WideCard>
        </motion.div>

        {/* Side cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <WideCard variant="glass" hover glow className="h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/8 border border-gold/20">
              <Cpu className="h-6 w-6 text-gold" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
              AI-Enforced Governance
            </h3>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Critical decisions are made by AI following fixed constitutional
              rules. No human — not even founders — can override them.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold/15 bg-gold/5 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              <span className="font-mono text-xs text-muted-foreground">
                18 CRE policies active
              </span>
            </div>
          </WideCard>
        </motion.div>

        {/* Bottom row — 3 equal cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <WideCard variant="glass" hover className="h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/8 border border-gold/20">
              <Landmark className="h-6 w-6 text-gold" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
              FRA No-Action
            </h3>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Classified as technology + governance infrastructure — not
              crowdfunding, not brokerage.
            </p>
          </WideCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <WideCard variant="glass" hover className="h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/8 border border-gold/20">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
              Immutable Ledger
            </h3>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Every action is hash-chained and permanently recorded. Auditable
              by you, the regulator, or any court.
            </p>
          </WideCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <WideCard variant="glass" hover className="h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/8 border border-gold/20">
              <TrendingUp className="h-6 w-6 text-gold" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
              Fair Pricing
            </h3>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Fundamental pricing with ±5% band. No speculation, no
              manipulation — only real-economy valuation.
            </p>
          </WideCard>
        </motion.div>
      </BentoGrid>
    </section>
  );
}

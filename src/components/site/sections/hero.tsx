"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Cpu, ChevronRight, ArrowDown } from "lucide-react";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { useLanguage } from "@/lib/i18n/language-context";

const TRUST_KEYS = [
  { icon: Lock, key: "hero.badge.zeroCustody" },
  { icon: Cpu, key: "hero.badge.aiGovernance" },
  { icon: ShieldCheck, key: "hero.badge.fraNoAction" },
] as const;

function OrbitRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative h-[34rem] w-[34rem] max-w-[90vw]">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-gold/15" />
        <div
          className="absolute inset-[3.5rem] rounded-full border border-gold/10"
          style={{ animation: "spin-slow 40s linear infinite reverse" }}
        />
        <div className="absolute inset-[7rem] rounded-full border border-gold/20 animate-pulse-gold" />
        <div className="absolute inset-0 animate-spin-slow">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_16px_4px_rgba(212,175,55,0.7)]" />
        </div>
        <div
          className="absolute inset-[3.5rem]"
          style={{ animation: "spin-slow 30s linear infinite reverse" }}
        >
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_3px_rgba(212,175,55,0.6)]" />
          <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-gold/70" />
        </div>
      </div>
    </div>
  );
}

function FloatingParticles() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: `${(i * 37 + 7) % 100}%`,
        top: `${(i * 53 + 11) % 100}%`,
        size: 2 + (i % 3),
        delay: (i % 7) * 0.8,
        duration: 7 + (i % 5) * 1.6,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-gold/40 animate-float-slow"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: "0 0 8px 1px rgba(212,175,55,0.5)",
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-20 sm:px-8">
      <div className="absolute inset-0 -z-10 aurienta-radial" />
      <div className="absolute inset-0 -z-10 aurienta-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 -z-10 aurienta-noise opacity-[0.04] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 backdrop-blur-sm"
        >
          <GoldStar className="h-3 w-3" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/90">
            {t("hero.badge")}
          </span>
        </motion.div>

        <div className="relative my-10 flex items-center justify-center">
          <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <OrbitRings />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <AurientaMark className="relative h-28 w-28 sm:h-32 sm:w-32" withGlow />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="font-serif text-5xl font-semibold uppercase tracking-[0.18em] text-gold-shimmer sm:text-7xl lg:text-8xl"
        >
          Aurienta
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 max-w-3xl font-serif text-2xl font-medium leading-[1.25] sm:text-3xl lg:text-4xl"
        >
          Your capital, your work, your company —
          <span className="text-gold-gradient"> no speculation required.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7 }}
          className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          The world&apos;s first constitutional launchpad. A noncustodial infrastructure of
          structural trust that transforms everyday capital into real-economy corporate
          ownership through digital rules that cannot be bent, bypassed, or broken.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.74, duration: 0.7 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-4 font-sans text-sm font-semibold text-black shadow-[0_14px_50px_-12px_rgba(212,175,55,0.7)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_18px_70px_-10px_rgba(212,175,55,0.9)] active:scale-[0.98]"
          >
            {t("hero.cta.primary")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#constitution"
            className="group inline-flex items-center gap-2 rounded-full border border-gold/25 bg-background/40 px-8 py-4 font-sans text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-gold/50 hover:bg-gold/5 active:scale-[0.98]"
          >
            {t("hero.cta.secondary")}
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.86, duration: 0.7 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
        >
          {TRUST_KEYS.map((trust) => (
            <span
              key={trust.key}
              className="inline-flex items-center gap-2 font-sans text-xs text-muted-foreground"
            >
              <trust.icon className="h-4 w-4 text-gold" />
              {t(trust.key)}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex items-center gap-2 rounded-full border border-gold/10 bg-background/50 px-4 py-2 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="font-mono text-xs text-muted-foreground/85">
            {t("hero.hash")} · 0xB4F8…E7D1A · {t("hero.hashLive")}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <ArrowDown className="h-5 w-5 animate-bounce text-gold/50" />
      </motion.div>
    </section>
  );
}

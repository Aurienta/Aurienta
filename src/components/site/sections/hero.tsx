"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ShieldCheck, Lock, Cpu, ChevronRight, ArrowDown, Sparkles, Zap } from "lucide-react";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { useLanguage } from "@/lib/i18n/language-context";
import { MagneticButton } from "@/components/ux/magnetic-button";

// ═══════════════════════════════════════════════════════════════════
// 2026 HERO — Scroll-driven, cinematic, top-tier
// ═══════════════════════════════════════════════════════════════════

const TRUST_KEYS = [
  { icon: Lock, label: "Zero Custody", desc: "Your money never touches AURIENTA" },
  { icon: Cpu, label: "AI-Enforced", desc: "Rules that cannot be bypassed" },
  { icon: ShieldCheck, label: "FRA No-Action", desc: "Regulator-approved status" },
] as const;

// Animated orbital system with 3D depth
function OrbitalSystem() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ perspective: "1000px" }}>
      <div className="relative h-[36rem] w-[36rem] max-w-[95vw]" style={{ transformStyle: "preserve-3d" }}>
        {/* Outer ring — dashed, slow spin */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-gold/12"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        {/* Mid ring — solid, reverse spin */}
        <motion.div
          className="absolute inset-[4rem] rounded-full border border-gold/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner ring — pulsing glow */}
        <motion.div
          className="absolute inset-[8rem] rounded-full border border-gold/20"
          animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbital particles */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_20px_6px_rgba(212,175,55,0.6)]" />
        </motion.div>
        <motion.div
          className="absolute inset-[4rem]"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_3px_rgba(212,175,55,0.5)]" />
          <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-gold/60" />
        </motion.div>
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-72 rounded-full bg-gold/8 blur-3xl animate-glow-breathe" />
        </div>
      </div>
    </div>
  );
}

// Floating gold particles — 2026 enhanced with depth
function ParticleField() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${(i * 37 + 7) % 100}%`,
        top: `${(i * 53 + 11) % 100}%`,
        size: 1 + (i % 4),
        delay: (i % 10) * 0.6,
        duration: 6 + (i % 7) * 1.5,
        opacity: 0.2 + (i % 5) * 0.12,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gold"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: "0 0 8px 1px rgba(212,175,55,0.4)",
          }}
          animate={{ y: [0, -20, 0], opacity: [p.opacity, p.opacity * 1.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const containerRef = React.useRef<HTMLElement>(null);

  // Scroll-driven parallax: as user scrolls, hero content moves up + fades
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-20 sm:px-8"
    >
      {/* 2026 layered backgrounds */}
      <div className="absolute inset-0 -z-10 aurienta-aurora" />
      <div className="absolute inset-0 -z-10 mesh-gradient opacity-70" />
      <div className="absolute inset-0 -z-10 aurienta-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 -z-10 aurienta-noise opacity-[0.04] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <ParticleField />
      <OrbitalSystem />

      {/* Scroll-driven content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Badge — glass-v2 with breathing glow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-v2 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 animate-glow-breathe"
        >
          <GoldStar className="h-3 w-3" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/90">
            {t("hero.badge")}
          </span>
        </motion.div>

        {/* 3D animated logo */}
        <div className="relative my-12 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d", perspective: "500px" }}
          >
            <AurientaMark className="relative h-32 w-32 sm:h-40 sm:w-40" withGlow animated />
          </motion.div>
        </div>

        {/* H1 — animated gold-3d gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-5xl font-semibold uppercase tracking-[0.16em] gold-3d sm:text-7xl lg:text-8xl"
        >
          Aurienta
        </motion.h1>

        {/* Subtitle — two-tone with gold highlight */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-3xl font-serif text-2xl font-medium leading-[1.25] sm:text-3xl lg:text-4xl"
        >
          Your capital, your work, your company —
          <span className="text-gold-gradient-v2"> no speculation required.</span>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-foreground/75 sm:text-lg"
        >
          The world&apos;s first constitutional launchpad. A noncustodial infrastructure of
          structural trust that transforms everyday capital into real-economy corporate
          ownership through digital rules that cannot be bent, bypassed, or broken.
        </motion.p>

        {/* CTAs — magnetic + glow-breathe + glass-v2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <MagneticButton
            as={Link}
            href="/register"
            strength={0.25}
            className="btn-sheen group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-4 font-sans text-sm font-semibold text-black shadow-[0_14px_50px_-12px_rgba(212,175,55,0.7)] transition-shadow duration-300 hover:shadow-[0_18px_70px_-10px_rgba(212,175,55,0.9)] animate-glow-breathe"
          >
            {t("hero.cta.primary")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </MagneticButton>
          <Link
            href="#constitution"
            className="glass-v2 group inline-flex items-center gap-2 rounded-full px-8 py-4 font-sans text-sm font-medium text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-gold/5 active:scale-[0.98]"
          >
            {t("hero.cta.secondary")}
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </Link>
        </motion.div>

        {/* Trust indicators — 3 key features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {TRUST_KEYS.map((trust, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.12, duration: 0.5 }}
              className="group flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/8 border border-gold/15 transition-transform group-hover:scale-110">
                <trust.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="text-left">
                <p className="font-sans text-xs font-medium text-foreground/90">{trust.label}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{trust.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Live constitutional hash badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="glass-v2 flex items-center gap-2 rounded-full px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)] animate-pulse-soft" />
          <span className="font-mono text-xs text-gold-light/85">
            {t("hero.hash")} · 0xB4F8…E7D1A · {t("hero.hashLive")}
          </span>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 sm:block"
        style={{ opacity: useSpring(useTransform(scrollYProgress, [0, 0.1], [1, 0])) }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-5 w-5 text-gold/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

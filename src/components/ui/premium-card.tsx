"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════
// AURIENTA Premium Card System
// ═══════════════════════════════════════════════════════════════════
// A set of wide, premium card components designed for "top of line"
// ease of use. Every card features:
//  - Gradient gold border on hover
//  - 3D lift micro-interaction
//  - Glass-morphism surface
//  - Optimized for wide layouts (max-w-7xl)
//  - Reduced-motion safe
// ═══════════════════════════════════════════════════════════════════

// ── WideCard — the foundational wide premium card ──
export function WideCard({
  children,
  className,
  hover = true,
  glow = false,
  variant = "default",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: "default" | "gold" | "glass" | "dark";
} & React.HTMLAttributes<HTMLDivElement>) {
  const variants = {
    default: "glass border-gold-faint",
    gold: "glass-gold border-gold/30",
    glass: "glass border-gold/20",
    dark: "bg-card/80 border-gold/12 backdrop-blur-xl",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
        variants[variant],
        hover && "card-lift hover:border-gold/40",
        glow && "gold-glow",
        className
      )}
      {...props}
    >
      {/* Decorative gradient orb (top-right) */}
      {glow && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── BentoCard — bento-grid card with configurable span ──
export function BentoCard({
  children,
  className,
  span = 1,
  featured = false,
}: {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  featured?: boolean;
}) {
  const spans: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(spans[span], className)}
    >
      <WideCard
        hover
        glow={featured}
        variant={featured ? "gold" : "glass"}
        className={cn("h-full", featured && "ring-1 ring-gold/20")}
      >
        {children}
      </WideCard>
    </motion.div>
  );
}

// ── StatCard — wide metric card with animated counter + trend ──
export function StatCard({
  label,
  value,
  suffix,
  prefix,
  trend,
  trendValue,
  icon: Icon,
  sub,
  delay = 0,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  prefix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ElementType;
  sub?: string;
  delay?: number;
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-muted-foreground";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <WideCard hover glow className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              {Icon && <Icon className="mr-1 h-5 w-5 text-gold" />}
              <span className="font-serif text-3xl font-semibold text-gold-gradient">
                {prefix}
                {value}
                {suffix}
              </span>
            </div>
            {sub && (
              <p className="mt-1.5 font-sans text-xs text-muted-foreground/80">{sub}</p>
            )}
            {trend && TrendIcon && (
              <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/8 border border-gold/20 transition-colors group-hover:bg-gold/12">
              <Icon className="h-5 w-5 text-gold" />
            </div>
          )}
        </div>
      </WideCard>
    </motion.div>
  );
}

// ── QuickActionCard — wide action card with icon + title + description + arrow ──
export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
  accent = "gold",
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  accent?: "gold" | "emerald" | "violet" | "sky";
  delay?: number;
}) {
  const accents = {
    gold: "text-gold bg-gold/8 border-gold/20",
    emerald: "text-emerald-400 bg-emerald-500/8 border-emerald-500/20",
    violet: "text-violet-400 bg-violet-500/8 border-violet-500/20",
    sky: "text-sky-400 bg-sky-500/8 border-sky-500/20",
  };

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative block"
    >
      <WideCard hover className="h-full">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110",
              accents[accent]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
              {badge && (
                <span className="rounded-full border border-gold/30 bg-gold/8 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-gold-light">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 font-sans text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </WideCard>
    </motion.a>
  );
}

// ── BentoGrid — responsive bento grid container ──
export function BentoGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  const colsClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:gap-5", colsClass[cols], className)}>
      {children}
    </div>
  );
}

// ── WideStatBar — horizontal bar of wide stat cards ──
export function WideStatBar({
  stats,
  className,
}: {
  stats: Array<{
    label: string;
    value: string | number;
    suffix?: string;
    prefix?: string;
    icon?: React.ElementType;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    sub?: string;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 0.08} />
      ))}
    </div>
  );
}

// ── FeatureCard — wide feature card with number + title + description ──
export function FeatureCard({
  number,
  title,
  description,
  icon: Icon,
  featured = false,
  delay = 0,
}: {
  number: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <WideCard hover glow={featured} variant={featured ? "gold" : "glass"} className="h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="font-serif text-4xl font-bold text-gold-gradient">
              {number}
            </span>
            <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/8 border border-gold/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Icon className="h-6 w-6 text-gold" />
            </div>
          )}
        </div>
      </WideCard>
    </motion.div>
  );
}

// ── GlassPanel — frosted glass container with gold accent ──
export function GlassPanel({
  children,
  className,
  accent = "left",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "left" | "top" | "none";
}) {
  const accentClass =
    accent === "left"
      ? "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-gold-gradient before:rounded-l-2xl"
      : accent === "top"
        ? "before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gold-gradient before:rounded-t-2xl"
        : "";
  return (
    <div className={cn("relative glass rounded-2xl p-6", accentClass, className)}>
      {children}
    </div>
  );
}

// Re-export stagger variants for convenience
export const cardStaggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const cardStaggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

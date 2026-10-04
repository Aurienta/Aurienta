"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Compass,
  Scale,
  Rocket,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════
// Empty State Component — friendly guidance for first-time users
// ═══════════════════════════════════════════════════════════════════

export function EmptyState({
  icon: Icon = Sparkles,
  title = "Nothing here yet",
  description = "Get started with the actions below.",
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gold/12 bg-background/30 p-8 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/8 border border-gold/15">
        <Icon className="h-8 w-8 text-gold/60" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 max-w-sm font-sans text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref && (
          <button
            onClick={() => router.push(actionHref)}
            className="btn-sheen inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-all hover:shadow-[0_8px_30px_-8px_rgba(212,175,55,0.6)]"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {secondaryLabel && secondaryHref && (
          <button
            onClick={() => router.push(secondaryHref)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/20 px-4 py-2 font-sans text-xs font-medium text-foreground transition-colors hover:border-gold/40 hover:bg-gold/5"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Quick Start Cards — shown on dashboard overview for new users
// ═══════════════════════════════════════════════════════════════════

const QUICK_ACTIONS = [
  {
    icon: Wallet,
    title: "View Portfolio",
    desc: "Check your Equity Units, P&L, and dividend history",
    href: "/dashboard/portfolio",
    color: "from-amber-500/10 to-amber-600/5",
  },
  {
    icon: Compass,
    title: "Find Opportunities",
    desc: "Browse vetted enterprises raising capital",
    href: "/dashboard/opportunities",
    color: "from-yellow-500/10 to-amber-500/5",
  },
  {
    icon: Scale,
    title: "Vote on Governance",
    desc: "Participate in active proposals + constitutional council",
    href: "/dashboard/governance",
    color: "from-gold/10 to-amber-600/5",
  },
  {
    icon: Rocket,
    title: "Found an Enterprise",
    desc: "Constitute your sovereign enterprise step by step",
    href: "/dashboard/founder",
    color: "from-amber-600/10 to-yellow-500/5",
  },
];

export function QuickStartCards() {
  const router = useRouter();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUICK_ACTIONS.map((action, i) => (
        <motion.button
          key={action.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          onClick={() => router.push(action.href)}
          className={cn(
            "card-lift group relative overflow-hidden rounded-xl border border-gold/12 bg-gradient-to-br p-4 text-left transition-all hover:border-gold/30",
            action.color
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/8 border border-gold/15 transition-transform group-hover:scale-110">
              <action.icon className="h-5 w-5 text-gold" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-gold group-hover:translate-x-0.5" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-foreground">{action.title}</h3>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground line-clamp-2">{action.desc}</p>
        </motion.button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Contextual Help Badge — small inline tooltip for new users
// ═══════════════════════════════════════════════════════════════════

export function HelpBadge({ text }: { text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-[10px] font-bold text-gold/60 hover:text-gold hover:bg-gold/10"
        aria-label="Help"
      >
        ?
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/15 bg-popover px-3 py-1.5 font-sans text-[11px] text-popover-foreground shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Starter Banner — shows for users with STS < 70 (first-time)
// ═══════════════════════════════════════════════════════════════════

export function StarterBanner({ stsScore }: { stsScore: number }) {
  const router = useRouter();
  if (stsScore >= 70) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-v2 flex items-center gap-3 rounded-xl border border-gold/20 p-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/8 border border-gold/15">
        <Sparkles className="h-4 w-4 text-gold" />
      </div>
      <div className="flex-1">
        <p className="font-sans text-xs font-medium text-foreground">
          Welcome to AURIENTA! Complete your profile to unlock all features.
        </p>
        <p className="font-sans text-[11px] text-muted-foreground">
          Your Sovereign Trust Score is {stsScore}/100 — reach 70 to unlock priority windows.
        </p>
      </div>
      <button
        onClick={() => router.push("/dashboard/profile")}
        className="btn-sheen rounded-lg bg-gold-gradient px-3 py-1.5 font-sans text-[11px] font-semibold text-black transition-all hover:shadow-[0_6px_20px_-6px_rgba(212,175,55,0.5)]"
      >
        Complete Profile
      </button>
    </motion.div>
  );
}

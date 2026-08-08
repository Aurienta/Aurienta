"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, Vote, LineChart, FileText, Bot, X, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// I2: Breadcrumbs — derives trail from pathname
export function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const trail: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += "/" + seg;
    const label = seg === "dashboard" ? "Workspace" : seg
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    trail.push({ label, href: path });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground/80">
      {trail.map((item, idx) => (
        <React.Fragment key={item.href}>
          {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
          {idx === trail.length - 1 ? (
            <span className="font-medium text-gold/80">{item.label}</span>
          ) : (
            <Link href={item.href} className="transition-colors hover:text-gold/60">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// I2: Enterprise Switcher — dropdown to select active enterprise context
export function EnterpriseSwitcher({
  enterprises,
  selectedId,
  onSelect,
}: {
  enterprises: { id: string; name: string; tier: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = enterprises.find((e) => e.id === selectedId) ?? enterprises[0];

  if (!selected) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.04] px-3 py-1.5 font-sans text-xs font-medium text-foreground transition-colors hover:border-gold/40 hover:bg-gold/[0.08]"
      >
        <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_6px_1px_rgba(212,175,55,0.5)]" />
        <span className="max-w-[120px] truncate">{selected.name}</span>
        <span className="rounded border border-gold/20 bg-gold/5 px-1 py-0.5 font-mono text-[11px] text-gold/70">
          T{selected.tier}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gold/15 bg-popover shadow-xl"
            >
              {enterprises.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { onSelect(e.id); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left font-sans text-xs transition-colors hover:bg-gold/5",
                    e.id === selected.id && "bg-gold/[0.06]"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-gold/60" />
                  <span className="flex-1 truncate font-medium">{e.name}</span>
                  <span className="font-mono text-[11px] text-gold/50">T{e.tier}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// I3: Smart Empty State
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/15 bg-gold/[0.03]">
        <Icon className="h-6 w-6 text-gold/50" />
      </div>
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm font-sans text-sm text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-xs font-semibold text-black"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

// I3: Skeleton Loader
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gold/[0.06]", className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gold/10 glass p-5">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

// I4: Onboarding Tour
export function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    { title: "Welcome to your Constitutional Workspace", body: "Your unified dashboard for every role — Capital Partner, Founding Operator, Workforce Partner, and more." },
    { title: "Your portfolio shows ownership %", body: "View your Equity Unit holdings as ownership percentage, valued at the Constitutional Percentage Price (CPP)." },
    { title: "Vote on constitutional proposals", body: "Every Equity Unit carries one vote. Participate in governance through constitutional consensus." },
    { title: "Ask the AI Copilot anything", body: "Press ⌘K (or Ctrl+K) to open the command palette. Ask about Zero Custody, graduation, or your portfolio." },
    { title: "Explore all features in the sidebar", body: "9 groups, 51 features. Click any group to expand it. Your active role reorders the groups automatically." },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="mx-4 max-w-md rounded-2xl border border-gold/20 bg-background p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold/70">
                Constitutional Onboarding · {step + 1}/{steps.length}
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="mt-4 font-serif text-xl font-semibold text-gold-gradient">
            {steps[step].title}
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
            {steps[step].body}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-gold" : "w-1.5 bg-gold/20")}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border border-gold/15 px-4 py-2 font-sans text-xs text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-full bg-gold-gradient px-5 py-2 font-sans text-xs font-semibold text-black"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="rounded-full bg-gold-gradient px-5 py-2 font-sans text-xs font-semibold text-black"
                >
                  Enter Workspace
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// I4: Help Button — floating
export function HelpButton({ onOpenTour }: { onOpenTour: () => void }) {
  const [showMenu, setShowMenu] = React.useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 right-0 w-56 overflow-hidden rounded-xl border border-gold/15 bg-popover shadow-xl"
          >
            <button
              onClick={() => { onOpenTour(); setShowMenu(false); }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left font-sans text-xs text-muted-foreground transition-colors hover:bg-gold/5 hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Restart onboarding tour
            </button>
            <Link
              href="/dashboard/constitution"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center gap-2 px-4 py-3 font-sans text-xs text-muted-foreground transition-colors hover:bg-gold/5 hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5 text-gold" /> Constitution guide
            </Link>
            <Link
              href="/dashboard/copilot"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center gap-2 px-4 py-3 font-sans text-xs text-muted-foreground transition-colors hover:bg-gold/5 hover:text-foreground"
            >
              <Bot className="h-3.5 w-3.5 text-gold" /> Ask AI Copilot
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-background/80 text-gold backdrop-blur-xl transition-all hover:gold-glow-sm"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
}

// I5: Quick Actions — floating, role-filtered
export function QuickActions({ roles }: { roles: Set<string> } ) {
  const [open, setOpen] = React.useState(false);

  const allActions = [
    { label: "Vote on open proposals", href: "/dashboard/governance", icon: Vote, roles: ["capital_partner", "board_member", "founding_operator", "manager"] },
    { label: "Place a trade", href: "/dashboard/market", icon: LineChart, roles: ["capital_partner", "board_member", "founding_operator"] },
    { label: "Create proposal", href: "/dashboard/governance", icon: FileText, roles: ["board_member", "founding_operator", "capital_partner"] },
    { label: "Submit expense", href: "/dashboard/manager", icon: FileText, roles: ["manager", "founding_operator"] },
    { label: "Ask AI Copilot", href: "/dashboard/copilot", icon: Bot, roles: ["capital_partner", "board_member", "founding_operator", "manager", "workforce_partner"] },
  ];

  const actions = allActions.filter((a) => a.roles.some((r) => roles.has(r)));

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 left-0 w-60 overflow-hidden rounded-xl border border-gold/15 bg-popover shadow-xl"
          >
            <p className="px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
              Quick Actions
            </p>
            {actions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-xs text-muted-foreground transition-colors hover:bg-gold/5 hover:text-foreground"
              >
                <a.icon className="h-3.5 w-3.5 text-gold/70" />
                {a.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient text-black shadow-[0_4px_20px_-4px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_6px_30px_-4px_rgba(212,175,55,0.8)]"
        aria-label="Quick actions"
      >
        <Plus className={cn("h-5 w-5 transition-transform", open && "rotate-45")} />
      </button>
    </div>
  );
}

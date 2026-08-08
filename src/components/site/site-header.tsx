"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck, ChevronRight } from "lucide-react";
import { AurientaMark } from "@/components/aurienta-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV: { label: string; href: string; external?: boolean }[] = [
  { label: "Constitution", href: "#constitution" },
  { label: "Pillars", href: "#pillars" },
  { label: "Tiers", href: "#tiers" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Sovereignty", href: "#sovereignty" },
  { label: "FAQ", href: "#faq" },
  { label: "Registry", href: "/registry", external: true },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-gold/10 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20">
        <Link href="/" className="group flex items-center gap-3" aria-label="AURIENTA home">
          <AurientaMark className="h-9 w-9 transition-transform duration-500 group-hover:scale-105" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold uppercase tracking-[0.34em] text-gold-gradient">
              Aurienta
            </span>
            <span className="mt-1 hidden font-sans text-[11px] uppercase tracking-[0.28em] text-muted-foreground sm:block">
              Constitutional Enterprise Infrastructure
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) =>
            item.external ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 font-sans text-sm text-muted-foreground transition-colors hover:text-gold-light"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            href="/signin"
            className="font-sans text-sm font-medium text-foreground/80 transition-colors hover:text-gold-light"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_10px_40px_-6px_rgba(212,175,55,0.8)]"
          >
            Become a Partner
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/15 text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gold/10 bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-5">
              {NAV.map((item) =>
                item.external ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 font-sans text-base text-muted-foreground transition-colors hover:bg-gold/5 hover:text-gold-light"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 font-sans text-base text-muted-foreground transition-colors hover:bg-gold/5 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                )
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-gold/10 pt-4">
                <div className="flex items-center justify-center">
                  <ThemeToggle />
                </div>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/20 px-5 py-3 font-sans text-sm font-medium text-foreground"
                >
                  <ShieldCheck className="h-4 w-4 text-gold" /> Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-5 py-3 font-sans text-sm font-semibold text-black"
                >
                  Become a Partner
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

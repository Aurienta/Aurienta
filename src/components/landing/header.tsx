"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "/#platform-modules" },
  { label: "Modules", href: "/#modules" },
  { label: "For Teams", href: "/#business-impact" },
  { label: "Security", href: "/#security" },
  { label: "Resources", href: "/#faq" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "bg-white/0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="AURIENTA home">
          <svg viewBox="0 0 40 44" className="h-8 w-8" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="20" y1="2" x2="20" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z" fill="url(#logoGrad)" />
            <path d="M12 28 Q20 34 28 28" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="20" cy="24" r="2" fill="url(#logoGrad)" />
          </svg>
          <span className="font-sans text-lg font-bold tracking-tight text-slate-900">
            AURIENTA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 font-sans text-[14px] font-medium transition-colors",
                item.label === "Home"
                  ? "text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/signin" className="font-sans text-sm font-medium text-slate-700 transition-colors hover:text-slate-900">
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
          >
            Get Started
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-sans text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3">
                <Link href="/signin" className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center font-sans text-sm font-medium text-slate-700">
                  Sign In
                </Link>
                <Link href="/register" className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-center font-sans text-sm font-semibold text-white">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

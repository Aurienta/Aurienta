"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// GPU-accelerated 3D logo (lazy-loaded, SSR disabled)
const UltraLogo3D = dynamic(
  () => import("@/components/ultra/ultra-gpu").then((m) => m.UltraLogo3D),
  { ssr: false }
);

// Ultra Logo: 3D GPU-rendered orb + indigo gradient text
function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="AURIENTA home">
      {/* GPU 3D orb (falls back to SVG if WebGL not available) */}
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 opacity-90">
          <UltraLogo3D size={32} />
        </div>
        {/* SVG fallback (always rendered, hidden behind 3D if WebGL available) */}
        <svg viewBox="0 0 40 44" className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#818CF8" />
              <stop offset="0.5" stopColor="#4F46E5" />
              <stop offset="1" stopColor="#3730A3" />
            </linearGradient>
          </defs>
          <path d="M20 2 L2 42 L9 42 L20 14 L31 42 L38 42 Z" fill="url(#logo-grad)" />
          <rect x="11" y="28" width="18" height="3.5" rx="1.5" fill="url(#logo-grad)" />
        </svg>
      </div>
      <span className="bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#3730A3] bg-clip-text font-sans text-[20px] font-bold uppercase tracking-tight text-transparent transition-all group-hover:from-[#3730A3] group-hover:via-[#4F46E5] group-hover:to-[#818CF8]">
        AURIENTA
      </span>
    </Link>
  );
}

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "#platform-modules" },
  { label: "Modules", href: "#platform-modules" },
  { label: "For Teams", href: "#business-impact" },
  { label: "Security", href: "#security" },
  { label: "Resources", href: "#faq" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-indigo-100/60 bg-white/80 shadow-[0_4px_30px_rgba(79,70,229,0.06)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      {/* GPU-accelerated glow line at bottom of header when scrolled */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
      )}
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "font-sans text-[14px] font-medium transition-all duration-200",
                item.label === "Home"
                  ? "text-[#4F46E5] relative after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#4F46E5] after:to-[#7C3AED] after:rounded-full"
                  : "text-[#64748B] hover:text-[#1E1B4B] hover:scale-105"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button className="rounded-lg p-1.5 text-[#64748B] transition-all hover:bg-indigo-50 hover:text-[#4F46E5]" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/signin" className="font-sans text-[14px] font-medium text-[#334155] transition-colors hover:text-[#1E1B4B]">
            Sign In
          </Link>
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-5 py-2 font-sans text-[13px] font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/60 hover:scale-105"
          >
            {/* GPU-style shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Get Started
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-indigo-50 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-indigo-100/60 bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-sans text-sm font-medium text-[#334155] transition-colors hover:bg-indigo-50 hover:text-[#4F46E5]">
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3">
                <Link href="/signin" className="flex-1 rounded-lg border border-indigo-200 px-4 py-2 text-center font-sans text-sm font-medium text-[#334155] transition-colors hover:bg-indigo-50">Sign In</Link>
                <Link href="/register" className="flex-1 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2 text-center font-sans text-sm font-semibold text-white shadow-lg shadow-indigo-200/50">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

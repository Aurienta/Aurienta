"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Exact logo from reference: solid indigo triangle "A" with crossbar + bold uppercase wordmark
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="AURIENTA home">
      <svg viewBox="0 0 40 44" className="h-7 w-7" fill="none">
        {/* Triangle "A" — two slanted legs meeting at peak, open at bottom */}
        <path d="M20 2 L2 42 L9 42 L20 14 L31 42 L38 42 Z" fill="#4F46E5" />
        {/* Straight crossbar in upper portion */}
        <rect x="11" y="28" width="18" height="3.5" rx="1.5" fill="#4F46E5" />
      </svg>
      <span className="font-sans text-[20px] font-bold uppercase tracking-tight text-[#0F172A]">
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
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "font-sans text-[14px] font-medium transition-colors",
                item.label === "Home"
                  ? "text-[#4F46E5] relative after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-[#4F46E5] after:rounded-full"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-slate-100 hover:text-[#0F172A]" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/signin" className="font-sans text-[14px] font-medium text-[#334155] transition-colors hover:text-[#0F172A]">
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-5 py-2 font-sans text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#4338CA] hover:shadow-md"
          >
            Get Started
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#64748B] lg:hidden"
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
            className="overflow-hidden border-t border-slate-100 bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-sans text-sm font-medium text-[#334155] hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3">
                <Link href="/signin" className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center font-sans text-sm font-medium text-[#334155]">Sign In</Link>
                <Link href="/register" className="flex-1 rounded-lg bg-[#4F46E5] px-4 py-2 text-center font-sans text-sm font-semibold text-white">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

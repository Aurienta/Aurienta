"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AurientaLogo } from "./landing-logo";

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
        {/* Logo — exact match to reference: solid indigo A + uppercase wordmark */}
        <Link href="/" aria-label="AURIENTA home">
          <AurientaLogo color="#4338CA" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "font-sans text-[14px] font-medium transition-colors",
                item.label === "Home"
                  ? "text-[#4338CA] relative after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:bg-[#4338CA] after:rounded-full"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <button className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/signin" className="font-sans text-[14px] font-medium text-slate-700 transition-colors hover:text-slate-900">
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 font-sans text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#4338CA] hover:shadow-md"
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
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
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
                <Link href="/register" className="flex-1 rounded-lg bg-[#4F46E5] px-4 py-2 text-center font-sans text-sm font-semibold text-white">
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

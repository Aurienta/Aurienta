"use client";

import Link from "next/link";
import { Shield, Lock, Cpu } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Constitution", href: "/#constitution" },
      { label: "Pillars", href: "/#pillars" },
      { label: "Tiers", href: "/#tiers" },
      { label: "Enterprise Registry", href: "/registry" },
    ],
  },
  {
    title: "Modules",
    links: [
      { label: "Governance", href: "/dashboard/governance" },
      { label: "Ownership Ledger", href: "/dashboard/portfolio" },
      { label: "Compliance", href: "/dashboard/compliance" },
      { label: "AI Intelligence", href: "/dashboard/brain-ai" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Trust Dashboard", href: "/trust" },
      { label: "Sign In", href: "/signin" },
      { label: "Become a Partner", href: "/register" },
      { label: "Legal", href: "/legal" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#0F172A]">
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 40 44" className="h-8 w-8" fill="none">
                <defs>
                  <linearGradient id="ftrLogoGrad" x1="20" y1="2" x2="20" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="0.5" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <path d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z" fill="url(#ftrLogoGrad)" />
                <path d="M12 28 Q20 34 28 28" stroke="url(#ftrLogoGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="font-sans text-[18px] font-bold uppercase text-white">AURIENTA</span>
            </div>
            <p className="mt-4 max-w-[320px] font-sans text-[13px] leading-relaxed text-slate-400">
              Constitutional enterprise infrastructure. Transforming everyday capital
              into real-economy corporate ownership through digital rules that cannot
              be bent, bypassed, or broken.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="h-3.5 w-3.5 text-[#818CF8]" /> Zero Custody
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <Cpu className="h-3.5 w-3.5 text-[#A78BFA]" /> AI Enforced
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <Shield className="h-3.5 w-3.5 text-[#67E8F9]" /> FRA No-Action
              </span>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="font-sans text-[13px] text-slate-400 transition-colors hover:text-[#818CF8]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-8 sm:flex-row">
          <p className="font-sans text-[12px] text-slate-500">
            © 2026 AURIENTA. Constitutional Enterprise Infrastructure.
          </p>
          <p className="mt-2 font-mono text-[10px] text-slate-500 sm:mt-0">
            Constitutional Hash: 0xB4F8…E7D1A
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { Shield, Lock, Cpu, Twitter, Linkedin, Github, Youtube } from "lucide-react";

const FOOTER_COLUMNS = [
  { title: "Platform", links: [
    { label: "Home", href: "/" },
    { label: "Platform Modules", href: "#platform-modules" },
    { label: "Process", href: "#process" },
    { label: "Business Impact", href: "#business-impact" },
    { label: "Security", href: "#security" },
  ]},
  { title: "Modules", links: [
    { label: "Governance", href: "/dashboard/governance" },
    { label: "Ownership Ledger", href: "/dashboard/portfolio" },
    { label: "Compliance", href: "/dashboard/compliance" },
    { label: "AI Intelligence", href: "/dashboard/brain-ai" },
    { label: "Business Operations", href: "/dashboard/manager" },
  ]},
  { title: "Resources", links: [
    { label: "Trust Dashboard", href: "/trust" },
    { label: "Enterprise Registry", href: "/registry" },
    { label: "Sign In", href: "/signin" },
    { label: "Become a Partner", href: "/register" },
    { label: "Legal", href: "/legal" },
  ]},
];

const SOCIAL_ICONS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#1a1b3e]">
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 40 44" className="h-8 w-8" fill="none">
                <path d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z" fill="white" />
                <rect x="12" y="26" width="16" height="3" rx="1" fill="white" />
              </svg>
              <span className="font-sans text-[18px] font-bold uppercase text-white">AURIENTA</span>
            </div>
            <p className="mt-4 max-w-[320px] font-sans text-[13px] leading-relaxed text-slate-400">
              Constitutional enterprise infrastructure. Transforming everyday capital
              into real-economy corporate ownership through digital rules that cannot
              be bent, bypassed, or broken.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_ICONS.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            {/* Trust badges */}
            <div className="mt-6 flex items-center gap-4">
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
              <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="font-sans text-[13px] text-slate-400 transition-colors hover:text-[#818CF8]">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row">
          <p className="font-sans text-[12px] text-slate-500">© 2026 AURIENTA. Constitutional Enterprise Infrastructure.</p>
          <div className="mt-4 flex items-center gap-6 sm:mt-0">
            <Link href="/legal" className="font-sans text-[12px] text-slate-500 hover:text-slate-300">Privacy Policy</Link>
            <Link href="/legal" className="font-sans text-[12px] text-slate-500 hover:text-slate-300">Terms of Service</Link>
            <p className="font-mono text-[10px] text-slate-600">0xB4F8…E7D1A</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

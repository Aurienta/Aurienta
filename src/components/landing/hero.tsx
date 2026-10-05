"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Shield, Cpu, TrendingUp, Scale,
  FileCheck, Building2, type LucideIcon
} from "lucide-react";

// Exact copy from reference:
const EYEBROW = "CONSTITUTIONAL ENTERPRISE INFRASTRUCTURE";
const SUBTEXT = "AURIENTA provides the constitutional infrastructure for real-economy businesses — turning capital into ownership through AI, rules, and immutable governance.";

const TRUST_ITEMS: { icon: LucideIcon; title: string; desc: string; bg: string; iconColor: string }[] = [
  { icon: Shield, title: "Non-Custodial", desc: "Full ownership remains with you.", bg: "bg-[#EEF2FF]", iconColor: "text-[#6366F1]" },
  { icon: Cpu, title: "AI-Enforced", desc: "Rules & compliance automated.", bg: "bg-[#F3E8FF]", iconColor: "text-[#7C3AED]" },
  { icon: TrendingUp, title: "Real Economy", desc: "Build and scale actual businesses.", bg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]" },
  { icon: Scale, title: "Constitutional Governance", desc: "Transparent, immutable, verifiable.", bg: "bg-[#ECFEFF]", iconColor: "text-[#0891B2]" },
];

const FLOATING_CARDS = [
  { label: "Governance & Compliance", icon: Scale, top: "5%", left: "-5%", delay: 0.5 },
  { label: "Ownership Ledger", icon: FileCheck, top: "25%", right: "-5%", delay: 0.7 },
  { label: "AI Engine", icon: Cpu, top: "50%", left: "-2%", delay: 0.9 },
  { label: "Business Operations", icon: Building2, top: "72%", right: "-2%", delay: 1.1 },
  { label: "Real Economy Growth", icon: TrendingUp, top: "10%", right: "5%", delay: 1.3 },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] pt-[100px] pb-[100px]">
      {/* Soft radial gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[15%] h-[500px] w-[500px] rounded-full bg-[#EEF2FF]/60 blur-3xl" />
        <div className="absolute top-0 right-[10%] h-[400px] w-[400px] rounded-full bg-[#ECFEFF]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* LEFT */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            {/* Eyebrow */}
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B] mb-4">
              {EYEBROW}
            </p>
            {/* Headline — 3 lines with exact colors */}
            <h1 className="font-sans text-[48px] font-extrabold leading-[1.1] tracking-tight sm:text-[56px] lg:text-[64px]">
              <span className="block text-[#0F172A]">Real Ownership.</span>
              <span className="block text-[#4F46E5]">AI-Enforced Governance.</span>
              <span className="block text-[#10B981]">Lasting Value.</span>
            </h1>
            {/* Subtext */}
            <p className="mt-6 max-w-[480px] font-sans text-[18px] leading-[1.6] text-[#475569]">
              {SUBTEXT}
            </p>
            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="group inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-7 py-3.5 font-sans text-[14px] font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:bg-[#4338CA] hover:shadow-xl hover:shadow-indigo-300/50">
                Explore the Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-6 py-3.5 font-sans text-[14px] font-semibold text-[#334155] shadow-sm transition-all hover:border-[#94A3B8] hover:bg-slate-50">
                <Play className="h-4 w-4 text-[#4F46E5]" />
                Watch Video
              </button>
            </div>
            {/* Trust strip */}
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} className="flex flex-col gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-sans text-[14px] font-bold text-[#0F172A]">{item.title}</p>
                    <p className="font-sans text-[13px] leading-tight text-[#64748B]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — 3D cityscape */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden h-[520px] lg:block xl:h-[580px]">
            <FloatingCityscape />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingCityscape() {
  return (
    <div className="relative h-full w-full">
      {/* Soft radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#EEF2FF] to-transparent blur-2xl" />

      {/* Glowing orbital ring */}
      <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border-2 border-[#C7D2FE]/30" />
        <div className="absolute inset-3 rounded-full border border-[#DDD6FE]/20" />
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#22D3EE] shadow-[0_0_12px_4px_rgba(34,211,238,0.6)]" />
        </motion.div>
      </div>

      {/* Isometric 3D city */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 360 360" className="h-[320px] w-[320px] drop-shadow-2xl" style={{ transform: "perspective(900px) rotateX(20deg) rotateZ(-10deg)" }}>
          {/* Platform */}
          <ellipse cx="180" cy="180" rx="150" ry="45" fill="white" stroke="#E2E8F0" strokeWidth="1" opacity="0.95" />
          <ellipse cx="180" cy="172" rx="150" ry="45" fill="url(#platGrad)" opacity="0.9" />

          {/* Center building (dark indigo with A logo) */}
          <polygon points="156,172 156,60 180,48 180,172" fill="url(#centerBldg)" />
          <polygon points="180,48 204,60 204,172 180,172" fill="url(#centerBldgDark)" />
          <polygon points="156,60 180,48 204,60 180,72" fill="url(#centerBldgTop)" />
          {[0,1,2,3,4].map(r => (
            <React.Fragment key={r}>
              <rect x="161" y={72+r*18} width="5" height="10" rx="1" fill="#A5B4FC" opacity="0.7" />
              <rect x="185" y={68+r*18} width="5" height="10" rx="1" fill="#818CF8" opacity="0.5" />
            </React.Fragment>
          ))}

          {/* Left building (glass blue) */}
          <polygon points="104,172 104,100 128,88 128,172" fill="url(#glassBldg)" />
          <polygon points="128,88 152,100 152,172 128,172" fill="url(#glassBldgDark)" />
          <polygon points="104,100 128,88 152,100 128,112" fill="url(#glassBldgTop)" />
          {[0,1,2].map(r => <rect key={r} x="110" y={108+r*18} width="5" height="9" rx="1" fill="#BFDBFE" opacity="0.6" />)}

          {/* Right building (glass blue) */}
          <polygon points="208,172 208,92 232,80 232,172" fill="url(#glassBldg)" />
          <polygon points="232,80 256,92 256,172 232,172" fill="url(#glassBldgDark)" />
          <polygon points="208,92 232,80 256,92 232,104" fill="url(#glassBldgTop)" />
          {[0,1,2,3].map(r => <rect key={r} x="214" y={100+r*16} width="5" height="9" rx="1" fill="#BFDBFE" opacity="0.5" />)}

          {/* Far left small */}
          <polygon points="60,172 60,124 84,112 84,172" fill="url(#glassBldg)" opacity="0.7" />
          <polygon points="84,112 108,124 108,172 84,172" fill="url(#glassBldgDark)" opacity="0.7" />
          <polygon points="60,124 84,112 108,124 84,136" fill="url(#glassBldgTop)" opacity="0.7" />

          {/* Far right small */}
          <polygon points="260,172 260,116 284,104 284,172" fill="url(#glassBldg)" opacity="0.7" />
          <polygon points="284,104 308,116 308,172 284,172" fill="url(#glassBldgDark)" opacity="0.7" />
          <polygon points="260,116 284,104 308,116 284,128" fill="url(#glassBldgTop)" opacity="0.7" />

          {/* Central AURIENTA mark on building */}
          <circle cx="180" cy="40" r="16" fill="url(#logoGrad)" />
          <text x="180" y="47" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="sans-serif">A</text>

          <defs>
            <linearGradient id="platGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#F8FAFC" /><stop offset="1" stopColor="#E2E8F0" /></linearGradient>
            <linearGradient id="centerBldg" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6366F1" /><stop offset="1" stopColor="#3730A3" /></linearGradient>
            <linearGradient id="centerBldgDark" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4F46E5" /><stop offset="1" stopColor="#1E1B4B" /></linearGradient>
            <linearGradient id="centerBldgTop" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#A5B4FC" /><stop offset="1" stopColor="#818CF8" /></linearGradient>
            <linearGradient id="glassBldg" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DBEAFE" /><stop offset="1" stopColor="#93C5FD" /></linearGradient>
            <linearGradient id="glassBldgDark" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#BFDBFE" /><stop offset="1" stopColor="#60A5FA" /></linearGradient>
            <linearGradient id="glassBldgTop" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#EFF6FF" /><stop offset="1" stopColor="#DBEAFE" /></linearGradient>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F46E5" /><stop offset="0.5" stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" /></linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating translucent cards */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay, duration: 0.6 }}
          className="absolute" style={{ top: card.top, left: card.left, right: card.right }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/85 px-4 py-2.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#EEF2FF] to-[#F3E8FF]">
              <card.icon className="h-4 w-4 text-[#4F46E5]" />
            </div>
            <span className="font-sans text-[12px] font-semibold text-slate-700">{card.label}</span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

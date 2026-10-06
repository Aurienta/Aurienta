"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Shield, Cpu, TrendingUp, Scale,
  FileCheck, Building2, type LucideIcon
} from "lucide-react";

const EYEBROW = "CONSTITUTIONAL ENTERPRISE INFRASTRUCTURE";
const SUBTEXT = "AURIENTA provides the constitutional infrastructure for real-economy businesses — turning capital into ownership through AI, rules, and immutable governance.";

// EXACT colors from reference pixel analysis:
// Line 1: #1E1B4B (deep navy)
// Line 2: gradient #6D28D9 (purple) → #10B981 (teal/green)
// Line 3: #6D28D9 (purple)
const TRUST_ITEMS: { icon: LucideIcon; title: string; desc: string; bg: string; iconColor: string }[] = [
  { icon: Shield, title: "Non-Custodial", desc: "Full ownership remains with you.", bg: "bg-[#EEF2FF]", iconColor: "text-[#6366F1]" },
  { icon: Cpu, title: "AI-Enforced", desc: "Rules & compliance automated.", bg: "bg-[#F3E8FF]", iconColor: "text-[#7C3AED]" },
  { icon: TrendingUp, title: "Real Economy", desc: "Build and scale actual businesses.", bg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]" },
  { icon: Scale, title: "Constitutional Governance", desc: "Transparent, immutable, verifiable.", bg: "bg-[#ECFEFF]", iconColor: "text-[#0891B2]" },
];

const FLOATING_CARDS = [
  { label: "Governance & Compliance", icon: Scale, top: "4%", left: "-4%", delay: 0.5 },
  { label: "Ownership Ledger", icon: FileCheck, top: "22%", right: "-4%", delay: 0.7 },
  { label: "AI Engine", icon: Cpu, top: "48%", left: "-2%", delay: 0.9 },
  { label: "Business Operations", icon: Building2, top: "68%", right: "-2%", delay: 1.1 },
  { label: "Real Economy Growth", icon: TrendingUp, top: "8%", right: "8%", delay: 1.3 },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] pt-[100px] pb-[100px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[15%] h-[500px] w-[500px] rounded-full bg-[#EEF2FF]/60 blur-3xl" />
        <div className="absolute top-0 right-[10%] h-[400px] w-[400px] rounded-full bg-[#ECFEFF]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* LEFT */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B] mb-4">{EYEBROW}</p>

            {/* Headline with EXACT reference colors */}
            <h1 className="font-sans text-[48px] font-bold leading-[1.1] tracking-tight sm:text-[56px] lg:text-[60px]">
              {/* Line 1: deep navy #1E1B4B */}
              <span className="block text-[#1E1B4B]">Real Ownership.</span>
              {/* Line 2: gradient purple #6D28D9 → teal #10B981 */}
              <span className="block bg-gradient-to-r from-[#6D28D9] to-[#10B981] bg-clip-text text-transparent">AI-Enforced Governance.</span>
              {/* Line 3: purple #6D28D9 */}
              <span className="block text-[#6D28D9]">Lasting Value.</span>
            </h1>

            <p className="mt-6 max-w-[480px] font-sans text-[18px] leading-[1.6] text-[#475569]">{SUBTEXT}</p>

            {/* CTAs — primary #5B50E8, secondary outlined */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="group inline-flex items-center gap-2 rounded-lg bg-[#5B50E8] px-7 py-3.5 font-sans text-[14px] font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:bg-[#4F46E5] hover:shadow-xl hover:shadow-indigo-300/50">
                Explore the Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-6 py-3.5 font-sans text-[14px] font-semibold text-[#334155] shadow-sm transition-all hover:border-[#94A3B8] hover:bg-slate-50">
                <Play className="h-4 w-4 text-[#5B50E8]" />
                Watch Video
              </button>
            </div>

            {/* Trust strip — 4 indicators */}
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} className="flex flex-col gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-sans text-[14px] font-bold text-[#1E1B4B]">{item.title}</p>
                    <p className="font-sans text-[13px] leading-tight text-[#64748B]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — 3D isometric cityscape */}
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
      {/* Background glow — pale lavender */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#EEF2FF] to-transparent blur-2xl" />

      {/* Glowing cyan orbital ring */}
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE]/20" />
        <div className="absolute inset-4 rounded-full border border-[#A5F3FC]/15" />
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#22D3EE] shadow-[0_0_16px_6px_rgba(34,211,238,0.5)]" />
        </motion.div>
      </div>

      {/* Isometric 3D city — 10 buildings on circular platform */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 400 400" className="h-[340px] w-[340px] drop-shadow-2xl" style={{ transform: "perspective(900px) rotateX(22deg) rotateZ(-12deg)" }}>
          {/* Circular platform */}
          <ellipse cx="200" cy="210" rx="170" ry="50" fill="white" stroke="#E2E8F0" strokeWidth="1" opacity="0.95" />
          <ellipse cx="200" cy="200" rx="170" ry="50" fill="url(#platformGrad)" opacity="0.9" />
          {/* Green park spaces */}
          <ellipse cx="150" cy="205" rx="25" ry="8" fill="#D1FAE5" opacity="0.6" />
          <ellipse cx="250" cy="200" rx="20" ry="6" fill="#D1FAE5" opacity="0.5" />

          {/* Center tall building (dark indigo with A logo) */}
          <polygon points="172,200 172,70 200,55 200,200" fill="url(#centerBldg)" />
          <polygon points="200,55 228,70 228,200 200,200" fill="url(#centerBldgDark)" />
          <polygon points="172,70 200,55 228,70 200,88" fill="url(#centerBldgTop)" />
          {[0,1,2,3,4,5].map(r => (
            <React.Fragment key={r}>
              <rect x="178" y={85+r*18} width="6" height="10" rx="1" fill="#A5B4FC" opacity="0.7" />
              <rect x="206" y={80+r*18} width="6" height="10" rx="1" fill="#818CF8" opacity="0.5" />
            </React.Fragment>
          ))}

          {/* Left building 1 (glass blue) */}
          <polygon points="112,200 112,105 140,90 140,200" fill="url(#glassBldg)" />
          <polygon points="140,90 168,105 168,200 140,200" fill="url(#glassBldgDark)" />
          <polygon points="112,105 140,90 168,105 140,120" fill="url(#glassBldgTop)" />
          {[0,1,2,3].map(r => <rect key={r} x="119" y={115+r*18} width="5" height="9" rx="1" fill="#BFDBFE" opacity="0.6" />)}

          {/* Left building 2 (smaller glass) */}
          <polygon points="70,200 70,130 95,118 95,200" fill="url(#glassBldg)" opacity="0.8" />
          <polygon points="95,118 120,130 120,200 95,200" fill="url(#glassBldgDark)" opacity="0.8" />
          <polygon points="70,130 95,118 120,130 95,143" fill="url(#glassBldgTop)" opacity="0.8" />

          {/* Right building 1 (glass blue) */}
          <polygon points="232,200 232,95 260,80 260,200" fill="url(#glassBldg)" />
          <polygon points="260,80 288,95 288,200 260,200" fill="url(#glassBldgDark)" />
          <polygon points="232,95 260,80 288,95 260,108" fill="url(#glassBldgTop)" />
          {[0,1,2,3,4].map(r => <rect key={r} x="239" y={105+r*16} width="5" height="9" rx="1" fill="#BFDBFE" opacity="0.5" />)}

          {/* Right building 2 (smaller glass) */}
          <polygon points="295,200 295,120 320,108 320,200" fill="url(#glassBldg)" opacity="0.8" />
          <polygon points="320,108 345,120 345,200 320,200" fill="url(#glassBldgDark)" opacity="0.8" />
          <polygon points="295,120 320,108 345,120 320,133" fill="url(#glassBldgTop)" opacity="0.8" />

          {/* Far left small */}
          <polygon points="35,200 35,145 58,133 58,200" fill="url(#glassBldg)" opacity="0.6" />
          <polygon points="58,133 80,145 80,200 58,200" fill="url(#glassBldgDark)" opacity="0.6" />
          <polygon points="35,145 58,133 80,145 58,158" fill="url(#glassBldgTop)" opacity="0.6" />

          {/* Far right small */}
          <polygon points="350,200 350,140 372,128 372,200" fill="url(#glassBldg)" opacity="0.6" />
          <polygon points="372,128 394,140 394,200 372,200" fill="url(#glassBldgDark)" opacity="0.6" />
          <polygon points="350,140 372,128 394,140 372,153" fill="url(#glassBldgTop)" opacity="0.6" />

          {/* Central AURIENTA mark on building top */}
          <circle cx="200" cy="45" r="18" fill="url(#logoGrad)" />
          <text x="200" y="53" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white" fontFamily="sans-serif">A</text>

          {/* Connector lines */}
          <line x1="200" y1="45" x2="90" y2="30" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
          <line x1="200" y1="45" x2="310" y2="35" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />

          <defs>
            <linearGradient id="platformGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#F8FAFC" /><stop offset="1" stopColor="#E2E8F0" /></linearGradient>
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

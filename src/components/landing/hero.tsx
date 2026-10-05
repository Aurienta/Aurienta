"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Shield, Cpu, TrendingUp, Scale,
  Building2, FileCheck, BarChart3, Layers, type LucideIcon
} from "lucide-react";

const TRUST_INDICATORS: { icon: LucideIcon; title: string; desc: string; bg: string; text: string }[] = [
  { icon: Shield, title: "Non-Custodial", desc: "Your capital never touches AURIENTA", bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
  { icon: Cpu, title: "AI-Enforced", desc: "Rules that cannot be bypassed", bg: "bg-[#F3E8FF]", text: "text-[#7C3AED]" },
  { icon: TrendingUp, title: "Real Economy", desc: "Ownership, not speculation", bg: "bg-[#ECFDF5]", text: "text-[#0D9488]" },
  { icon: Scale, title: "Constitutional", desc: "Governance by code, not promises", bg: "bg-[#ECFEFF]", text: "text-[#0891B2]" },
];

const FLOATING_CARDS = [
  { label: "Governance & Compliance", icon: Scale, top: "5%", left: "-2%", delay: 0.5 },
  { label: "Ownership Ledger", icon: FileCheck, top: "25%", right: "-2%", delay: 0.7 },
  { label: "AI Engine", icon: Cpu, top: "50%", left: "2%", delay: 0.9 },
  { label: "Business Operations", icon: Building2, top: "72%", right: "2%", delay: 1.1 },
  { label: "Real Economy Growth", icon: TrendingUp, top: "12%", right: "8%", delay: 1.3 },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] pt-[100px] pb-[100px] sm:pt-[120px] sm:pb-[120px]">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[20%] h-[400px] w-[400px] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute top-10 right-[20%] h-[400px] w-[400px] rounded-full bg-cyan-100/30 blur-3xl" />
        <div className="absolute top-40 left-[35%] h-[300px] w-[300px] rounded-full bg-violet-100/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-sans text-[42px] font-bold leading-[1.1] tracking-tight sm:text-[52px] lg:text-[60px] xl:text-[68px]">
              <span className="block text-[#1E293B]">Real Ownership.</span>
              <span className="block bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
                AI-Enforced Governance.
              </span>
              <span className="block bg-gradient-to-r from-[#0891B2] to-[#0D9488] bg-clip-text text-transparent">
                Lasting Value.
              </span>
            </h1>

            <p className="mt-6 max-w-[480px] font-sans text-[18px] leading-[1.6] text-[#64748B]">
              AURIENTA is a constitutional enterprise infrastructure that transforms
              everyday capital into real-economy corporate ownership through digital rules
              that cannot be bent, bypassed, or broken.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-3.5 font-sans text-[14px] font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:bg-[#4338CA] hover:shadow-xl hover:shadow-indigo-300/50"
              >
                Explore the Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-6 py-3.5 font-sans text-[14px] font-semibold text-slate-700 shadow-sm transition-all hover:border-[#CBD5E1] hover:bg-[#F8FAFC]">
                <Play className="h-4 w-4 text-[#4F46E5]" />
                Watch Video
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {TRUST_INDICATORS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex flex-col gap-2"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.text}`} />
                  </div>
                  <div>
                    <p className="font-sans text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="font-sans text-[11px] leading-tight text-slate-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — 3D Architectural Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden h-[520px] lg:block xl:h-[580px]"
          >
            <ArchitecturalVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ArchitecturalVisual() {
  return (
    <div className="relative h-full w-full">
      {/* Orbital rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-indigo-200/60"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-100/60"
      />
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-100/50 to-cyan-100/40 blur-2xl" />

      {/* Central isometric platform */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 320 320" className="h-[300px] w-[300px] drop-shadow-2xl" style={{ transform: "perspective(800px) rotateX(18deg) rotateZ(-8deg)" }}>
          {/* Base platform */}
          <ellipse cx="160" cy="160" rx="140" ry="42" fill="url(#baseGlow)" opacity="0.2" />
          <ellipse cx="160" cy="152" rx="130" ry="38" fill="white" stroke="#E2E8F0" strokeWidth="1" />
          <ellipse cx="160" cy="146" rx="130" ry="38" fill="url(#platGrad)" opacity="0.9" />

          {/* Buildings — isometric */}
          {/* Center tall building */}
          <polygon points="138,146 138,70 160,58 160,146" fill="url(#bldgGrad1)" />
          <polygon points="160,58 182,70 182,146 160,146" fill="url(#bldgGrad2)" />
          <polygon points="138,70 160,58 182,70 160,82" fill="url(#bldgTop)" />

          {/* Left building */}
          <polygon points="92,146 92,98 114,86 114,146" fill="url(#bldgGrad1)" />
          <polygon points="114,86 136,98 136,146 114,146" fill="url(#bldgGrad2)" />
          <polygon points="92,98 114,86 136,98 114,110" fill="url(#bldgTop)" />

          {/* Right building */}
          <polygon points="182,146 182,92 204,80 204,146" fill="url(#bldgGrad1)" />
          <polygon points="204,80 226,92 226,146 204,146" fill="url(#bldgGrad2)" />
          <polygon points="182,92 204,80 226,92 204,104" fill="url(#bldgTop)" />

          {/* Far left small */}
          <polygon points="58,146 58,114 80,102 80,146" fill="url(#bldgGrad1)" opacity="0.7" />
          <polygon points="80,102 102,114 102,146 80,146" fill="url(#bldgGrad2)" opacity="0.7" />
          <polygon points="58,114 80,102 102,114 80,126" fill="url(#bldgTop)" opacity="0.7" />

          {/* Far right small */}
          <polygon points="226,146 226,108 248,96 248,146" fill="url(#bldgGrad1)" opacity="0.7" />
          <polygon points="248,96 270,108 270,146 248,146" fill="url(#bldgGrad2)" opacity="0.7" />
          <polygon points="226,108 248,96 270,108 248,120" fill="url(#bldgTop)" opacity="0.7" />

          {/* Windows */}
          {[0, 1, 2, 3].map((row) => (
            <React.Fragment key={row}>
              <rect x="143" y={78 + row * 16} width="6" height="9" rx="1" fill="#A5B4FC" opacity="0.7" />
              <rect x="165" y={74 + row * 16} width="6" height="9" rx="1" fill="#818CF8" opacity="0.5" />
              <rect x="97" y={104 + row * 14} width="5" height="7" rx="1" fill="#A5B4FC" opacity="0.5" />
              <rect x="187" y={98 + row * 14} width="5" height="7" rx="1" fill="#818CF8" opacity="0.4" />
            </React.Fragment>
          ))}

          {/* Central AURIENTA mark */}
          <circle cx="160" cy="48" r="14" fill="url(#logoGrad)" />
          <text x="160" y="54" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="sans-serif">A</text>

          {/* Connector lines from center to floating cards */}
          <line x1="160" y1="48" x2="80" y2="30" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          <line x1="160" y1="48" x2="250" y2="60" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />

          <defs>
            <linearGradient id="baseGlow" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#4F46E5" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="platGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#F8FAFC" />
              <stop offset="1" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="bldgGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#A5B4FC" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="bldgGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#3730A3" />
            </linearGradient>
            <linearGradient id="bldgTop" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#C7D2FE" />
              <stop offset="1" stopColor="#A5B4FC" />
            </linearGradient>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#4F46E5" />
              <stop offset="0.5" stopColor="#7C3AED" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating cards */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.6 }}
          className="absolute"
          style={{ top: card.top, left: card.left, right: card.right }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white/95 px-3.5 py-2.5 shadow-lg shadow-slate-200/40 backdrop-blur-sm"
          >
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

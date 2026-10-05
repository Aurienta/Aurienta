"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Shield, Cpu, TrendingUp, Scale,
  Building2, FileCheck, BarChart3, Rocket, Layers, type LucideIcon
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// HERO — Pixel-accurate recreation of the reference image
// Left: headline + description + CTAs + trust indicators
// Right: 3D architectural visual with floating cards
// ═══════════════════════════════════════════════════════════════

const TRUST_INDICATORS: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: Shield, title: "Non-Custodial", desc: "Your capital never touches AURIENTA", color: "text-indigo-500 bg-indigo-50" },
  { icon: Cpu, title: "AI-Enforced", desc: "Rules that cannot be bypassed", color: "text-violet-500 bg-violet-50" },
  { icon: TrendingUp, title: "Real Economy", desc: "Ownership, not speculation", color: "text-teal-500 bg-teal-50" },
  { icon: Scale, title: "Constitutional", desc: "Governance by code, not promises", color: "text-cyan-500 bg-cyan-50" },
];

const FLOATING_CARDS = [
  { label: "Governance & Compliance", icon: Scale, top: "8%", left: "0%", delay: 0.5 },
  { label: "Ownership Ledger", icon: FileCheck, top: "30%", right: "0%", delay: 0.7 },
  { label: "AI Engine", icon: Cpu, top: "55%", left: "5%", delay: 0.9 },
  { label: "Business Operations", icon: Building2, top: "75%", right: "5%", delay: 1.1 },
  { label: "Real Economy Growth", icon: TrendingUp, top: "15%", right: "10%", delay: 1.3 },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-24 pb-16 sm:pt-32 lg:pt-36">
      {/* Subtle background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-cyan-100/30 blur-3xl" />
        <div className="absolute top-40 left-1/3 h-72 w-72 rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* LEFT — Headline + CTAs + Trust indicators */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-sans text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block text-slate-900">Real Ownership.</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-500 bg-clip-text text-transparent">
                AI-Enforced Governance.
              </span>
              <span className="block bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                Lasting Value.
              </span>
            </h1>

            <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-slate-600 sm:text-lg">
              AURIENTA is a constitutional enterprise infrastructure that transforms
              everyday capital into real-economy corporate ownership through digital rules
              that cannot be bent, bypassed, or broken.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:brightness-110"
              >
                Explore the Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-sans text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50">
                <Play className="h-4 w-4 text-indigo-500" />
                Watch Video
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {TRUST_INDICATORS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex flex-col gap-2"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="font-sans text-xs text-slate-500">{item.desc}</p>
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
            className="relative hidden h-[500px] lg:block xl:h-[560px]"
          >
            <ArchitecturalVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// Architectural Visual — SVG + CSS based 3D isometric platform
// ═══════════════════════════════════════════════════════════════

function ArchitecturalVisual() {
  return (
    <div className="relative h-full w-full">
      {/* Central orbital ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-indigo-200"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-100"
      />
      <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-100/40 to-cyan-100/40 blur-2xl" />

      {/* Central platform — isometric city */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 300 300" className="h-[280px] w-[280px] drop-shadow-2xl" style={{ transform: "perspective(800px) rotateX(15deg) rotateZ(-5deg)" }}>
          {/* Base platform */}
          <ellipse cx="150" cy="150" rx="130" ry="40" fill="url(#baseGrad)" opacity="0.15" />
          <ellipse cx="150" cy="140" rx="120" ry="35" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <ellipse cx="150" cy="135" rx="120" ry="35" fill="url(#platGrad)" opacity="0.8" />

          {/* Buildings — isometric */}
          {/* Building 1 (tall, center) */}
          <polygon points="130,135 130,70 150,60 150,135" fill="url(#bldgGrad1)" />
          <polygon points="150,60 170,70 170,135 150,135" fill="url(#bldgGrad2)" />
          <polygon points="130,70 150,60 170,70 150,80" fill="url(#bldgTop)" />

          {/* Building 2 (medium, left) */}
          <polygon points="90,135 90,95 110,85 110,135" fill="url(#bldgGrad1)" />
          <polygon points="110,85 130,95 130,135 110,135" fill="url(#bldgGrad2)" />
          <polygon points="90,95 110,85 130,95 110,105" fill="url(#bldgTop)" />

          {/* Building 3 (medium, right) */}
          <polygon points="170,135 170,90 190,80 190,135" fill="url(#bldgGrad1)" />
          <polygon points="190,80 210,90 210,135 190,135" fill="url(#bldgGrad2)" />
          <polygon points="170,90 190,80 210,90 190,100" fill="url(#bldgTop)" />

          {/* Building 4 (small, far left) */}
          <polygon points="60,135 60,110 80,100 80,135" fill="url(#bldgGrad1)" opacity="0.7" />
          <polygon points="80,100 100,110 100,135 80,135" fill="url(#bldgGrad2)" opacity="0.7" />
          <polygon points="60,110 80,100 100,110 80,120" fill="url(#bldgTop)" opacity="0.7" />

          {/* Building 5 (small, far right) */}
          <polygon points="210,135 210,105 230,95 230,135" fill="url(#bldgGrad1)" opacity="0.7" />
          <polygon points="230,95 250,105 250,135 230,135" fill="url(#bldgGrad2)" opacity="0.7" />
          <polygon points="210,105 230,95 250,105 230,115" fill="url(#bldgTop)" opacity="0.7" />

          {/* Windows on buildings */}
          {[0, 1, 2, 3].map((row) => (
            <React.Fragment key={row}>
              <rect x="135" y={75 + row * 15} width="5" height="8" fill="#818cf8" opacity="0.6" />
              <rect x="155" y={72 + row * 15} width="5" height="8" fill="#818cf8" opacity="0.4" />
            </React.Fragment>
          ))}

          {/* Central AURIENTA mark */}
          <circle cx="150" cy="50" r="12" fill="url(#logoGrad)" opacity="0.9" />
          <text x="150" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">A</text>

          {/* Gradients */}
          <defs>
            <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="platGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f8fafc" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="bldgGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="bldgGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="bldgTop" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#c7d2fe" />
              <stop offset="1" stopColor="#a5b4fc" />
            </linearGradient>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#818cf8" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating capability cards */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.6 }}
          className="absolute"
          style={{
            top: card.top,
            left: card.left,
            right: card.right,
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/95 px-3.5 py-2.5 shadow-lg shadow-slate-200/50 backdrop-blur-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50">
              <card.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-700">{card.label}</span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Activity, Zap, Clock } from "lucide-react";

const VALUE_POINTS = [
  "End-to-end business lifecycle support",
  "AI-driven compliance and risk management",
  "Immutable ownership and audit trails",
  "Seamless integration with government and financial systems",
];

const METRICS = [
  { value: "100%", label: "Ownership Protection", color: "text-indigo-600" },
  { value: "24/7", label: "AI Monitoring", color: "text-violet-600" },
  { value: "< 1s", label: "System Response", color: "text-blue-600" },
  { value: "99.9%", label: "Uptime Availability", color: "text-cyan-600" },
];

export function BusinessImpact() {
  return (
    <section id="business-impact" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
            Platform Preview
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold text-slate-900 sm:text-4xl">
            A Smarter Way to Build
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* LEFT — Value content + metrics */}
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
              Built for Real Businesses
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold text-slate-900">
              Powerful Tools for<br />Real-World Impact
            </h3>
            <p className="mt-4 font-sans text-sm leading-relaxed text-slate-500">
              AURIENTA provides the constitutional infrastructure that enables real-economy
              enterprises to form, raise capital, operate, and graduate into sovereign
              independence — all under AI-enforced governance.
            </p>

            {/* Check marks */}
            <div className="mt-6 space-y-3">
              {VALUE_POINTS.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="font-sans text-sm text-slate-700">{point}</span>
                </motion.div>
              ))}
            </div>

            <a href="#" className="mt-8 inline-flex items-center gap-1 font-sans text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Explore Use Cases
              <ArrowRight className="h-4 w-4" />
            </a>

            {/* Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-100 pt-8 sm:grid-cols-4 lg:grid-cols-2">
              {METRICS.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className={`font-sans text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="mt-0.5 font-sans text-xs text-slate-500">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// Dashboard Preview — visual mock (not real backend)
// ═══════════════════════════════════════════════════════════════

function DashboardPreview() {
  const sidebarItems = ["Overview", "Governance", "Compliance", "Operations", "Analytics", "Settings"];
  return (
    <div className="flex h-[420px] bg-slate-50">
      {/* Sidebar */}
      <div className="hidden w-48 shrink-0 bg-slate-900 p-4 sm:block">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500" />
          <span className="font-sans text-sm font-bold text-white">AURIENTA</span>
        </div>
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item, i) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 font-sans text-xs ${
                i === 0
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-5">
        <p className="font-sans text-sm font-semibold text-slate-900">Good morning, Alex</p>
        <p className="font-sans text-xs text-slate-400">EcoPack Solutions · Tier C</p>

        {/* KPI cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "$2.48M", color: "text-indigo-600" },
            { label: "Active Projects", value: "8", color: "text-violet-600" },
            { label: "Equity Units", value: "12,450", color: "text-cyan-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="font-sans text-[10px] text-slate-400">{kpi.label}</p>
              <p className={`mt-0.5 font-sans text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Chart mock */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
          <p className="mb-2 font-sans text-xs font-semibold text-slate-700">Business Performance</p>
          <svg viewBox="0 0 300 80" className="h-20 w-full">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />
            <path
              d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8 L300,80 L0,80 Z"
              fill="url(#chartGrad)"
            />
          </svg>
        </div>

        {/* AI Insights panel */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-xs font-semibold text-slate-900">AI Insights</p>
            <p className="font-sans text-[10px] text-slate-500">3 new recommendations ready</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-sans text-[10px] font-medium text-emerald-600">Active</span>
        </div>
      </div>
    </div>
  );
}

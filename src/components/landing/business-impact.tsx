"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap } from "lucide-react";

const VALUE_POINTS = [
  "End-to-end business lifecycle support",
  "AI-driven compliance and risk management",
  "Immutable ownership and audit trails",
  "Seamless integration with government and financial systems",
];

const METRICS = [
  { value: "100%", label: "Ownership Protection", color: "text-[#6366F1]" },
  { value: "24/7", label: "AI Monitoring", color: "text-[#7C3AED]" },
  { value: "< 1s", label: "System Response", color: "text-[#4F46E5]" },
  { value: "99.9%", label: "Uptime Availability", color: "text-[#0891B2]" },
];

const SIDEBAR_ITEMS = ["Overview", "Governance", "Compliance", "Operations", "Analytics", "Settings"];

export function BusinessImpact() {
  return (
    <section id="business-impact" className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Platform Preview header */}
        <div className="mb-16">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6366F1]">PLATFORM PREVIEW</p>
          <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E1B4B]">A Smarter Way to Build</h2>
          <p className="mt-3 max-w-[480px] font-sans text-[16px] leading-[1.6] text-[#4B5563]">Get a complete view of your business with real-time insights, AI recommendations and powerful automation.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* LEFT — Value content */}
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6366F1]">BUILT FOR REAL BUSINESSES</p>
            <h3 className="mt-2 font-sans text-[36px] font-bold leading-[1.2] text-[#1E1B4B]">Powerful Tools for<br />Real-World Impact</h3>
            <p className="mt-6 font-sans text-[16px] leading-[1.6] text-[#4B5563]">Designed for SMEs, enterprises and institutional partners who want to build sustainable, compliant and profitable businesses in the real economy.</p>

            <div className="mt-8 space-y-4">
              {VALUE_POINTS.map((point, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ECFDF5]">
                    <Check className="h-4 w-4 text-[#10B981]" />
                  </div>
                  <span className="font-sans text-[15px] text-[#374151]">{point}</span>
                </motion.div>
              ))}
            </div>

            <button className="mt-8 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 font-sans text-[14px] font-semibold text-[#4F46E5] shadow-sm transition-all hover:border-[#CBD5E1] hover:bg-slate-50">
              Explore Use Cases <ArrowRight className="h-4 w-4" />
            </button>

            {/* Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#E5E7EB] pt-8 sm:grid-cols-4 lg:grid-cols-2">
              {METRICS.map((metric, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className={`font-sans text-[28px] font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="mt-0.5 font-sans text-[13px] text-[#64748B]">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard Preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="flex h-[440px] bg-[#F8FAFC]">
      {/* Dark sidebar */}
      <div className="hidden w-48 shrink-0 bg-[#1F2937] p-4 sm:block">
        <div className="flex items-center gap-2 mb-6">
          <svg viewBox="0 0 40 44" className="h-6 w-6" fill="none">
            <path d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z" fill="#6366F1" />
            <rect x="12" y="26" width="16" height="3" rx="1" fill="#6366F1" />
          </svg>
          <span className="font-sans text-[14px] font-bold text-white">AURIENTA</span>
        </div>
        <nav className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item, i) => (
            <div key={item} className={`rounded-lg px-3 py-2 font-sans text-[12px] ${i === 0 ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "text-[#94A3B8]"}`}>{item}</div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[14px] font-semibold text-[#111827]">Good morning, Alex</p>
            <p className="font-sans text-[12px] text-[#94A3B8]">EcoPack Solutions · Tier C</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A78BFA]" />
        </div>

        {/* KPI cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "$2,480,000", change: "+12.5%", color: "text-[#111827]", changeColor: "text-[#10B981]" },
            { label: "Active Projects", value: "8", change: "+2", color: "text-[#6366F1]", changeColor: "text-[#10B981]" },
            { label: "Equity Units", value: "12,450", change: "+340", color: "text-[#7C3AED]", changeColor: "text-[#10B981]" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <p className="font-sans text-[10px] text-[#94A3B8]">{kpi.label}</p>
              <p className={`mt-0.5 font-sans text-[18px] font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className={`font-sans text-[10px] ${kpi.changeColor}`}>{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
          <p className="mb-2 font-sans text-[12px] font-semibold text-[#1F2937]">Business Performance</p>
          <svg viewBox="0 0 300 80" className="h-20 w-full">
            <defs>
              <linearGradient id="chartGradBiz" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#818CF8" stopOpacity="0.3" />
                <stop offset="1" stopColor="#818CF8" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 40, 60].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#F3F4F6" strokeWidth="1" />)}
            <path d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8" fill="none" stroke="#818CF8" strokeWidth="2.5" />
            <path d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8 L300,80 L0,80 Z" fill="url(#chartGradBiz)" />
            <circle cx="80" cy="40" r="3" fill="#818CF8" />
            <circle cx="160" cy="25" r="3" fill="#818CF8" />
            <circle cx="240" cy="15" r="3" fill="#818CF8" />
          </svg>
        </div>

        {/* AI Insights */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#EEF2FF] to-[#F3E8FF] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366F1]/10">
            <Zap className="h-4 w-4 text-[#6366F1]" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-[12px] font-semibold text-[#1F2937]">AI Insights</p>
            <p className="font-sans text-[10px] text-[#6B7280]">3 new recommendations ready</p>
          </div>
          <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 font-sans text-[10px] font-medium text-[#10B981]">Active</span>
        </div>
      </div>
    </div>
  );
}

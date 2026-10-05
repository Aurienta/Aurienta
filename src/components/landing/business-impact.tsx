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
  { value: "100%", label: "Ownership Protection", color: "text-[#4F46E5]" },
  { value: "24/7", label: "AI Monitoring", color: "text-[#7C3AED]" },
  { value: "< 1s", label: "System Response", color: "text-[#2563EB]" },
  { value: "99.9%", label: "Uptime Availability", color: "text-[#0891B2]" },
];

const SIDEBAR_ITEMS = ["Overview", "Governance", "Compliance", "Operations", "Analytics", "Settings"];

export function BusinessImpact() {
  return (
    <section id="business-impact" className="bg-white py-[100px] sm:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-16">
          <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
            Platform Preview
          </p>
          <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E293B] sm:text-[40px]">
            A Smarter Way to Build
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* LEFT */}
          <div>
            <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
              Built for Real Businesses
            </p>
            <h3 className="mt-2 font-sans text-[28px] font-bold text-[#1E293B]">
              Powerful Tools for<br />Real-World Impact
            </h3>
            <p className="mt-4 font-sans text-[15px] leading-relaxed text-[#64748B]">
              AURIENTA provides the constitutional infrastructure that enables real-economy
              enterprises to form, raise capital, operate, and graduate into sovereign
              independence — all under AI-enforced governance.
            </p>

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
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ECFDF5]">
                    <Check className="h-3 w-3 text-[#0D9488]" />
                  </div>
                  <span className="font-sans text-[14px] text-slate-700">{point}</span>
                </motion.div>
              ))}
            </div>

            <a href="#" className="mt-8 inline-flex items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA]">
              Explore Use Cases
              <ArrowRight className="h-4 w-4" />
            </a>

            {/* Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#E2E8F0] pt-8 sm:grid-cols-4 lg:grid-cols-2">
              {METRICS.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className={`font-sans text-[28px] font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="mt-0.5 font-sans text-[12px] text-[#64748B]">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-xl shadow-slate-200/50"
          >
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
      {/* Sidebar */}
      <div className="hidden w-48 shrink-0 bg-[#1E1B4B] p-4 sm:block">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#06B6D4]" />
          <span className="font-sans text-[14px] font-bold text-white">AURIENTA</span>
        </div>
        <nav className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item, i) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 font-sans text-[12px] ${
                i === 0 ? "bg-[#4F46E5]/20 text-[#A5B4FC]" : "text-[#94A3B8]"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-5">
        <p className="font-sans text-[14px] font-semibold text-[#1E293B]">Good morning, Alex</p>
        <p className="font-sans text-[12px] text-[#94A3B8]">EcoPack Solutions · Tier C</p>

        {/* KPI cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "$2.48M", color: "text-[#4F46E5]" },
            { label: "Active Projects", value: "8", color: "text-[#7C3AED]" },
            { label: "Equity Units", value: "12,450", color: "text-[#0891B2]" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <p className="font-sans text-[10px] text-[#94A3B8]">{kpi.label}</p>
              <p className={`mt-0.5 font-sans text-[18px] font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
          <p className="mb-2 font-sans text-[12px] font-semibold text-[#1E293B]">Business Performance</p>
          <svg viewBox="0 0 300 80" className="h-20 w-full">
            <defs>
              <linearGradient id="chartGradPreview" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#4F46E5" stopOpacity="0.3" />
                <stop offset="1" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="40" x2="300" y2="40" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" strokeWidth="1" />
            <path d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
            <path d="M0,60 Q50,50 80,40 T160,25 T240,15 T300,8 L300,80 L0,80 Z" fill="url(#chartGradPreview)" />
            <circle cx="80" cy="40" r="3" fill="#4F46E5" />
            <circle cx="160" cy="25" r="3" fill="#4F46E5" />
            <circle cx="240" cy="15" r="3" fill="#4F46E5" />
          </svg>
        </div>

        {/* AI Insights */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#EEF2FF] to-[#F3E8FF] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5]/10">
            <Zap className="h-4 w-4 text-[#4F46E5]" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-[12px] font-semibold text-[#1E293B]">AI Insights</p>
            <p className="font-sans text-[10px] text-[#64748B]">3 new recommendations ready</p>
          </div>
          <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 font-sans text-[10px] font-medium text-[#0D9488]">Active</span>
        </div>
      </div>
    </div>
  );
}

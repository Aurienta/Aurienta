"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Scale, FileCheck, Shield, Cpu, Building2, TrendingUp,
  ArrowRight, type LucideIcon
} from "lucide-react";

const MODULES: { icon: LucideIcon; title: string; desc: string; bg: string; text: string }[] = [
  { icon: Scale, title: "Governance", desc: "Constitutional voting, proposals & council", bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
  { icon: FileCheck, title: "Ownership Ledger", desc: "Immutable hash-chained equity records", bg: "bg-[#F3E8FF]", text: "text-[#7C3AED]" },
  { icon: Shield, title: "Compliance", desc: "FRA-aligned, GAFI-verified, audit-ready", bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" },
  { icon: Cpu, title: "AI Intelligence", desc: "Brain AI for feasibility, triage & insights", bg: "bg-[#ECFEFF]", text: "text-[#0891B2]" },
  { icon: Building2, title: "Business Operations", desc: "Milestones, expenses, payroll & NOSI", bg: "bg-[#ECFDF5]", text: "text-[#0D9488]" },
  { icon: TrendingUp, title: "Growth & Expansion", desc: "Secondary market, graduation & alumni", bg: "bg-[#FDF4FF]", text: "text-[#C026D3]" },
];

export function PlatformModules() {
  return (
    <section id="platform-modules" className="bg-white py-[100px] sm:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
              Platform Modules
            </p>
            <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E293B] sm:text-[40px]">
              Everything You Need in One Platform
            </h2>
            <p className="mt-3 max-w-[480px] font-sans text-[15px] text-[#64748B]">
              Six constitutional modules covering the entire enterprise lifecycle —
              from formation to graduation into sovereign independence.
            </p>
          </div>
          <a href="#platform-modules" className="hidden items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] sm:flex">
            View All Modules
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="group rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${mod.bg}`}>
                <mod.icon className={`h-6 w-6 ${mod.text}`} />
              </div>
              <h3 className="font-sans text-[14px] font-bold text-[#1E293B]">{mod.title}</h3>
              <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-[#64748B]">{mod.desc}</p>
              <a href="#" className="mt-3 inline-flex items-center gap-1 font-sans text-[12px] font-medium text-[#4F46E5] opacity-0 transition-opacity group-hover:opacity-100">
                Learn More
                <ArrowRight className="h-3 w-3" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

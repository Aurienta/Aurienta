"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Scale, FileCheck, ShieldCheck, Cpu, Building2, TrendingUp,
  ArrowRight, type LucideIcon
} from "lucide-react";

const MODULES: { icon: LucideIcon; title: string; desc: string; bg: string; iconColor: string }[] = [
  { icon: Scale, title: "Governance", desc: "Constitutional rules, AI enforcement, full transparency.", bg: "bg-[#F5F3FF]", iconColor: "text-[#6366F1]" },
  { icon: FileCheck, title: "Ownership Ledger", desc: "Immutable records, real ownership, full traceability.", bg: "bg-[#EEF2FF]", iconColor: "text-[#4F46E5]" },
  { icon: ShieldCheck, title: "Compliance", desc: "Automated checks, regulatory alignment, risk monitoring.", bg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]" },
  { icon: Cpu, title: "AI Intelligence", desc: "Decision support, pattern analysis, predictive insights.", bg: "bg-[#F3E8FF]", iconColor: "text-[#7C3AED]" },
  { icon: Building2, title: "Business Operations", desc: "Workflows, resources, team management, performance.", bg: "bg-[#ECFEFF]", iconColor: "text-[#0891B2]" },
  { icon: TrendingUp, title: "Growth & Expansion", desc: "Scaling tools, market access, investor coordination.", bg: "bg-[#FDF4FF]", iconColor: "text-[#C026D3]" },
];

export function PlatformModules() {
  return (
    <section id="platform-modules" className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4F46E5]">PLATFORM MODULES</p>
            <h2 className="mt-2 font-sans text-[32px] font-bold text-[#0F172A]">Everything You Need in One Platform</h2>
            <p className="mt-3 max-w-[480px] font-sans text-[15px] leading-[1.6] text-[#64748B]">Integrated modules work together to give you complete control, automated compliance, and intelligent insights — from company formation to expansion.</p>
          </div>
          <a href="#platform-modules" className="hidden items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] sm:flex">
            View All Modules <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MODULES.map((mod, i) => (
            <motion.div key={mod.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.07, duration: 0.5 }}
              className="group rounded-2xl border border-[#F1F5F9] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all hover:border-[#E0E7FF] hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.1)]">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${mod.bg}`}>
                <mod.icon className={`h-6 w-6 ${mod.iconColor}`} />
              </div>
              <h3 className="font-sans text-[18px] font-bold text-[#0F172A]">{mod.title}</h3>
              <p className="mt-2 font-sans text-[14px] leading-relaxed text-[#64748B]">{mod.desc}</p>
              <a href="#" className="mt-4 inline-flex items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] transition-opacity group-hover:opacity-100">
                Learn More <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

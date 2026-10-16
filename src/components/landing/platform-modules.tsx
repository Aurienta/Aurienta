"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Scale, FileCheck, ShieldCheck, Cpu, Building2, TrendingUp,
  ArrowRight, ArrowRightCircle, type LucideIcon
} from "lucide-react";

const MODULES: { icon: LucideIcon; title: string; desc: string; bg: string; iconColor: string }[] = [
  { icon: Scale, title: "Constitutional Governance (CRE)", desc: "32+ deterministic policies, AI-enforced, Ed25519-signed verdicts, hash-chained ledger.", bg: "bg-[#F5F3FF]", iconColor: "text-[#6366F1]" },
  { icon: FileCheck, title: "Immutable Ownership Ledger", desc: "Equity Units recorded permanently. Real ownership, full traceability, zero rewrites.", bg: "bg-[#EEF2FF]", iconColor: "text-[#4F46E5]" },
  { icon: ShieldCheck, title: "PDPL & AML Compliance", desc: "Automated alignment with Saudi PDPL, Egyptian AML, and global regulatory standards.", bg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]" },
  { icon: Cpu, title: "Brain AI Intelligence", desc: "Institutional decision support, pattern analysis, predictive insight — not a chatbot.", bg: "bg-[#F3E8FF]", iconColor: "text-[#7C3AED]" },
  { icon: Building2, title: "Enterprise Operations", desc: "Milestone workflows, ERP, team coordination, fund release gates — all constitutional.", bg: "bg-[#ECFEFF]", iconColor: "text-[#0891B2]" },
  { icon: TrendingUp, title: "Growth & Graduation", desc: "Fundamental pricing, secondary Enterprise Registry, sovereign graduation pathway.", bg: "bg-[#FDF4FF]", iconColor: "text-[#C026D3]" },
];

const FLOW_STEPS = [
  "Capital Partner",
  "Capital Participation",
  "Equity Units",
  "Ownership Ledger",
  "Milestone Release",
  "Fundamental Pricing",
  "Graduation",
];

export function PlatformModules() {
  return (
    <section id="platform-modules" className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4F46E5]">PLATFORM MODULES</p>
            <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E1B4B]">One Constitutional Infrastructure</h2>
            <p className="mt-3 max-w-[480px] font-sans text-[15px] leading-[1.6] text-[#64748B]">
              Integrated modules work together to give Founding Operators, Capital Partners, and institutional actors
              complete control — from enterprise constitution to graduation.
            </p>
          </div>
          <a href="#tier-system" className="hidden items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] sm:flex">
            View the Tier System <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* How it flows banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-5"
        >
          <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4F46E5]">
            How Capital Flows
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <span className="inline-flex items-center rounded-md bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-[#1E1B4B] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-inset ring-[#E0E7FF]">
                  {step}
                </span>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRightCircle className="h-4 w-4 shrink-0 text-[#A5B4FC]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MODULES.map((mod, i) => (
            <motion.div key={mod.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.07, duration: 0.5 }}
              className="group rounded-2xl border border-[#F1F5F9] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all hover:border-[#E0E7FF] hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.1)]">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${mod.bg}`}>
                <mod.icon className={`h-6 w-6 ${mod.iconColor}`} />
              </div>
              <h3 className="font-sans text-[16px] font-bold leading-tight text-[#1E1B4B]">{mod.title}</h3>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#64748B]">{mod.desc}</p>
              <a href="#" className="mt-4 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-[#4F46E5] transition-opacity group-hover:opacity-100">
                Learn More <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

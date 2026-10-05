"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UserPlus, FileText, Wallet, Hammer, TrendingUp, Crown, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; desc: string; bg: string }[] = [
  { icon: UserPlus, title: "Register", desc: "Create your constitutional identity with Ed25519 anchor", bg: "bg-[#4F46E5]" },
  { icon: FileText, title: "Structure", desc: "Constitute your enterprise with CRE-validated rules", bg: "bg-[#7C3AED]" },
  { icon: Wallet, title: "Fund", desc: "Raise capital via law firm escrow — zero custody", bg: "bg-[#9333EA]" },
  { icon: Hammer, title: "Build", desc: "Execute milestones with AI-enforced governance", bg: "bg-[#2563EB]" },
  { icon: TrendingUp, title: "Grow", desc: "Scale operations with constitutional protection", bg: "bg-[#0891B2]" },
  { icon: Crown, title: "Own", desc: "Graduate into sovereign independence", bg: "bg-[#0D9488]" },
];

export function ProcessLifecycle() {
  return (
    <section className="bg-gradient-to-b from-white to-[#F8FAFC] py-[100px] sm:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
            The AURIENTA Process
          </p>
          <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E293B] sm:text-[40px]">
            From Capital to Ownership — In Six Steps
          </h2>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden items-start justify-between lg:flex">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex w-[15%] flex-col items-center text-center"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} shadow-lg shadow-slate-200/50`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <p className="mt-2 font-sans text-[11px] font-bold text-[#94A3B8]">0{i + 1}</p>
                <h3 className="mt-0.5 font-sans text-[14px] font-bold text-[#1E293B]">{step.title}</h3>
                <p className="mt-1 font-sans text-[11px] leading-tight text-[#64748B]">{step.desc}</p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="mt-7 flex flex-1 items-center px-2">
                  <div className="h-[2px] w-full bg-[#E2E8F0]" />
                  <svg className="h-3 w-3 -ml-1.5 text-[#CBD5E1]" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M4 2l4 4-4 4V2z" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="flex flex-col gap-6 lg:hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="flex items-start gap-4"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${step.bg} shadow-lg`}>
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[11px] font-bold text-[#94A3B8]">0{i + 1}</span>
                  <h3 className="font-sans text-[14px] font-bold text-[#1E293B]">{step.title}</h3>
                </div>
                <p className="mt-1 font-sans text-[12px] text-[#64748B]">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

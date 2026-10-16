"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UserPlus, FileText, Wallet, Hammer, TrendingUp, Crown, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; subtitle: string; desc: string }[] = [
  {
    icon: UserPlus,
    title: "Constitute Enterprise",
    subtitle: "Register as Founding Operator",
    desc: "Create your Constitutional Workspace. Pass identity verification and accept the Constitutional Charter.",
  },
  {
    icon: FileText,
    title: "Tier Classification",
    subtitle: "A–F tier assignment",
    desc: "The CRE assigns one of six tiers — defining legal form, capital limits, governance, and audit standards.",
  },
  {
    icon: Wallet,
    title: "Capital Formation",
    subtitle: "Capital Partners participate from 50 EGP",
    desc: "Capital flows directly to the Law Firm Client Account. Equity Units are issued on the immutable Ownership Ledger.",
  },
  {
    icon: Hammer,
    title: "Milestone Execution",
    subtitle: "CRE-enforced fund release",
    desc: "Capital releases only against verified milestones. 32+ deterministic policies, Ed25519-signed verdicts.",
  },
  {
    icon: TrendingUp,
    title: "Fundamental Pricing",
    subtitle: "Secondary Enterprise Registry",
    desc: "Valuation from EPS × sector P/E × growth + 0.3×NAV. ±5% band. No speculation, no derivatives.",
  },
  {
    icon: Crown,
    title: "Graduation",
    subtitle: "Enterprise becomes sovereign",
    desc: "AURIENTA succeeds when enterprises no longer need it. Graduation — not exit, not IPO.",
  },
];

export function ProcessLifecycle() {
  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4F46E5]">THE CONSTITUTIONAL LIFECYCLE</p>
          <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E1B4B]">From Constitution to Graduation — In Six Steps</h2>
          <p className="mx-auto mt-4 max-w-[640px] font-sans text-[15px] leading-[1.6] text-[#64748B]">
            Every enterprise traverses the same constitutional pathway — from the moment a Founding Operator registers to
            the moment the enterprise becomes sovereign.
          </p>
        </div>
        <div className="hidden items-start justify-between lg:flex">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex w-[15%] flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF]">
                  <step.icon className="h-6 w-6 text-[#4F46E5]" />
                </div>
                <p className="mt-2 font-sans text-[12px] font-bold text-[#94A3B8]">0{i + 1}</p>
                <h3 className="mt-0.5 font-sans text-[16px] font-bold text-[#1E1B4B]">{step.title}</h3>
                <p className="mt-0.5 font-sans text-[12px] font-semibold text-[#6D28D9]">{step.subtitle}</p>
                <p className="mt-1.5 font-sans text-[13px] leading-tight text-[#64748B]">{step.desc}</p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="mt-7 flex flex-1 items-center px-2">
                  <div className="h-[2px] w-full bg-[#CBD5E1]" />
                  <svg className="h-3 w-3 -ml-1.5 text-[#CBD5E1]" viewBox="0 0 12 12" fill="currentColor"><path d="M4 2l4 4-4 4V2z" /></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:hidden">
          {STEPS.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF]">
                <step.icon className="h-5 w-5 text-[#4F46E5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[12px] font-bold text-[#94A3B8]">0{i + 1}</span>
                  <h3 className="font-sans text-[16px] font-bold text-[#1E1B4B]">{step.title}</h3>
                </div>
                <p className="font-sans text-[12px] font-semibold text-[#6D28D9]">{step.subtitle}</p>
                <p className="mt-1 font-sans text-[13px] leading-tight text-[#64748B]">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

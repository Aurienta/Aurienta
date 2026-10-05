"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UserPlus, FileText, Wallet, Hammer, TrendingUp, Crown, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: UserPlus, title: "Register", desc: "Create your constitutional identity with Ed25519 anchor", color: "bg-indigo-500" },
  { icon: FileText, title: "Structure", desc: "Constitute your enterprise with CRE-validated rules", color: "bg-violet-500" },
  { icon: Wallet, title: "Fund", desc: "Raise capital via law firm escrow — zero custody", color: "bg-purple-500" },
  { icon: Hammer, title: "Build", desc: "Execute milestones with AI-enforced governance", color: "bg-blue-500" },
  { icon: TrendingUp, title: "Grow", desc: "Scale operations with constitutional protection", color: "bg-cyan-500" },
  { icon: Crown, title: "Own", desc: "Graduate into sovereign independence", color: "bg-teal-500" },
];

export function ProcessLifecycle() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
            The AURIENTA Process
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold text-slate-900 sm:text-4xl">
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
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex w-[15%] flex-col items-center text-center"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} shadow-lg`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <p className="mt-1 font-sans text-xs font-bold text-slate-400">0{i + 1}</p>
                <h3 className="mt-1 font-sans text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 font-sans text-xs text-slate-500">{step.desc}</p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="mt-8 flex flex-1 items-center px-2">
                  <div className="h-px w-full bg-gradient-to-r from-slate-200 to-slate-200" />
                  <svg className="h-4 w-4 -ml-2 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 5l6 5-6 5V5z" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="flex flex-col gap-6 lg:hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-start gap-4"
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.color} shadow-lg`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-bold text-slate-400">0{i + 1}</span>
                  <h3 className="font-sans text-sm font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="mt-1 font-sans text-xs text-slate-500">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

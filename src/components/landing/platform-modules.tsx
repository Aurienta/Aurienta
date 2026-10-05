"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Scale, FileCheck, Shield, Cpu, Building2, TrendingUp,
  ArrowRight, type LucideIcon
} from "lucide-react";

const MODULES: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: Scale, title: "Governance", desc: "Constitutional voting, proposals & council", color: "from-indigo-50 to-violet-50 text-indigo-600" },
  { icon: FileCheck, title: "Ownership Ledger", desc: "Immutable hash-chained equity records", color: "from-violet-50 to-purple-50 text-violet-600" },
  { icon: Shield, title: "Compliance", desc: "FRA-aligned, GAFI-verified, audit-ready", color: "from-blue-50 to-cyan-50 text-blue-600" },
  { icon: Cpu, title: "AI Intelligence", desc: "Brain AI for feasibility, triage & insights", color: "from-cyan-50 to-teal-50 text-cyan-600" },
  { icon: Building2, title: "Business Operations", desc: "Milestones, expenses, payroll & NOSI", color: "from-teal-50 to-emerald-50 text-teal-600" },
  { icon: TrendingUp, title: "Growth & Expansion", desc: "Secondary market, graduation & alumni", color: "from-emerald-50 to-green-50 text-emerald-600" },
];

export function PlatformModules() {
  return (
    <section id="platform-modules" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
              Platform Modules
            </p>
            <h2 className="mt-2 font-sans text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything You Need in One Platform
            </h2>
            <p className="mt-3 max-w-xl font-sans text-sm text-slate-500">
              Six constitutional modules covering the entire enterprise lifecycle —
              from formation to graduation into sovereign independence.
            </p>
          </div>
          <a href="/#modules" className="hidden items-center gap-1 font-sans text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:flex">
            View All Modules
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-900">{mod.title}</h3>
              <p className="mt-1 font-sans text-xs leading-relaxed text-slate-500">{mod.desc}</p>
              <a href="#" className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-medium text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
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

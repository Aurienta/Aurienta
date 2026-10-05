"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield, FileCheck, Lock, KeyRound, Eye, Server, ArrowRight, type LucideIcon
} from "lucide-react";

const SECURITY_ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Shield, title: "Immutable Ledger", desc: "Blockchain-backed records" },
  { icon: FileCheck, title: "Regulatory Compliance", desc: "Global standards alignment" },
  { icon: Lock, title: "Data Protection", desc: "End-to-end encryption" },
  { icon: KeyRound, title: "Identity & Access", desc: "Zero trust architecture" },
  { icon: Eye, title: "Audit & Transparency", desc: "Full activity logs" },
  { icon: Server, title: "Infrastructure", desc: "Resilient & scalable" },
];

export function SecurityTrust() {
  return (
    <section id="security" className="bg-[#FAFAFA] py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* LEFT — text + CTA */}
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6366F1]">TRUSTED &amp; SECURE</p>
            <h2 className="mt-2 font-sans text-[32px] font-bold leading-[1.2] text-[#1E1B4B]">Enterprise-Grade Security and Constitutional Governance</h2>
            <p className="mt-4 font-sans text-[16px] leading-[1.6] text-[#6B7280]">Your data, your business, your rules. Built with the highest standards of security, compliance and transparency.</p>
            <button className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 font-sans text-[14px] font-semibold text-[#4F46E5] shadow-sm transition-all hover:border-[#CBD5E1] hover:bg-slate-50">
              Learn About Security <ArrowRight className="h-4 w-4" />
            </button>

            {/* Dark callout */}
            <div className="mt-8 rounded-2xl bg-[#1E1B4B] p-6">
              <h3 className="font-sans text-[20px] font-bold text-white">Trusted by businesses.<br />Built for the future.</h3>
              <p className="mt-3 font-sans text-[14px] leading-[1.6] text-indigo-200">AURIENTA is the constitutional infrastructure for a transparent, more transparent global economy.</p>
              <a href="/register" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-5 py-2.5 font-sans text-[13px] font-semibold text-white transition-all hover:bg-[#4F46E5]">
                Get Started <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* RIGHT — feature grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.07, duration: 0.5 }}
                className="rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF]">
                  <item.icon className="h-6 w-6 text-[#6366F1]" />
                </div>
                <h3 className="font-sans text-[14px] font-semibold text-[#1F2937]">{item.title}</h3>
                <p className="mt-1 font-sans text-[13px] text-[#6B7280]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

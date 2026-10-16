"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield, FileCheck, Lock, KeyRound, Eye, Server, ArrowRight, Check, type LucideIcon
} from "lucide-react";

const SECURITY_ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Shield, title: "Immutable Ledger", desc: "Hash-chained records. Ed25519-signed verdicts. Tamper-evident by construction." },
  { icon: FileCheck, title: "Regulatory Compliance", desc: "PDPL, AML, FRA — global standards alignment, automated." },
  { icon: Lock, title: "Data Protection", desc: "End-to-end encryption. Field-level encryption for sensitive data." },
  { icon: KeyRound, title: "Identity & Access", desc: "Passkey / WebAuthn authentication. Zero-trust architecture." },
  { icon: Eye, title: "Audit & Transparency", desc: "Full activity logs. Public CRE decision log. Verifiable history." },
  { icon: Server, title: "Infrastructure", desc: "Resilient, scalable, fault-tolerant constitutional runtime." },
];

const ZERO_CUSTODY_POINTS = [
  "AURIENTA never holds, touches, or controls partner funds.",
  "Capital flows directly to the licensed law firm's Law Firm Client Account.",
  "Milestone-based release — no platform custody, ever.",
  "Codified in Constitutional Amendment IX.",
];

export function SecurityTrust() {
  return (
    <section id="security" className="bg-[#FAFAFA] py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* LEFT — Zero Custody callout + text + CTA */}
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.05em] text-[#4F46E5]">TRUSTED &amp; SECURE</p>
            <h2 className="mt-2 font-sans text-[32px] font-bold leading-[1.2] text-[#1E1B4B]">
              Zero Custody is the Constitutional Differentiator
            </h2>
            <p className="mt-4 font-sans text-[16px] leading-[1.6] text-[#6B7280]">
              No competitor matches all four constitutional pillars. The most fundamental — Zero Custody — means AURIENTA
              structurally cannot misappropriate partner funds. Trust is not promised. It is architecturally enforced.
            </p>

            {/* Zero Custody highlight panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="mt-6 rounded-2xl border border-[#E0E7FF] bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF]">
                  <Shield className="h-6 w-6 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4F46E5]">
                    Pillar 1 of 4
                  </p>
                  <h3 className="font-sans text-[18px] font-bold text-[#1E1B4B]">Zero Custody</h3>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {ZERO_CUSTODY_POINTS.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-2.5"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                    <span className="font-sans text-[14px] leading-tight text-[#374151]">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <button className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 font-sans text-[14px] font-semibold text-[#4F46E5] shadow-sm transition-all hover:border-[#CBD5E1] hover:bg-slate-50">
              Learn About Security <ArrowRight className="h-4 w-4" />
            </button>

            {/* Dark institutional callout */}
            <div className="mt-8 rounded-2xl bg-[#1E1B4B] p-6">
              <h3 className="font-sans text-[20px] font-bold text-white">Built for institutional capital.<br />Governed by constitutional rules.</h3>
              <p className="mt-3 font-sans text-[14px] leading-[1.6] text-indigo-200">AURIENTA is the noncustodial infrastructure of structural trust — comparable in voice to the World Bank, OECD, and BIS, not a software vendor.</p>
              <a href="/register" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-5 py-2.5 font-sans text-[13px] font-semibold text-white transition-all hover:bg-[#4338CA]">
                Get Started <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* RIGHT — capability grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.07, duration: 0.5 }}
                className="rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF]">
                  <item.icon className="h-6 w-6 text-[#4F46E5]" />
                </div>
                <h3 className="font-sans text-[14px] font-semibold text-[#1E1B4B]">{item.title}</h3>
                <p className="mt-1 font-sans text-[13px] leading-tight text-[#6B7280]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

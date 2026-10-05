"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield, FileCheck, Lock, KeyRound, Eye, Server, ArrowRight, type LucideIcon
} from "lucide-react";

const SECURITY_ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Shield, title: "Immutable Ledger", desc: "Hash-chained ownership records that cannot be tampered with" },
  { icon: FileCheck, title: "Regulatory Compliance", desc: "FRA no-action, GAFI-verified, NOSI-integrated" },
  { icon: Lock, title: "Data Protection", desc: "PDPL-compliant, AES-256-GCM field encryption" },
  { icon: KeyRound, title: "Identity & Access", desc: "Ed25519 anchors, MFA enforcement, role-based access" },
  { icon: Eye, title: "Audit & Transparency", desc: "Every action recorded, every decision verifiable" },
  { icon: Server, title: "Infrastructure", desc: "HSM-backed keys, zero-custody escrow, Oracle Mirror" },
];

export function SecurityTrust() {
  return (
    <section id="security" className="bg-[#F8FAFC] py-[100px] sm:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12">
          <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
            Trusted &amp; Secure
          </p>
          <h2 className="mt-2 font-sans text-[32px] font-bold text-[#1E293B] sm:text-[40px]">
            Enterprise-Grade Security<br />and Constitutional Governance
          </h2>
          <p className="mt-4 max-w-[640px] font-sans text-[15px] text-[#64748B]">
            AURIENTA&apos;s structural trust is not a marketing claim — it&apos;s
            cryptographically enforced. Every fund flow, every governance decision,
            and every ownership transfer is protected by institutional-grade security.
          </p>
          <a href="#" className="mt-4 inline-flex items-center gap-1 font-sans text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA]">
            Learn About Security
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF]">
                <item.icon className="h-6 w-6 text-[#4F46E5]" />
              </div>
              <h3 className="font-sans text-[14px] font-bold text-[#1E293B]">{item.title}</h3>
              <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-[#64748B]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

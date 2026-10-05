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
    <section id="security" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
            Trusted &amp; Secure
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold text-slate-900 sm:text-4xl">
            Enterprise-Grade Security<br />and Constitutional Governance
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-sm text-slate-500">
            AURIENTA&apos;s structural trust is not a marketing claim — it&apos;s
            cryptographically enforced. Every fund flow, every governance decision,
            and every ownership transfer is protected by institutional-grade security.
          </p>
          <a href="#" className="mt-4 inline-flex items-center gap-1 font-sans text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Learn About Security
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50">
                <item.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 font-sans text-xs leading-relaxed text-slate-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { Reveal, StaggerGroup, staggerItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { motion } from "framer-motion";
import { Landmark, FileCheck2, ShieldCheck, Scale, Building2, Users, Cpu, Brain, ScanFace } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const REGULATORY = [
  { icon: Landmark, title: "FRA", body: "No-action letter — classified as technology, governance & matchmaking infrastructure, not crowdfunding." },
  { icon: Building2, title: "GAFI", body: "Commercial register, UBO disclosure, and incentive data verified via live API integration." },
  { icon: Users, title: "NOSI", body: "Social insurance registration enforced within 30 days of hire; non-compliance freezes expenses at 60 days." },
  { icon: ShieldCheck, title: "Police Clearance", body: "Every manager verified against the Ministry of Interior; law-firm attestation stored on the immutable ledger." },
  { icon: FileCheck2, title: "Companies Law 159/1981", body: "Art. 118 manager removal via General Assembly; Art. 108 pre-emptive rights; Art. 83 daily Constitutional Partner register." },
  { icon: Scale, title: "AML & Data Protection", body: "AML Law 80/2002 UBO disclosure; Data Protection Law 151/2020; CRCICA binding arbitration." },
];

const AI = [
  { name: "Gemma 2 27B", role: "Valuation & growth analysis" },
  { name: "Mixtral 8x22B", role: "Governance risk & sanity check" },
  { name: "Llama 3.2 70B", role: "Fraud detection & salary engine" },
  { name: "TrOCR", role: "National ID extraction" },
  { name: "IBM DFDC", role: "Deepfake & liveness detection" },
  { name: "facenet", role: "Biometric face matching" },
  { name: "LayoutLMv3", role: "Invoice & receipt verification" },
  { name: "EVE", role: "Execution verification engine" },
];

export function Compliance() {
  const { t } = useLanguage();
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t("compliance.title")}
          title={
            <>
              Regulator-aligned by design,
              <span className="text-gold-gradient"> not by retrofit.</span>
            </>
          }
          description="AURIENTA interfaces directly with Egyptian authorities — the FRA holds a read-only Regulatory Shadow Mode dashboard with no PII and no execution ability."
        />

        <StaggerGroup className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGULATORY.map((r) => (
            <motion.div
              key={r.title}
              variants={staggerItem}
              className="group flex gap-4 rounded-2xl glass p-6 transition-all duration-500 hover:border-gold/30"
            >
              <div className="shrink-0">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                  <r.icon className="h-5 w-5 text-gold" />
                </div>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">{r.title}</h3>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-gold/12 bg-gradient-to-br from-background to-[#0c0c10] p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-gold" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
                The Constitutional AI Stack
              </span>
            </div>
            <h3 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">
              AI as Enforcer, Not Decider
            </h3>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground">
              Multiple specialised models validate, verify, and guard every action — with a
              human-in-the-loop for high-risk decisions and an independent oversight agent that
              watches for hallucination, bias, and drift.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {AI.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-3 rounded-xl border border-gold/10 bg-background/40 px-4 py-3"
                >
                  <Cpu className="h-4 w-4 shrink-0 text-gold/70" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-medium text-foreground">{a.name}</p>
                    <p className="truncate font-sans text-[11px] text-muted-foreground">{a.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gold/10 pt-6">
              {[
                "Hallucination < 1%",
                "Bias disparity < 20%",
                "Drift KL > 0.1 → alert",
                "Drift KL > 0.2 → auto-rollback",
                "Human-in-loop on > 85% fraud",
              ].map((m) => (
                <span key={m} className="inline-flex items-center gap-2 font-mono text-[11px] text-gold/70">
                  <ScanFace className="h-3.5 w-3.5" />
                  {m}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

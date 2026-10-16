"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Shield, Check, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tier = {
  letter: string;
  name: string;
  legalForm: string;
  maxCapitalFormation: string;
  minParticipation: string;
  founderEquity: string;
  fee: string;
  erp: string;
  audit: string;
  targetFounder: string;
  // Colors
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
};

const TIERS: Tier[] = [
  {
    letter: "A",
    name: "Micro",
    legalForm: "LLC",
    maxCapitalFormation: "3M EGP",
    minParticipation: "50 EGP",
    founderEquity: "5% + 5%",
    fee: "5% + 2.5%",
    erp: "Lite",
    audit: "Compilation",
    targetFounder: "First-time Founding Operators (22-year-old student)",
    badgeBg: "bg-[#4F46E5]",
    badgeText: "text-white",
    accentBorder: "border-[#E0E7FF]",
    accentBg: "bg-[#EEF2FF]",
    accentText: "text-[#4F46E5]",
  },
  {
    letter: "B",
    name: "Small",
    legalForm: "LLC",
    maxCapitalFormation: "25M EGP",
    minParticipation: "50 EGP",
    founderEquity: "5% + 5%",
    fee: "5% + 2.5%",
    erp: "Optional",
    audit: "Review",
    targetFounder: "Experienced operators",
    badgeBg: "bg-[#7C3AED]",
    badgeText: "text-white",
    accentBorder: "border-[#EDE9FE]",
    accentBg: "bg-[#F5F3FF]",
    accentText: "text-[#7C3AED]",
  },
  {
    letter: "C",
    name: "Growth",
    legalForm: "LLC",
    maxCapitalFormation: "Unlimited",
    minParticipation: "50 EGP",
    founderEquity: "10% + 25% vest",
    fee: "5% + 2.5%",
    erp: "Mandatory",
    audit: "Statutory",
    targetFounder: "ERP-ready scaling enterprises",
    badgeBg: "bg-[#0D9488]",
    badgeText: "text-white",
    accentBorder: "border-[#CCFBF1]",
    accentBg: "bg-[#F0FDFA]",
    accentText: "text-[#0D9488]",
  },
  {
    letter: "D",
    name: "Established",
    legalForm: "LLC",
    maxCapitalFormation: "Unlimited",
    minParticipation: "50,000 EGP",
    founderEquity: "Owner ≥ 51%",
    fee: "5% + 2.5%",
    erp: "Mandatory",
    audit: "Statutory",
    targetFounder: "Existing companies onboarding",
    badgeBg: "bg-[#D97706]",
    badgeText: "text-white",
    accentBorder: "border-[#FEF3C7]",
    accentBg: "bg-[#FFFBEB]",
    accentText: "text-[#D97706]",
  },
  {
    letter: "E",
    name: "University",
    legalForm: "SPV",
    maxCapitalFormation: "5M EGP",
    minParticipation: "50 EGP",
    founderEquity: "0%",
    fee: "1%",
    erp: "—",
    audit: "Grant",
    targetFounder: "Research spinouts from universities",
    badgeBg: "bg-[#0891B2]",
    badgeText: "text-white",
    accentBorder: "border-[#CFFAFE]",
    accentBg: "bg-[#ECFEFF]",
    accentText: "text-[#0891B2]",
  },
  {
    letter: "F",
    name: "Joint Stock",
    legalForm: "JSC",
    maxCapitalFormation: "Unlimited",
    minParticipation: "1 share",
    founderEquity: "By bylaws",
    fee: "5% + 2.5%",
    erp: "Mandatory",
    audit: "FRA statutory",
    targetFounder: "EGX-listed public enterprises",
    badgeBg: "bg-[#1E1B4B]",
    badgeText: "text-white",
    accentBorder: "border-[#E0E7FF]",
    accentBg: "bg-[#F8FAFC]",
    accentText: "text-[#1E1B4B]",
  },
];

function SpecRow({ label, value, accentText }: { label: string; value: string; accentText: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] py-2 last:border-b-0">
      <span className="font-sans text-[12px] uppercase tracking-wider text-[#94A3B8]">{label}</span>
      <span className={`font-sans text-[13px] font-semibold text-right ${accentText}`}>{value}</span>
    </div>
  );
}

export function TierSystem() {
  return (
    <section id="tier-system" className="bg-[#F8FAFC] py-[100px]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4F46E5]">
            THE MAIN MODEL
          </p>
          <h2 className="mt-2 font-sans text-[32px] font-bold leading-[1.2] text-[#1E1B4B] sm:text-[40px]">
            The Constitutional Tier System
          </h2>
          <p className="mx-auto mt-4 max-w-[720px] font-sans text-[16px] leading-[1.6] text-[#475569]">
            Every enterprise is classified into one of six tiers — from first-time Founding Operators to publicly listed
            companies. Each tier defines legal form, capital limits, governance requirements, and audit standards.
          </p>
        </div>

        {/* Tier cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.letter}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <Card className={`h-full rounded-2xl border ${tier.accentBorder} bg-white p-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_12px_36px_-12px_rgba(79,70,229,0.18)]`}>
                {/* Header — tier letter + name + legal form */}
                <div className={`flex items-center justify-between gap-3 rounded-t-2xl ${tier.accentBg} px-5 py-4`}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl font-sans text-[22px] font-bold ${tier.badgeBg} ${tier.badgeText} shadow-sm`}
                    >
                      {tier.letter}
                    </span>
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Tier {tier.letter}
                      </p>
                      <h3 className="font-sans text-[20px] font-bold text-[#1E1B4B]">{tier.name}</h3>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#CBD5E1] bg-white px-2 py-1 font-sans text-[11px] font-semibold text-[#475569]">
                    {tier.legalForm}
                  </Badge>
                </div>

                {/* Specs */}
                <CardContent className="px-5 py-4">
                  <SpecRow label="Max Formation" value={tier.maxCapitalFormation} accentText={tier.accentText} />
                  <SpecRow label="Min Participation" value={tier.minParticipation} accentText={tier.accentText} />
                  <SpecRow label="Founding Operator Equity" value={tier.founderEquity} accentText={tier.accentText} />
                  <SpecRow label="Platform + Consulting Fee" value={tier.fee} accentText={tier.accentText} />
                  <SpecRow label="ERP Requirement" value={tier.erp} accentText={tier.accentText} />
                  <SpecRow label="Audit Standard" value={tier.audit} accentText={tier.accentText} />

                  {/* Target founder */}
                  <div className="mt-3 rounded-lg bg-[#F8FAFC] px-3 py-2.5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Target Founding Operator
                    </p>
                    <p className="mt-0.5 font-sans text-[13px] font-medium leading-tight text-[#1E1B4B]">
                      {tier.targetFounder}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Zero Custody note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-[#E0E7FF] bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF]">
              <Shield className="h-5 w-5 text-[#4F46E5]" />
            </div>
            <div>
              <p className="font-sans text-[15px] font-bold text-[#1E1B4B]">
                All tiers preserve Zero Custody
              </p>
              <p className="mt-1 font-sans text-[14px] leading-[1.5] text-[#475569]">
                AURIENTA never holds Capital Partner or enterprise funds. Capital flows directly to the licensed law
                firm&rsquo;s Law Firm Client Account (Amendment IX). All platform fees are flat (5% + 2.5%) — never a
                percentage of capital formed.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#ECFDF5] px-4 py-2.5">
            <Check className="h-4 w-4 text-[#10B981]" />
            <span className="font-sans text-[13px] font-semibold text-[#047857]">Flat fees only</span>
          </div>
        </motion.div>

        {/* Graduation path */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#1E1B4B] p-6"
        >
          <GraduationCap className="h-5 w-5 text-[#A5B4FC]" />
          <span className="font-sans text-[13px] font-semibold uppercase tracking-wider text-indigo-200">
            Graduation path
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {TIERS.map((tier, i) => (
              <React.Fragment key={tier.letter}>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${tier.badgeBg} font-sans text-[14px] font-bold ${tier.badgeText}`}
                >
                  {tier.letter}
                </span>
                {i < TIERS.length - 1 && (
                  <span className="font-sans text-[12px] font-bold text-indigo-300">→</span>
                )}
              </React.Fragment>
            ))}
            <span className="ml-2 font-sans text-[13px] font-medium text-indigo-100">
              Sovereign Independence
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

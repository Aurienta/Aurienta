"use client";

import { Reveal, StaggerGroup, staggerItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { motion } from "framer-motion";
import { Lock, Cpu, LineChart, Landmark, Eye } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const PILLARS = [
  {
    n: "01",
    icon: Lock,
    titleKey: "pillars.moneyProtection",
    body: "AURIENTA never holds, touches, or controls partner funds. Capital flows directly from a partner's bank account to a licensed law firm's Law Firm Client Account. AURIENTA only orchestrates metadata.",
    detail: "Non-amendable Rule I 1.1",
  },
  {
    n: "02",
    icon: Cpu,
    titleKey: "pillars.governanceIntegrity",
    body: "The Constitutional Runtime Engine validates every state transition against Rego policies — deterministic, fail-secure. If consensus cannot be reached within 500ms, the action is rejected by default. Silence is denial.",
    detail: "CRE · 3-node Raft consensus",
  },
  {
    n: "03",
    icon: LineChart,
    titleKey: "pillars.fairness",
    body: "Valuation is derived exclusively from fundamental financial metrics, sector benchmarks, and AI-forecasted growth — never from speculation or momentum. A ±5% constitutional price band governs the Enterprise Registry.",
    detail: "JOZOUR v3 · 7-step engine",
  },
  {
    n: "04",
    icon: Landmark,
    titleKey: "pillars.legalCompliance",
    body: "AURIENTA is classified as technology, governance, and matchmaking infrastructure — not crowdfunding. An FRA no-action letter has been obtained. An Egyptian LLC under Companies Law 159/1981.",
    detail: "FRA no-action letter",
  },
  {
    n: "05",
    icon: Eye,
    titleKey: "pillars.transparency",
    body: "No hidden spending. Every financial event is visible to all Constitutional Partners in real time. One Equity Unit carries one vote. No super-voting Equity Units, no Founding Operator vetoes, no undisclosed discussions influencing governance.",
    detail: "Non-amendable Rule I 1.10",
  },
] as const;

export function Pillars() {
  const { t } = useLanguage();
  return (
    <section id="pillars" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Five Pillars"
          title={
            <>
              Trust is not requested.
              <br />
              <span className="text-gold-gradient">Trust is operationally designed.</span>
            </>
          }
          description="Five non-negotiable doctrines compose the structural trust that makes everyday capital safe enough to become real-economy corporate ownership."
        />

        <StaggerGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <motion.div
              key={p.n}
              variants={staggerItem}
              className="group relative flex flex-col overflow-hidden rounded-2xl glass p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/30"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 transition-colors group-hover:bg-gold/10">
                  <p.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="font-serif text-2xl font-semibold text-gold/30">{p.n}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl font-semibold leading-tight">{t(p.titleKey)}</h3>
              <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
              <span className="mt-5 inline-block font-mono text-xs uppercase tracking-wider text-gold/60">
                {p.detail}
              </span>
            </motion.div>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-4 rounded-2xl border border-gold/10 bg-gradient-to-br from-gold/[0.04] to-transparent p-8 sm:grid-cols-5 sm:gap-2 sm:p-10">
            <div className="sm:col-span-2">
              <h3 className="font-serif text-2xl font-semibold">Participate in Yourself</h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                The constitutional productivity doctrine — five layers of participation.
              </p>
            </div>
            <div className="grid gap-3 sm:col-span-3 sm:grid-cols-2">
              {[
                "Productive Capital",
                "Governance",
                "Workforce Capitalization",
                "Identity & Trust Continuity",
                "Sovereign Independence",
              ].map((l, i) => (
                <div
                  key={l}
                  className={`flex items-center gap-2.5 rounded-xl border border-gold/10 bg-background/40 px-4 py-3 ${
                    i === 4 ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="font-mono text-xs text-gold/70">0{i + 1}</span>
                  <span className="font-sans text-sm text-foreground/90">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

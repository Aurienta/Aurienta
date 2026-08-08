"use client";

import { motion } from "framer-motion";
import { Lock, Cpu, ShieldCheck, Star } from "lucide-react";
import {
  AurientaMark,
  AurientaWordmark,
  GoldStar,
} from "@/components/aurienta-logo";

const PILLARS = [
  {
    icon: Lock,
    title: "Zero Custody",
    body: "AURIENTA never holds, touches, or controls partner funds. The Law Firm Client Account sits with a licensed law firm.",
  },
  {
    icon: Cpu,
    title: "AI-Enforced Governance",
    body: "Rego policy-as-code validates every state transition; HSM-signed decision tokens are immutable.",
  },
  {
    icon: ShieldCheck,
    title: "FRA No-Action Letter",
    body: "Egyptian Financial Regulatory Authority cleared AURIENTA's noncustodial framework for operation.",
  },
];

/**
 * Luxury brand panel used on the left of the sign-in split-screen.
 * Hidden below the `lg` breakpoint (a compact header is shown instead).
 */
export function AuthBrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden w-1/2 overflow-hidden bg-[#08080a] lg:flex lg:flex-col"
    >
      {/* Ornaments */}
      <div className="absolute inset-0 aurienta-radial" />
      <div className="absolute inset-0 aurienta-grid opacity-50" />
      <div className="aurienta-noise absolute inset-0 opacity-[0.06] mix-blend-soft-light" />

      {/* Floating gold orbs */}
      <motion.div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)",
        }}
        animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
        transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 -left-16 h-80 w-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,134,11,0.16) 0%, transparent 70%)",
        }}
        animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
        transition={{ duration: 13, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-12 py-14 xl:px-16 xl:py-20">
        {/* Mark + wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-4">
            <AurientaMark className="h-14 w-14 xl:h-16 xl:w-16" withGlow />
            <div className="flex flex-col">
              <AurientaWordmark className="text-2xl xl:text-3xl" />
              <span className="mt-1.5 font-sans text-[11px] uppercase tracking-tagline text-muted-foreground">
                Constitutional Enterprise Infrastructure
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/60" />
            <span className="font-sans text-xs uppercase tracking-[0.32em] text-gold/70">
              Sovereign Sign-In
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/10" />
          </div>
        </motion.div>

        {/* Founding principle */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md"
        >
          <Star className="mb-5 h-5 w-5 text-gold/80" />
          <p className="font-serif text-2xl leading-snug text-foreground/90 xl:text-[1.7rem]">
            “Your capital, your work, your company —{" "}
            <span className="text-gold-gradient font-medium">no speculation required.</span>”
          </p>
          <p className="mt-5 font-sans text-sm leading-relaxed text-muted-foreground">
            Noncustodial constitutional infrastructure of structural trust.
            Every sign-in is anchored to your Ed25519 Identity Anchor — verified
            cryptographically, never custodied.
          </p>
        </motion.div>

        {/* Pillars */}
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.32 } },
          }}
          className="flex flex-col gap-3"
        >
          {PILLARS.map((p) => (
            <motion.li
              key={p.title}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="glass-gold flex items-start gap-3.5 rounded-xl px-4 py-3"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/25">
                <p.icon className="h-4 w-4 text-gold-light" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-sm font-semibold text-foreground">
                  {p.title}
                </span>
                <span className="font-sans text-xs leading-relaxed text-muted-foreground">
                  {p.body}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        {/* Anchored hash microcopy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground/80"
        >
          <GoldStar className="h-2.5 w-2.5" />
          <span>Anchored to the Stellar blockchain · event constitutional_genesis</span>
        </motion.div>
      </div>
    </aside>
  );
}

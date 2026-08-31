"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { GoldStar } from "@/components/aurienta-logo";
import { Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  meta: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We did not build a platform — we wrote a constitution that compiles. AURIENTA exists so that ordinary capital can become real ownership without ever surrendering custody, and so that governance cannot be bent by anyone, including me.",
    name: "Mohamed Eltonsy",
    role: "Founder & Sole Owner",
    meta: "AURIENTA",
  },
  {
    quote:
      "I trust AURIENTA precisely because it never holds my money. My capital clears through a regulated law-firm client account, every rule is enforced by code, and every action lands on an immutable ledger I can verify myself. That is the first time 'trust' has meant math instead of promises.",
    name: "Layla Mostafa",
    role: "Capital Partner",
    meta: "Constitutional Partner since 2026",
  },
  {
    quote:
      "I joined AURIENTA at Tier A as a single food stall. Six years later Street Bites graduated to a joint-stock company with a clean audit, NOSI-registered staff, and a ledger I exported in my own name. Sovereignty was the destination from day one — and it was honoured.",
    name: "Ahmed Hassan",
    role: "Founder, Street Bites",
    meta: "Graduated Tier A → F",
  },
];

const PARTNERS = [
  "GAFI",
  "FRA",
  "NOSI",
  "Egyptian Tax Authority",
  "Licensed Law Firms",
];

function Stars() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 gold stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <GoldStar key={i} className="h-3.5 w-3.5" />
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 24 }}
      transition={{
        duration: reduce ? 0 : 0.7,
        delay: reduce ? 0 : index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Card className="glass-gold group flex h-full flex-col gap-0 overflow-hidden rounded-2xl border-gold/15 p-0 transition-all duration-500 hover:border-gold/35">
        <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/8">
              <Quote className="h-4 w-4 text-gold" />
            </span>
            <Stars />
          </div>
        </CardHeader>
        <CardContent className="mt-5 px-6 pb-2">
          <p className="font-serif text-lg leading-relaxed text-foreground sm:text-xl">
            <span className="text-gold-gradient">&ldquo;</span>
            {t.quote}
            <span className="text-gold-gradient">&rdquo;</span>
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-gold/10 px-6 py-5">
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              <div className="font-serif text-base font-semibold text-foreground">
                {t.name}
              </div>
              <div className="font-sans text-xs text-muted-foreground">
                {t.role}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/5 px-2.5 py-1">
              <GoldStar className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-gold-light/80">
                Verified
              </span>
            </div>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground/80">
            {t.meta}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function Testimonials() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <section
      id="partners"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 aurienta-radial opacity-40"
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
            <GoldStar className="h-4 w-4" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.26em] text-gold-light/80">
              Early Adopters &amp; Institutional Partners
            </span>
            <GoldStar className="h-4 w-4" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <h2 className="mt-6 max-w-3xl font-serif text-3xl font-semibold leading-[1.15] sm:text-4xl md:text-5xl">
            Built with the people who will
            <span className="text-gold-gradient"> use it.</span>
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-base text-muted-foreground sm:text-lg">
            Constitutional infrastructure is only as credible as the partners
            who trust it with their capital, their company, and their
            sovereignty. These are the people building on AURIENTA today.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>

        {/* Partner category strip — real institutional counterparts, not invented brands */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 18 }}
          transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex flex-col items-center gap-5"
        >
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground/80">
            Constitutional counterparts &amp; regulatory interfaces
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
            {PARTNERS.map((p, i) => (
              <React.Fragment key={p}>
                <span className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/85 transition-colors hover:text-gold-light">
                  {p}
                </span>
                {i < PARTNERS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-1 w-1 rounded-full bg-gold/60"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

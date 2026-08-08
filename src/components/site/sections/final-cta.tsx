import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { ChevronRight, ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 -z-10 aurienta-radial" />
      <div className="absolute inset-0 -z-10 aurienta-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-[#14110a] via-background to-[#0c0c10] p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />

            <div className="relative flex flex-col items-center">
              <AurientaMark className="h-16 w-16" withGlow />

              <div className="mt-6 flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50" />
                <GoldStar className="h-3.5 w-3.5" />
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/80">
                  The Constitutional Pledge
                </span>
                <GoldStar className="h-3.5 w-3.5" />
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50" />
              </div>

              <h2 className="mt-6 max-w-2xl font-serif text-3xl font-semibold leading-[1.2] sm:text-4xl md:text-5xl">
                Your capital, your work, your company —
                <span className="text-gold-gradient"> no speculation required.</span>
              </h2>

              <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-muted-foreground">
                Join a noncustodial infrastructure of structural trust. Become a Constitutional
                Partner in under five minutes — verified, sovereign, and protected by rules that
                cannot be bent, bypassed, or broken.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-4 font-sans text-sm font-semibold text-black shadow-[0_14px_50px_-12px_rgba(212,175,55,0.7)] transition-all hover:shadow-[0_18px_70px_-10px_rgba(212,175,55,0.9)]"
                >
                  Become a Constitutional Partner
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-background/40 px-8 py-4 font-sans text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  Sign in to your workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-8 font-mono text-xs text-muted-foreground/80">
                Constitutional Hash · 0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

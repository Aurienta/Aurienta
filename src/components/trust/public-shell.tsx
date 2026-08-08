import Link from "next/link";
import { AurientaMark, AurientaWordmark, GoldStar } from "@/components/aurienta-logo";
import { Lock, Cpu, ShieldCheck, ArrowLeft, Scale } from "lucide-react";

/**
 * Minimal public header for the Trust & Badge surfaces.
 * No dashboard shell — these are standalone, public-facing pages.
 */
export function PublicTrustHeader({ active }: { active?: "trust" | "badge" | "registry" }) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="AURIENTA home"
        >
          <AurientaMark className="h-9 w-9 transition-transform duration-500 group-hover:scale-105" />
          <span className="flex flex-col leading-none">
            <AurientaWordmark className="text-base sm:text-lg" />
            <span className="mt-1 hidden font-sans text-[11px] uppercase tracking-[0.28em] text-muted-foreground sm:block">
              Constitutional Enterprise Infrastructure
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Public surfaces">
          <Link
            href="/registry"
            className={
              "rounded-full px-3 py-2 font-sans text-xs sm:text-sm transition-colors sm:px-4 " +
              (active === "registry"
                ? "bg-gold/10 text-gold-light"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Registry
          </Link>
          <Link
            href="/trust"
            className={
              "rounded-full px-3 py-2 font-sans text-xs sm:text-sm transition-colors sm:px-4 " +
              (active === "trust"
                ? "bg-gold/10 text-gold-light"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Trust
          </Link>
          <Link
            href="/signin"
            className="rounded-full px-3 py-2 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-4 sm:text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-2 font-sans text-xs font-medium text-foreground transition-colors hover:bg-gold/5 sm:px-4 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to overview</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

/**
 * Sticky constitutional footer — gold hash tagline + Zero Custody badges.
 * Pairs with a root wrapper `<div className="min-h-screen flex flex-col">`
 * and a `<main className="flex-1">`.
 */
export function PublicTrustFooter() {
  return (
    <footer
      className="mt-auto border-t border-gold/12 bg-gradient-to-b from-transparent to-[#050506]"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50" />
          <GoldStar className="h-3 w-3" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50" />
        </div>

        <p className="text-center font-serif text-sm italic text-gold-light/80 sm:text-base">
          Dependency is transitional. Sovereignty is the destination.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-xs sm:text-[11px] text-muted-foreground/85">
          <span className="text-muted-foreground/80">Constitutional Hash:</span>
          <span className="text-gold/80">
            0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A
          </span>
          <span className="hidden text-muted-foreground/85 sm:inline" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground/85">
            <Lock className="h-3 w-3 text-gold/70" /> Zero Custody
          </span>
          <span className="hidden text-muted-foreground/85 sm:inline" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground/85">
            <Cpu className="h-3 w-3 text-gold/70" /> AI Enforced
          </span>
          <span className="hidden text-muted-foreground/85 sm:inline" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground/85">
            <Scale className="h-3 w-3 text-gold/70" /> Law firm client account
          </span>
        </div>

        <p className="text-center font-sans text-xs sm:text-[11px] text-muted-foreground/80">
          © {new Date().getFullYear()} AURIENTA — Constitutional Enterprise Infrastructure.
          <span className="mx-1.5 hidden sm:inline" aria-hidden="true">·</span>
          <span className="block sm:inline">Egyptian LLC under Companies Law 159/1981.</span>
          <span className="mx-1.5 hidden sm:inline" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" aria-hidden="true" /> FRA No-Action Letter
          </span>
        </p>
      </div>
    </footer>
  );
}

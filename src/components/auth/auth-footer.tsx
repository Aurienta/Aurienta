import Link from "next/link";
import { GoldStar } from "@/components/aurienta-logo";
import { Lock, Cpu, ShieldCheck } from "lucide-react";

/**
 * Shared sticky footer for all auth pages.
 * Renders the constitutional hash tagline + Zero Custody / AI Enforced badges.
 * Pairs with a root wrapper `<div className="min-h-screen flex flex-col">`
 * and a `<main className="flex-1">`.
 */
export function AuthFooter() {
  return (
    <footer
      className="mt-auto border-t border-gold/12 bg-gradient-to-b from-transparent to-[#050506]"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50" />
          <GoldStar className="h-3 w-3" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50" />
        </div>

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
        </div>

        <p className="text-center font-sans text-xs sm:text-[11px] text-muted-foreground/80">
          © {new Date().getFullYear()} AURIENTA — Constitutional Enterprise Infrastructure.
          <span className="mx-1.5 hidden sm:inline" aria-hidden="true">·</span>
          <span className="block sm:inline">
            Egyptian LLC under Companies Law 159/1981.
          </span>
          <span className="mx-1.5 hidden sm:inline" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" aria-hidden="true" /> FRA No-Action Letter
          </span>
        </p>

        <p className="sr-only">
          AURIENTA — noncustodial constitutional infrastructure of structural trust.
          <Link href="/" className="text-gold">Return to overview</Link>.
        </p>
      </div>
    </footer>
  );
}

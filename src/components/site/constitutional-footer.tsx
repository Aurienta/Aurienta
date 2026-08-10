import Link from "next/link";
import { GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

/**
 * ConstitutionalFooter — shared footer component for all dashboard pages.
 * Displays the constitutional hash, zero-custody reminder, and key links.
 * Reduces code duplication across 96 dashboard pages.
 */
export function ConstitutionalFooter() {
  return (
    <footer className="mt-auto border-t border-gold/10 bg-gradient-to-b from-background to-[#060608]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3 text-gold" />
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-gold/70">
              AURIENTA
            </span>
            <GoldStar className="h-3 w-3 text-gold" />
          </div>
          <p className="text-xs text-muted-foreground">
            Constitutional Hash ·{" "}
            <span className="font-mono text-gold/60">
              {CONSTITUTIONAL_HASH.slice(0, 12)}…{CONSTITUTIONAL_HASH.slice(-6)}
            </span>{" "}
            · live on immutable ledger
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Zero Custody · Amendment IX</span>
            <span className="text-gold/20">|</span>
            <span>AI-Enforced Governance</span>
            <span className="text-gold/20">|</span>
            <Link href="/legal" className="hover:text-gold transition-colors">
              Platform Terms
            </Link>
            <span className="text-gold/20">|</span>
            <span>© 2026 AURIENTA · Mohamed Eltonsy, Founder & Sole Owner</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

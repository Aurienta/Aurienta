import Link from "next/link";
import { AurientaMark } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";

/**
 * ConstitutionalFooter — shared slim institutional footer rendered at the
 * bottom of every dashboard page via the dashboard layout.
 *
 * Left   · AURIENTA mark + tagline
 * Center · Constitutional status line (CRE online · Zero Custody · hash)
 * Right  · Constitution · Registry · Legal · Sign out
 *
 * Presentational server component (no client hooks). Uses Next.js <Link> so
 * client-side navigation is preserved. Sticks to the bottom of the viewport
 * on short pages and is pushed down naturally on long pages because the
 * dashboard layout wraps the shell + this footer in a `min-h-screen flex-col`.
 */
export function ConstitutionalFooter({ className }: { className?: string }) {
  // Truncate the constitutional hash for display: 0xB4F8…E7D1A
  const hash = CONSTITUTIONAL_HASH;
  const shortHash = `${hash.slice(0, 8)}…${hash.slice(-6)}`;

  return (
    <footer
      className={cn(
        "mt-auto border-t border-gold/12 bg-background/80 backdrop-blur",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-3 sm:flex-row sm:justify-between sm:px-8">
        {/* Left — AURIENTA mark + tagline */}
        <div className="flex items-center gap-2.5">
          <AurientaMark className="h-5 w-5" />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-gold-gradient">
              AURIENTA
            </span>
            <span className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Constitutional Enterprise Infrastructure
            </span>
          </div>
        </div>

        {/* Center — constitutional status */}
        <div
          className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"
          aria-label="Constitutional status"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            CRE online
          </span>
          <span className="text-gold/20" aria-hidden>
            ·
          </span>
          <span>Zero Custody</span>
          <span className="text-gold/20" aria-hidden>
            ·
          </span>
          <span className="text-gold/70">
            Hash <span className="text-gold/90">{shortHash}</span>
          </span>
        </div>

        {/* Right — quick links */}
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-label="Footer navigation"
        >
          <Link
            href="/dashboard/constitution"
            className="transition-colors hover:text-gold-light"
          >
            Constitution
          </Link>
          <span className="text-gold/15" aria-hidden>
            ·
          </span>
          <Link
            href="/registry"
            className="transition-colors hover:text-gold-light"
          >
            Registry
          </Link>
          <span className="text-gold/15" aria-hidden>
            ·
          </span>
          <Link
            href="/legal"
            className="transition-colors hover:text-gold-light"
          >
            Legal
          </Link>
          <span className="text-gold/15" aria-hidden>
            ·
          </span>
          <Link
            href="/api/auth/signout"
            className="font-medium text-muted-foreground transition-colors hover:text-gold-light"
          >
            Sign out
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default ConstitutionalFooter;

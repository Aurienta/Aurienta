import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AURIENTA emblem — the constitutional "A".
 * A geometric letterform of two tapered legs rising to an apex,
 * bound by a curved arc (the constitutional bridge) with a
 * five-pointed sovereign star at its heart.
 */
export function AurientaMark({
  className,
  withGlow = false,
}: {
  className?: string;
  withGlow?: boolean;
}) {
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      role="img"
      aria-label="AURIENTA emblem"
      style={withGlow ? { filter: `drop-shadow(0 0 18px rgba(212,175,55,0.45))` } : undefined}
    >
      <defs>
        <linearGradient id={`gold-${id}`} x1="60" y1="6" x2="60" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7e9a6" />
          <stop offset="0.32" stopColor="#f4d676" />
          <stop offset="0.55" stopColor="#d4af37" />
          <stop offset="0.82" stopColor="#b8860b" />
          <stop offset="1" stopColor="#8a6d1f" />
        </linearGradient>
        <linearGradient id={`goldStroke-${id}`} x1="20" y1="10" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7e9a6" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#b8860b" />
        </linearGradient>
      </defs>

      {/* Left leg — tapered */}
      <path
        d="M60 12 L20 118 L30.5 118 L60 33 Z"
        fill={`url(#gold-${id})`}
      />
      {/* Right leg — tapered */}
      <path
        d="M60 12 L100 118 L89.5 118 L60 33 Z"
        fill={`url(#gold-${id})`}
      />

      {/* Constitutional arc — the bridge binding the legs */}
      <path
        d="M34.2 73 Q60 96 85.8 73"
        stroke={`url(#goldStroke-${id})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sovereign star — seated in the arc */}
      <path
        d="M60 60.5 L62.35 67.75 L70 67.75 L63.82 72.25 L66.18 79.5 L60 75 L53.82 79.5 L56.18 72.25 L50 67.75 L57.65 67.75 Z"
        fill={`url(#gold-${id})`}
      />
    </svg>
  );
}

export function AurientaWordmark({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "font-serif font-semibold uppercase tracking-wordmark leading-none text-gold-gradient",
        className
      )}
    >
      AURIENTA
    </Tag>
  );
}

export function AurientaLogo({
  className,
  markClassName,
  showTagline = true,
  layout = "stacked",
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <AurientaMark className={cn("h-9 w-9", markClassName)} />
        <div className="flex flex-col leading-none">
          <AurientaWordmark className="text-xl" />
          {showTagline && (
            <span className="mt-1 font-sans text-[11px] uppercase tracking-tagline text-muted-foreground">
              Constitutional Enterprise Infrastructure
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <AurientaMark className={cn("h-16 w-16", markClassName)} withGlow />
      <AurientaWordmark className="mt-4 text-2xl sm:text-3xl" />
      {showTagline && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-sans text-[11px] sm:text-[11px] uppercase tracking-tagline text-muted-foreground">
            Constitutional Enterprise Infrastructure
          </span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/60" />
        </div>
      )}
    </div>
  );
}

/** Compact five-pointed star, used as a divider/section motif. */
export function GoldStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2 L14.6 8.9 L22 9.3 L16.3 14.1 L18.2 21.3 L12 17.3 L5.8 21.3 L7.7 14.1 L2 9.3 L9.4 8.9 Z"
        fill="url(#starGold)"
      />
      <defs>
        <linearGradient id="starGold" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7e9a6" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#b8860b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

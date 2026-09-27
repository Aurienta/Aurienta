import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AURIENTA emblem — the constitutional "A" (2026 enhanced).
 * A geometric letterform of two tapered legs rising to an apex,
 * bound by a curved arc (the constitutional bridge) with a
 * five-pointed sovereign star at its heart.
 *
 * 2026 Upgrade: animated metallic gold gradient with shimmer sweep,
 * enhanced drop-shadow glow, and optional parallax float.
 */
export function AurientaMark({
  className,
  withGlow = false,
  animated = true,
}: {
  className?: string;
  withGlow?: boolean;
  animated?: boolean;
}) {
  const id = React.useId();
  const gradientId = `gold-3d-${id}`;
  const strokeId = `gold-stroke-${id}`;
  const shimmerId = `shimmer-${id}`;

  return (
    <svg
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", animated && "animate-float-3d", className)}
      role="img"
      aria-label="AURIENTA emblem"
      style={
        withGlow
          ? {
              filter: `drop-shadow(0 0 24px rgba(212,175,55,0.55)) drop-shadow(0 0 48px rgba(212,175,55,0.25))`,
            }
          : undefined
      }
    >
      <defs>
        {/* 2026 enhanced metallic gold gradient — 9 stops with bright highlight */}
        <linearGradient id={gradientId} x1="60" y1="6" x2="60" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="0.15" stopColor="#f7e9a6" />
          <stop offset="0.30" stopColor="#f4d676" />
          <stop offset="0.45" stopColor="#d4af37" />
          <stop offset="0.55" stopColor="#ffe066" />
          <stop offset="0.65" stopColor="#d4af37" />
          <stop offset="0.82" stopColor="#b8860b" />
          <stop offset="1" stopColor="#6b5314" />
        </linearGradient>
        <linearGradient id={strokeId} x1="20" y1="10" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="0.3" stopColor="#f7e9a6" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="0.7" stopColor="#f4d676" />
          <stop offset="1" stopColor="#b8860b" />
        </linearGradient>
        {/* Shimmer sweep mask */}
        <linearGradient id={shimmerId} x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          <animate
            attributeName="x1"
            from="-120"
            to="240"
            dur="3.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            from="0"
            to="360"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>

      {/* Left leg — tapered with enhanced gradient */}
      <path
        d="M60 12 L20 118 L30.5 118 L60 33 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Right leg — tapered with enhanced gradient */}
      <path
        d="M60 12 L100 118 L89.5 118 L60 33 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Constitutional arc — the bridge binding the legs (enhanced) */}
      <path
        d="M34.2 73 Q60 96 85.8 73"
        stroke={`url(#${strokeId})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sovereign star — seated in the arc (enhanced gradient) */}
      <path
        d="M60 60.5 L62.35 67.75 L70 67.75 L63.82 72.25 L66.18 79.5 L60 75 L53.82 79.5 L56.18 72.25 L50 67.75 L57.65 67.75 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Shimmer sweep overlay — animated light pass */}
      {animated && (
        <>
          <path
            d="M60 12 L20 118 L30.5 118 L60 33 Z"
            fill={`url(#${shimmerId})`}
          />
          <path
            d="M60 12 L100 118 L89.5 118 L60 33 Z"
            fill={`url(#${shimmerId})`}
          />
          <path
            d="M60 60.5 L62.35 67.75 L70 67.75 L63.82 72.25 L66.18 79.5 L60 75 L53.82 79.5 L56.18 72.25 L50 67.75 L57.65 67.75 Z"
            fill={`url(#${shimmerId})`}
          />
        </>
      )}
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

// AURIENTA Logo — exact match to reference image
// Solid indigo 'A' mark (geometric, open base, straight crossbar)
// No star, no arc, no gradient on the mark itself

import * as React from "react";
import { cn } from "@/lib/utils";

export function AurientaMark({
  className,
  color = "#4338CA",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 44"
      className={cn("block", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AURIENTA emblem"
    >
      {/* Left leg — tapered, meets at peak */}
      <path
        d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z"
        fill={color}
      />
      {/* Straight crossbar in upper half */}
      <rect x="12" y="26" width="16" height="3" rx="1" fill={color} />
    </svg>
  );
}

export function AurientaWordmark({
  className,
  color = "#4338CA",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={cn("font-sans font-bold uppercase tracking-tight", className)}
      style={{ color }}
    >
      AURIENTA
    </span>
  );
}

export function AurientaLogo({
  className,
  markClassName,
  showTagline = false,
  color = "#4338CA",
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  color?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AurientaMark className={cn("h-8 w-8", markClassName)} color={color} />
      <AurientaWordmark className="text-[18px]" color={color} />
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, X, Minus } from "lucide-react";

export type ComplianceStatus = "green" | "amber" | "red" | "neutral";

const TONE: Record<ComplianceStatus, { ring: string; bg: string; fg: string; label: string }> = {
  green: {
    ring: "border-emerald-400/30",
    bg: "bg-emerald-400/8",
    fg: "text-emerald-300",
    label: "Compliant",
  },
  amber: {
    ring: "border-amber-400/30",
    bg: "bg-amber-400/8",
    fg: "text-amber-300",
    label: "Attention",
  },
  red: {
    ring: "border-red-400/30",
    bg: "bg-red-400/8",
    fg: "text-red-300",
    label: "Action required",
  },
  neutral: {
    ring: "border-gold/15",
    bg: "bg-gold/[0.03]",
    fg: "text-muted-foreground",
    label: "Pending",
  },
};

/** Compact coloured badge used inside the compliance matrix. */
export function StatusBadge({
  status,
  label,
  detail,
  className,
  showIcon = true,
}: {
  status: ComplianceStatus;
  label?: string;
  detail?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const tone = TONE[status];
  const Icon = status === "green" ? Check : status === "amber" ? AlertTriangle : status === "red" ? X : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-sans text-[11px] font-medium",
        tone.ring,
        tone.bg,
        tone.fg,
        className
      )}
      title={detail ?? label}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{label ?? tone.label}</span>
    </span>
  );
}

/** A square "vital" cell for the matrix — dot + tiny detail text. */
export function StatusDot({ status, className }: { status: ComplianceStatus; className?: string }) {
  const tone = TONE[status];
  return (
    <span
      className={cn(
        "inline-flex h-2.5 w-2.5 rounded-full",
        status === "green"
          ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]"
          : status === "amber"
          ? "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]"
          : status === "red"
          ? "bg-red-400 shadow-[0_0_8px_2px_rgba(248,113,113,0.5)]"
          : "bg-muted-foreground/40",
        className
      )}
      aria-label={tone.label}
    />
  );
}

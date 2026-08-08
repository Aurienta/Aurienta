import { cn } from "@/lib/utils";
import { riskBand, recommendationLabel } from "./types";
import { Sparkles } from "lucide-react";

type Props = {
  score: number;
  recommendation?: string | null;
  confidence?: number;
  className?: string;
  variant?: "card" | "inline";
};

// AI Risk badge — Mixtral 8x22B colored by score band.
export function AiRiskBadge({
  score,
  recommendation,
  confidence,
  className,
  variant = "card",
}: Props) {
  const band = riskBand(score);

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium",
          className
        )}
        style={{ background: band.bg, color: band.text, border: `1px solid ${band.border}` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: band.color }} />
        AI Risk {score}/100 · {band.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        className
      )}
      style={{ background: band.bg, borderColor: band.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: band.color }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            AI Risk · Mixtral 8x22B
          </span>
        </div>
        <span className="font-mono text-sm font-semibold" style={{ color: band.text }}>
          {score}/100
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: band.color }} />
        <span className="font-sans text-[11px] font-medium" style={{ color: band.text }}>
          {band.label} risk
        </span>
        {recommendation && (
          <span className="ml-auto font-sans text-[11px] text-muted-foreground">
            Recommendation:{" "}
            <span className="font-medium text-foreground">
              {recommendationLabel(recommendation)}
            </span>
          </span>
        )}
      </div>
      {typeof confidence === "number" && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(confidence * 100)}%`,
                background: band.color,
              }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            conf {Math.round(confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

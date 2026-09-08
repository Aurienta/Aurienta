"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";

/**
 * Execute Graduation button (DE-07 fix).
 *
 * The graduation vote is a two-step act in AURIENTA: first the Constitutional
 * Partners pass a `graduation` proposal (auto-"executed" on quorum by the
 * vote endpoint), THEN an authorised officer triggers the irreversible
 * graduation execution via `POST /api/graduation/execute` — which flips
 * `enterprise.status` + `enterprise.stage` to "graduated" and appends the
 * constitutional `graduation_executed` ledger event.
 *
 * Without this button, the second step had zero UI callers — proposals
 * passed but enterprises never actually graduated.
 *
 * Shown only when (a) a graduation proposal has already passed (status
 * "executed") AND (b) the enterprise has not yet flipped to "graduated".
 */
export function ExecuteGraduationButton({
  enterpriseId,
  enterpriseName,
  readinessScore,
  className,
}: {
  enterpriseId: string;
  enterpriseName: string;
  readinessScore: number;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const eligible = readinessScore >= 75;

  const onExecute = async () => {
    if (!eligible || pending) return;
    setPending(true);
    try {
      const res = await csrfFetch("/api/graduation/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data?.alreadyGraduated) {
          toast.info("Already sovereign", {
            description: `${enterpriseName} is already graduated.`,
          });
        } else {
          toast.success("Graduation executed", {
            description: `${enterpriseName} is now a sovereign, self-governing JSC. Constitutional anchor sealed on the immutable ledger.`,
          });
        }
        router.refresh();
        return;
      }

      if (res.status === 403) {
        toast.error("CRE rejected the act", {
          description:
            data?.error ??
            "Only the Founding Operator, Company Owner, or a board member may execute graduation.",
        });
        return;
      }

      if (res.status === 400 && data?.code === "READINESS_NOT_MET") {
        toast.error("Readiness requirements not met", {
          description: `Score ${data?.readiness?.score ?? readinessScore}/100 — needs ≥75 and ≥7 of 9 gates passing.`,
        });
        return;
      }

      toast.error("Graduation execution failed", {
        description:
          data?.error ??
          data?.message ??
          "The Constitutional Runtime Engine refused the act.",
      });
    } catch {
      toast.error("Network error", {
        description: "The CRE could not be reached. Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        onClick={onExecute}
        disabled={!eligible || pending}
        className="h-12 gap-2 rounded-xl bg-gold-gradient px-6 font-sans text-sm font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:opacity-50 disabled:shadow-none"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GraduationCap className="h-4 w-4" />
        )}
        {pending
          ? "Sealing graduation…"
          : eligible
          ? "Execute Graduation"
          : "Readiness below 75"}
      </Button>
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
        {eligible
          ? "Irreversible constitutional act — flips status + stage to sovereign JSC and seals the graduation_executed ledger event."
          : `Readiness must reach 75/100 before graduation can be executed. Currently at ${readinessScore}.`}
      </p>
    </div>
  );
}

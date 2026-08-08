"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Client-side "Call graduation vote" button. Submits a real `graduation`
 * proposal to /api/proposals and refreshes the page so the Governance view
 * picks up the new voting window.
 *
 * Disabled (with explanatory caption) when the readiness score is below 90
 * or when a graduation proposal is already open for the enterprise.
 */
export function CallVoteButton({
  readinessScore,
  enterpriseName,
  enterpriseId,
  hasOpenProposal,
  className,
}: {
  readinessScore: number;
  enterpriseName: string;
  enterpriseId: string;
  hasOpenProposal: boolean;
  className?: string;
}) {
  const router = useRouter();
  const eligible = readinessScore >= 90 && !hasOpenProposal;
  const [pending, setPending] = React.useState(false);

  const onClick = async () => {
    if (!eligible || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enterpriseId,
          title: "Graduation to Sovereign Independence",
          description:
            "Calling the 75% supermajority graduation vote per constitutional Article IV.",
          type: "graduation",
          votingDurationHours: 336,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        toast.success("Graduation vote published", {
          description:
            "Cooling period begins. Voting opens after the cooling window — see Governance.",
        });
        toast.message("CRE seal attached", {
          description: `${enterpriseName} · readiness ${readinessScore}/100 · Article VII supermajority required.`,
        });
        // Re-fetch server data so the Governance + Graduation pages reflect
        // the new open proposal (and the button flips to "Vote already live").
        router.refresh();
        return;
      }

      if (res.status === 401) {
        toast.error("Sign-in required", {
          description: "You must be signed in to call a graduation vote.",
        });
        return;
      }

      if (res.status === 403) {
        toast.error("CRE rejected the proposal", {
          description:
            data?.error ??
            data?.message ??
            "You do not have authority to call this vote for the enterprise.",
        });
        return;
      }

      if (res.status === 400) {
        toast.error("CRE rejected the proposal", {
          description:
            data?.reason ??
            data?.error ??
            data?.message ??
            "The Constitutional Runtime Engine denied this proposal.",
        });
        return;
      }

      toast.error("Failed to publish vote", {
        description:
          data?.message ?? data?.error ?? "The CRE could not be reached. Please try again.",
      });
    } catch {
      toast.error("Network error", { description: "The CRE could not be reached." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        onClick={onClick}
        disabled={!eligible || pending}
        className="h-12 gap-2 rounded-xl bg-gold-gradient px-6 font-sans text-sm font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:opacity-50 disabled:shadow-none"
      >
        <Rocket className="h-4 w-4" />
        {pending
          ? "Publishing…"
          : hasOpenProposal
          ? "Vote already live"
          : readinessScore >= 90
          ? "Call graduation vote"
          : "Readiness below 90"}
      </Button>
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
        {hasOpenProposal
          ? "A graduation proposal is already open for this enterprise. Cast your vote in Governance."
          : readinessScore >= 90
          ? "Requires proposer ≥5% voting power · 1,000 EGP refundable fee · 30-day cooling."
          : `Readiness must reach 90/100 before a graduation vote can be called. Currently at ${readinessScore}.`}
      </p>
    </div>
  );
}

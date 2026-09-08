"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";

type Props = {
  claimId: string;
  claimantName: string;
  credentialName: string;
  /**
   * Optional equity grant percentage to send on approval. The endpoint caps
   * this at 2% (the board discretionary pool). Defaults to a conservative
   * 0.5% so the manager must explicitly raise it via the API if needed.
   */
  equityGrantPct?: number;
};

/**
 * Skill-Equity review action buttons (DE-08 fix).
 *
 * The `/api/skill-equity/[id]/review` endpoint existed but had zero UI
 * callers — claims could be filed but never approved/rejected. These two
 * buttons are the missing caller.
 *
 * On click the parent row fades out (router.refresh()) and a toast confirms
 * the decision. Errors (CRE denial, rate-limit, self-review) are surfaced
 * verbatim from the API.
 */
export function SkillEquityReviewButtons({
  claimId,
  claimantName,
  credentialName,
  equityGrantPct = 0.5,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);

  const submit = async (decision: "approve" | "reject") => {
    if (busy) return;
    setBusy(decision);
    try {
      const res = await csrfFetch(`/api/skill-equity/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          equityGrantPct: decision === "approve" ? equityGrantPct : 0,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error("Review rejected by the CRE", {
          description:
            data?.error ??
            data?.message ??
            (decision === "approve"
              ? "The skill-equity claim could not be approved."
              : "The skill-equity claim could not be rejected."),
        });
        return;
      }

      toast.success(
        decision === "approve" ? "Skill-equity claim approved" : "Skill-equity claim rejected",
        {
          description:
            decision === "approve"
              ? `${claimantName} — ${credentialName} · ${equityGrantPct}% equity grant recorded.`
              : `${claimantName} — ${credentialName} · claim dismissed.`,
        }
      );
      router.refresh();
    } catch {
      toast.error("Network error", {
        description: "The CRE could not be reached. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={() => submit("approve")}
        disabled={busy !== null}
        className={cn(
          "h-8 gap-1.5 rounded-lg bg-gold-gradient px-3 text-xs font-semibold text-black hover:opacity-95",
          busy === "approve" && "opacity-70"
        )}
      >
        {busy === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => submit("reject")}
        disabled={busy !== null}
        className={cn(
          "h-8 gap-1.5 rounded-lg border border-destructive/40 bg-transparent px-3 text-xs font-medium text-destructive hover:bg-destructive/10",
          busy === "reject" && "opacity-70"
        )}
      >
        {busy === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Reject
      </Button>
    </div>
  );
}

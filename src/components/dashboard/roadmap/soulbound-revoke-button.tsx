"use client";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  /** Pre-fill the userId field (e.g. when invoked from a user-admin screen). */
  defaultUserId?: string;
  variant?: "default" | "compact";
};

/**
 * Soulbound credential revocation button (AUD-022).
 *
 * Only callers holding the `aurienta_rep` role may revoke a credential. The
 * credential remains in the database (NOT deleted) so that external
 * verifiers continue to receive a structured "revoked on {date}" response —
 * only its `isRevoked` flag flips to true.
 *
 * Calls POST /api/soulbound/revoke with { userId, reason }.
 *
 * On success the credential row is marked revoked, the revocation timestamp
 * is recorded, and external verifications of that credential ID will now
 * return `valid: false` with the reason supplied.
 */
export function SoulboundRevokeButton({
  defaultUserId = "",
  variant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [userId, setUserId] = React.useState(defaultUserId);
  const [reason, setReason] = React.useState("");

  async function onRevoke() {
    if (busy) return;
    if (!userId.trim()) {
      toast.error("User ID required", {
        description: "Paste the cuid of the credential holder.",
      });
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Reason required", {
        description:
          "Provide at least 3 characters explaining the revocation (audit-recorded).",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await csrfFetch("/api/soulbound/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          reason: reason.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Revocation failed.", {
          description: json.code ? `Code: ${json.code}` : undefined,
        });
        return;
      }
      toast.success("Soulbound credential revoked.", {
        description:
          "The credential remains in the database for audit history. External verifications will now return invalid.",
      });
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error reaching the CRE.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "gap-1.5 rounded-lg border border-rose-300 bg-rose-50 font-sans text-xs font-semibold text-rose-700 hover:bg-rose-100",
            variant === "compact" ? "h-8 px-3" : "h-9"
          )}
        >
          <Ban className="h-3.5 w-3.5" />
          Revoke credential
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Revoke soulbound credential
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Revocation is recorded on the immutable ledger and cannot be
            undone. The credential row remains in the database (it is NOT
            deleted) so that external verifiers continue to receive a
            structured <code className="font-mono">revoked on {new Date().toISOString().slice(0, 10)}</code>{" "}
            response.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="sb-revoke-user-id"
              className="font-sans text-[11px] uppercase tracking-wide text-slate-500"
            >
              Holder user ID (cuid)
            </Label>
            <Input
              id="sb-revoke-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="cuid of the credential holder"
              className="border-violet-200 bg-white font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="sb-revoke-reason"
              className="font-sans text-[11px] uppercase tracking-wide text-slate-500"
            >
              Reason (≥ 3 chars — recorded in audit log)
            </Label>
            <Textarea
              id="sb-revoke-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Identity compromised — holder reported lost Ed25519 anchor key on 2026-04-12."
              maxLength={2000}
              className="border-violet-200 bg-white font-sans text-sm"
            />
            <p className="font-mono text-[11px] text-slate-400">
              {reason.length}/2000 chars
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
            className="font-sans text-xs text-slate-500 hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onRevoke}
            disabled={
              busy || !userId.trim() || reason.trim().length < 3
            }
            className="gap-1.5 rounded-lg border border-rose-300 bg-rose-50 font-sans text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
            Revoke credential
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

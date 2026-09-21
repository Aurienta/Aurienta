"use client";

import * as React from "react";
import { toast } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ExternalLink, CheckCircle2, ShieldCheck } from "lucide-react";

/**
 * PresentExternallyButton — a self-contained client widget that fires a mock
 * "VC presentation" toast on click. Mirrors the W3C VC Presentation Exchange
 * flow described in Vol 3 §3.9.4: the holder (user) initiates a presentation
 * to a verifier; in this mock, the verifier endpoint is not contacted — we
 * only emit a toast acknowledging the action.
 */
export function PresentExternallyButton({
  vcId,
  vcType,
  subjectLabel,
}: {
  vcId: string;
  vcType: string;
  subjectLabel: string;
}) {
  const [busy, setBusy] = React.useState(false);

  const present = React.useCallback(async () => {
    setBusy(true);
    // Mock presentation handshake — in production this would generate a
    // Verifiable Presentation JWT signed by the holder's Ed25519 key and
    // POST it to the verifier's presentation endpoint (Vol 3 §3.9.4).
    await new Promise((r) => setTimeout(r, 650));
    setBusy(false);
    toast.success("Verifiable Credential presented", {
      description: `Type: ${vcType} · Subject: ${subjectLabel} · Verifier handshake simulated.`,
      duration: 5500,
      icon: <CheckCircle2 className="h-4 w-4 text-gold" />,
      style: {
        border: "1px solid rgba(212,175,55,0.25)",
        background: "rgba(16,16,18,0.95)",
        color: "#f3eedd",
      },
    });
  }, [vcId, vcType, subjectLabel]);

  return (
    <>
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />
      <button
        type="button"
        onClick={present}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 font-sans text-[11.5px] font-medium text-gold-light transition-all hover:border-gold/55 hover:bg-gold/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Present ${vcType} externally`}
      >
        {busy ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-gold/40 border-t-gold" />
            Presenting…
          </>
        ) : (
          <>
            <ExternalLink className="h-3.5 w-3.5" />
            Present externally
          </>
        )}
      </button>
      <span className="ml-1.5 inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground/60">
        <ShieldCheck className="h-3 w-3 text-gold/50" />
        W3C VC Presentation Exchange
      </span>
    </>
  );
}

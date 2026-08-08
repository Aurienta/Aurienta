"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { shortHash } from "@/lib/aurienta/format";

type Props = {
  /** Optional enterprise id to scope the sync event to. */
  enterpriseId?: string;
  /** Label shown on the button. */
  label?: string;
};

/**
 * Posts to /api/ledger/sync to append a real `oracle_mirror_sync` LedgerEvent
 * to the immutable hash-chained ledger. On success the returned hash is shown
 * to the user as the proof that the checkpoint was sealed.
 */
export function OracleMirrorSyncButton({ enterpriseId, label = "Generate physical copy checkpoint" }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ledger/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: enterpriseId ?? undefined,
          note: "Oracle Mirror sync checkpoint — manual trigger",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error ?? "Sync failed";
        toast.error("Oracle Mirror sync failed", { description: msg });
        return;
      }
      setLastHash(data.hash);
      setLastAt(data.timestamp);
      toast.success("Oracle Mirror checkpoint sealed", {
        description: `Hash ${shortHash(data.hash, 10, 6)} appended to the immutable ledger.`,
      });
    } catch (e) {
      toast.error("Oracle Mirror sync failed", {
        description: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sealing checkpoint…" : label}
      </button>
      {lastHash && (
        <div className="flex items-start gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] px-2.5 py-1.5 font-mono text-xs text-emerald-300/90">
          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="break-all">
            Sealed {shortHash(lastHash, 12, 8)} · {lastAt ? new Date(lastAt).toLocaleString() : ""}
          </span>
        </div>
      )}
      <p className="flex items-start gap-1.5 font-sans text-xs leading-relaxed text-muted-foreground/80">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-gold/60" />
        <span>
          Seals a real <span className="font-mono">oracle_mirror_sync</span> event to the immutable hash-chained ledger.
          Physical notarisation in a notary vault is roadmap — this records the digital checkpoint only.
        </span>
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileCheck2,
  Loader2,
  ExternalLink,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileBox,
  Hash,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

type EvidenceItem = {
  id: string;
  cid: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  milestoneId: string | null;
  enterpriseId: string;
  enterpriseName?: string;
  enterpriseSlug?: string;
  enterpriseTier?: string;
  uploadedAt: string;
  ipfsUri: string;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function iconForMime(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("application/pdf") || mime.startsWith("text/")) return FileText;
  return FileBox;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export function EvidenceStream({
  enterpriseId,
  milestoneId,
  enterpriseName,
}: {
  enterpriseId: string;
  milestoneId?: string;
  enterpriseName?: string;
}) {
  const [items, setItems] = React.useState<EvidenceItem[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [dragOver, setDragOver] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [lastCid, setLastCid] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Fetch recent evidence for this enterprise (+ optional milestone)
  const refresh = React.useCallback(async () => {
    try {
      const url = new URL("/api/evidence", window.location.origin);
      url.searchParams.set("enterpriseId", enterpriseId);
      url.searchParams.set("limit", "20");
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as { items: EvidenceItem[] };
      // Filter by milestone client-side when milestoneId is provided
      const filtered = milestoneId
        ? json.items.filter((i) => i.milestoneId === milestoneId)
        : json.items;
      setItems(filtered);
    } catch {
      // Silent fail — list may simply be empty
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, [enterpriseId, milestoneId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFiles = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      // Reset state
      setUploadState("uploading");
      setUploadProgress(0);
      setLastCid(null);

      // Fake progress while we POST metadata (no actual bytes are streamed — mock IPFS)
      const tick = window.setInterval(() => {
        setUploadProgress((p) => Math.min(p + Math.random() * 18, 92));
      }, 160);

      try {
        const res = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enterpriseId,
            milestoneId: milestoneId ?? null,
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            description: description.trim() || null,
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || `Upload failed (${res.status})`);
        }

        const json = (await res.json()) as { cid: string; record: EvidenceItem };

        window.clearInterval(tick);
        setUploadProgress(100);
        setLastCid(json.cid);
        setUploadState("done");

        toast.success("Evidence pinned to IPFS", {
          description: `${file.name} · CID ${json.cid.slice(0, 10)}…`,
        });

        setDescription("");
        // Prepend to the local list (and re-fetch to ensure consistency)
        setItems((prev) => [json.record, ...prev]);
        await refresh();

        // Reset the upload zone after a short delay
        window.setTimeout(() => {
          setUploadState("idle");
          setUploadProgress(0);
        }, 2200);
      } catch (e) {
        window.clearInterval(tick);
        setUploadState("error");
        toast.error("Upload failed", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
        window.setTimeout(() => setUploadState("idle"), 2600);
      }
    },
    [enterpriseId, milestoneId, description, refresh]
  );

  return (
    <div className="flex flex-col gap-5">
      <SonnerToaster
        position="top-right"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-all sm:p-8",
          dragOver
            ? "border-gold/60 bg-gold/8"
            : "border-gold/20 bg-gold-gradient-soft hover:border-gold/35"
        )}
      >
        {/* shimmer line on upload */}
        {uploadState === "uploading" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="h-full w-1/3 bg-gold-gradient animate-shimmer-line" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label="Upload evidence file"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "mb-4 flex h-14 w-14 items-center justify-center rounded-full border transition-all",
              uploadState === "done"
                ? "border-emerald-400/40 bg-emerald-400/10"
                : uploadState === "error"
                  ? "border-red-400/40 bg-red-400/10"
                  : "border-gold/30 bg-gold/5"
            )}
          >
            {uploadState === "uploading" ? (
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            ) : uploadState === "done" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : uploadState === "error" ? (
              <AlertCircle className="h-6 w-6 text-red-400" />
            ) : (
              <UploadCloud className="h-6 w-6 text-gold" />
            )}
          </div>

          <h4 className="font-serif text-lg font-semibold text-foreground">
            {uploadState === "uploading"
              ? "Pinning to IPFS…"
              : uploadState === "done"
                ? "Pinned — radical transparency"
                : uploadState === "error"
                  ? "Upload failed"
                  : "Drop evidence here"}
          </h4>
          <p className="mt-1.5 max-w-md font-sans text-sm text-muted-foreground">
            {uploadState === "uploading"
              ? "Hashing, pinning to AURIENTA-controlled nodes, and writing the Filecoin 10-year deal."
              : uploadState === "done" && lastCid
                ? `CID ${lastCid.slice(0, 14)}… · ledger event appended.`
                : "Drag a file or click to browse. Receipts, geotagged photos, signed PDFs — every milestone artifact becomes a permanent, publicly verifiable IPFS pin."}
          </p>

          {/* Description input */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description (max 200 chars) — e.g. 'Q3 board-approved payroll register'"
            maxLength={200}
            rows={2}
            className="mt-4 w-full max-w-md resize-none rounded-xl border border-gold/20 bg-background/60 px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/75 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />

          {/* Progress bar */}
          <AnimatePresence>
            {uploadState === "uploading" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 w-full max-w-md"
              >
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-gold-gradient"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="mt-1 text-right font-mono text-xs text-muted-foreground">
                  {Math.floor(uploadProgress)}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadState === "uploading"}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-sm font-semibold text-black transition-all hover:shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            Choose file
          </button>
        </div>
      </div>

      {/* Recent evidence list */}
      <div className="rounded-2xl border border-gold/12 bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-gold" />
            <h5 className="font-serif text-base font-semibold text-foreground">
              Recent evidence
            </h5>
            {enterpriseName && (
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/85">
                · {enterpriseName}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-muted-foreground/80">
            {items.length} pinned
          </span>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading IPFS pins…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <FileBox className="h-8 w-8 text-muted-foreground/85" />
            <p className="font-sans text-sm text-muted-foreground/85">
              No evidence pinned yet. Upload the first artifact to start the
              transparency trail.
            </p>
          </div>
        ) : (
          <ul className="flex max-h-96 flex-col gap-2.5 overflow-y-auto pr-1">
            {items.map((it) => {
              const Icon = iconForMime(it.mimeType);
              return (
                <li
                  key={it.id}
                  className="group flex items-start gap-3 rounded-xl border border-gold/10 bg-background/40 p-3.5 transition-colors hover:border-gold/25 hover:bg-gold-gradient-soft"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="truncate font-sans text-sm font-medium text-foreground">
                        {it.filename}
                      </p>
                      <span className="font-mono text-xs text-muted-foreground/80">
                        {formatBytes(it.sizeBytes)} · {it.mimeType}
                      </span>
                    </div>

                    {it.description && (
                      <p className="mt-0.5 line-clamp-1 font-sans text-xs text-muted-foreground">
                        {it.description}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground/85">
                      <span className="inline-flex items-center gap-1 text-gold/80">
                        <Hash className="h-2.5 w-2.5" />
                        {it.cid.slice(0, 12)}…{it.cid.slice(-4)}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{timeAgo(it.uploadedAt)}</span>
                      {it.milestoneId && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="text-gold-light/70">milestone release</span>
                        </>
                      )}
                    </div>
                  </div>

                  <a
                    href={`https://ipfs.io/ipfs/${it.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/20 px-3 py-1.5 font-sans text-[11px] font-medium text-gold transition-colors hover:bg-gold/10"
                    title={`View ${it.cid} on the public IPFS gateway`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on IPFS
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center font-sans text-[11px] text-muted-foreground/80">
        Every pinned artifact is replicated to AURIENTA-controlled IPFS nodes
        with a 10-year Filecoin storage deal. Hash chain on the immutable ledger.
      </p>
    </div>
  );
}

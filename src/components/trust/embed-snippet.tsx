"use client";

import * as React from "react";
import { Check, Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export function EmbedSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = React.useState(false);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://aurienta.eg";
  const snippet = `<iframe
  src="${origin}/badge/${slug}"
  width="480"
  height="640"
  style="border:1px solid rgba(212,175,55,0.25);border-radius:16px;background:#08080a"
  title="AURIENTA Constitutional Badge — ${slug}"
  loading="lazy"
></iframe>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Embed snippet copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please select and copy manually");
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gold" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Embed this badge
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3.5 py-1.5 font-sans text-xs font-medium text-gold transition-colors hover:bg-gold/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy snippet"}
        </button>
      </div>

      <pre className="overflow-x-auto rounded-2xl border border-gold/15 bg-[#06060a] p-4 font-mono text-[11px] leading-relaxed text-gold-light/80">
        <code>{snippet}</code>
      </pre>

      <p className="font-sans text-[11px] text-muted-foreground/80">
        Drop this iframe anywhere — on your enterprise website, for a Capital Partner
        deck, or in a press release. The badge always shows live data from the
        AURIENTA immutable ledger.
      </p>
    </div>
  );
}

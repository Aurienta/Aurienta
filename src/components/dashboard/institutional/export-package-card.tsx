import * as React from "react";
import { Package, FileText, FileJson, FileCode, FileKey, Clock, ShieldCheck } from "lucide-react";
import { shortHash } from "@/lib/aurienta/format";

type File = { icon: React.ElementType; name: string; size: string; note: string };

const FILES: File[] = [
  { icon: FileText, name: "cap_table.csv", size: "84 KB", note: "Final equity ledger — every share + holder" },
  { icon: FileJson, name: "ledger/events.ndjson", size: "2.1 MB", note: "Append-only hash-chained event log" },
  { icon: FileCode, name: "verification_script.sh", size: "12 KB", note: "SHA3 + Ed25519 verification harness" },
  { icon: FileKey, name: "export_signature.sig", size: "256 B", note: "Ed25519 signature over the package" },
];

export function ExportPackageCard({ exportHash }: { exportHash?: string | null }) {
  return (
    <section
      aria-label="Sovereign export package"
      className="rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Package className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Sovereign Export Package</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-emerald-300">
          <ShieldCheck className="h-3 w-3" /> signed · verifiable
        </span>
      </div>

      <div className="rounded-xl border border-gold/12 bg-background/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="font-mono text-[11px] text-gold-light">
          aurienta_export_{new Date().toISOString().slice(0, 10).replace(/-/g, "")}.tar.gz
          </code>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/85">
            <Clock className="h-3 w-3" /> 4–8 hour self-host migration
          </span>
        </div>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {FILES.map((f) => (
            <li
              key={f.name}
              className="flex items-start gap-2.5 rounded-lg border border-gold/10 bg-background/40 p-2.5"
            >
              <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <code className="truncate font-mono text-[11px] text-foreground/90">{f.name}</code>
                  <span className="font-mono text-[11px] text-muted-foreground/85">{f.size}</span>
                </div>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground/80">{f.note}</p>
              </div>
            </li>
          ))}
        </ul>

        {exportHash && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gold/10 bg-gold/[0.03] px-3 py-2">
            <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              export hash (SHA3-256)
            </span>
            <code className="font-mono text-[11px] text-gold/80">{shortHash(exportHash, 18, 6)}</code>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground/85">
        On graduation passage, the package is auto-generated and signed. Any third party can run
        <code className="mx-1 text-gold/80">verification_script.sh</code> to confirm the ledger chain is intact
        and the signature matches AURIENTA's published Ed25519 public key.
      </p>
    </section>
  );
}

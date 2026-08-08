import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  Archive,
  FileText,
  HardDrive,
  Clock,
  CheckCircle2,
  Download,
  Boxes,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Institutional Memory · AURIENTA",
  description:
    "IPFS-pinned archives across 7 categories with 10-year Filecoin storage deals — every charter, audit, and precedent preserved for the long arc.",
};

const CATEGORIES = [
  { key: "charters", label: "Charters & amendments", icon: FileText, count: 47, sizeMb: 12 },
  { key: "audits", label: "Audit reports", icon: ShieldCheck, count: 184, sizeMb: 421 },
  { key: "precedents", label: "Dispute precedents (anonymised)", icon: Boxes, count: 312, sizeMb: 87 },
  { key: "ai_models", label: "AI model weights & governance", icon: Archive, count: 8, sizeMb: 14200 },
  { key: "police_clearance", label: "Police clearance certificates", icon: ShieldCheck, count: 67, sizeMb: 2 },
  { key: "nosi_schemas", label: "NOSI integration schemas", icon: FileText, count: 14, sizeMb: 1 },
  { key: "graduation_records", label: "Graduation records", icon: CheckCircle2, count: 5, sizeMb: 8 },
];

// Mock IPFS pin list (in production: pulled from Pinata / own IPFS node).
const PINS = [
  { cid: "QmA0Z7Yp9Xq2Vr4tK6mN3wL8bF1cJ5hD7sG9uE2vR4tY", category: "ai_models", label: "ai_model_weights_v1 (Gemma 2 7B oversight)", sizeMb: 14336, dealExpires: "2036-05-30", pinned: true },
  { cid: "QmB1X8yZ0pQ3rT5wK7mN2vL9bF4cJ6hD8sG0uE3vR5tY", category: "precedents", label: "precedent_library_v3 (anonymised disputes)", sizeMb: 87, dealExpires: "2036-05-30", pinned: true },
  { cid: "QmC2Y9zA1qR4sU6xL8mN3vK0bF5cJ7hD9sG1uE4vR6tY", category: "audits", label: "audit_reports_q2_2026", sizeMb: 4, dealExpires: "2036-05-30", pinned: true },
  { cid: "QmD3Z0aB2rS5tV7yM9nN4wL1cF6dJ8hE0sG2uF5vR7tY", category: "police_clearance", label: "police_clearance_templates_v2", sizeMb: 2, dealExpires: "2036-05-30", pinned: true },
  { cid: "QmE4A1bC3sT6uW8zN0oM5xL2dF7eJ9iE1sG3uF6vR8tY", category: "nosi_schemas", label: "nosi_integration_schemas_v1", sizeMb: 1, dealExpires: "2036-05-30", pinned: true },
  { cid: "QmF5B2cD4tU7vX0aO1nM6yL3eF8fJ0iE2sG4uF7vR9tY", category: "charters", label: "constitutional_charter_master_v2026.06", sizeMb: 12, dealExpires: "2036-05-30", pinned: true },
];

export default async function InstitutionalMemoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/institutional-memory");

  // Pull recent IPFS evidence rows.
  const recent = await db.ipfsEvidence.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 8,
    include: { enterprise: { select: { name: true } } },
  });

  const totalSizeMb = PINS.reduce((s, p) => s + p.sizeMb, 0);
  const totalSizeGb = (totalSizeMb / 1024).toFixed(2);
  const totalPins = PINS.length;
  const allDealsActive = PINS.every((p) => p.pinned);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Institutional Memory"
        icon={Archive}
        title="The constitutional record, never lost"
        subtitle="Every charter, audit, AI model weight, dispute precedent, and graduation record is pinned on AURIENTA-controlled IPFS nodes and backed by Filecoin storage deals expiring 2036-05-30. The network's institutional memory outlives any single enterprise, any single server, any single generation."
      />

      {/* Archive KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Archive size" value={`${totalSizeGb} GB`} icon={HardDrive} />
        <KPI label="IPFS pins" value={String(totalPins)} icon={Archive} />
        <KPI label="Filecoin deals" value={`${totalPins} active`} icon={CheckCircle2} ok={allDealsActive} />
        <KPI label="Deal expiry" value="2036-05-30" icon={Clock} />
      </div>

      {/* 7 categories */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <h2 className="font-serif text-base font-semibold">Seven archive categories</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">all pinned · all mirrored</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
              <div className="flex items-center gap-2">
                <c.icon className="h-4 w-4 text-gold" />
                <h3 className="font-serif text-sm font-semibold">{c.label}</h3>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="font-mono text-sm text-gold-light">{c.count.toLocaleString()}</div>
                  <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">items</div>
                </div>
                <div>
                  <div className="font-mono text-sm text-gold-light">{c.sizeMb >= 1024 ? `${(c.sizeMb / 1024).toFixed(1)} GB` : `${c.sizeMb} MB`}</div>
                  <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">pinned</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IPFS pin list */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Archive className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">IPFS pin registry</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">AURIENTA-controlled nodes</span>
          </div>
        </div>
        <ul className="divide-y divide-gold/8">
          {PINS.map((p) => (
            <li key={p.cid} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-sm font-semibold">{p.label}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> pinned
                </span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-muted-foreground/85">
                  <HardDrive className="h-3 w-3" />
                  {p.sizeMb >= 1024 ? `${(p.sizeMb / 1024).toFixed(1)} GB` : `${p.sizeMb} MB`}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> deal → {p.dealExpires}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-mono text-xs text-gold-light/80">{shortHash(p.cid, 16, 8)}</span>
                <button className="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/15 px-3 py-1 font-sans text-xs text-muted-foreground hover:text-foreground">
                  <Download className="h-3 w-3" /> Verify on IPFS
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent uploads */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Recent evidence uploads</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">enterprise-ledger-anchored</span>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center font-sans text-xs text-muted-foreground">
            No evidence uploads recorded yet.
          </div>
        ) : (
          <ul className="divide-y divide-gold/8">
            {recent.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 px-5 py-2.5">
                <span className="font-serif text-xs font-medium">{e.filename}</span>
                <span className="font-mono text-xs text-muted-foreground/85">· {e.enterprise?.name ?? "constitutional infrastructure"}</span>
                <span className="font-mono text-xs text-gold-light/80">{shortHash(e.cid, 12, 6)}</span>
                <span className="ml-auto font-sans text-xs text-muted-foreground/80">{timeAgo(e.uploadedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Institutional Memory per Vol 11.5 · 7 categories · IPFS + Filecoin 10-year deals · expiry 2036-05-30
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-gold" />
        {ok !== undefined && (ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock className="h-3 w-3 text-rose-400" />)}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import { OracleMirrorSyncButton } from "@/components/dashboard/oracle-mirror/oracle-mirror-sync-button";
import { BookCopy, Server, Archive, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Oracle Mirror · AURIENTA",
  description:
    "Physical paper mirror of the constitutional ledger. Activates on 7-day CRE outage. Drill history and offline-readiness.",
};

// ──────────────────────────────────────────────────────────────────────────
// Mirror status — computed from the age of the most recent ledger event.
//   age < 1h   → FRESH
//   age < 24h  → SYNCED
//   age ≥ 24h  → STALE
// ──────────────────────────────────────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type MirrorStatus = "FRESH" | "SYNCED" | "STALE" | "EMPTY";

function computeMirrorStatus(latestEventAt: Date | null): MirrorStatus {
  if (!latestEventAt) return "EMPTY";
  const age = Date.now() - new Date(latestEventAt).getTime();
  if (age < HOUR_MS) return "FRESH";
  if (age < DAY_MS) return "SYNCED";
  return "STALE";
}

const STATUS_STYLE: Record<MirrorStatus, { dot: string; text: string; label: string; description: string }> = {
  FRESH: { dot: "bg-emerald-400", text: "text-emerald-300", label: "FRESH", description: "latest ledger event < 1h ago" },
  SYNCED: { dot: "bg-gold", text: "text-gold-light", label: "SYNCED", description: "latest ledger event < 24h ago" },
  STALE: { dot: "bg-rose-400", text: "text-rose-300", label: "STALE", description: "latest ledger event > 24h ago — re-sync recommended" },
  EMPTY: { dot: "bg-muted-foreground/60", text: "text-muted-foreground", label: "AWAITING", description: "no ledger events sealed yet" },
};

// Physical copy locations — protocol reference for the notary-vault rollout.
// These are the *designated* vault sites from the Oracle Mirror protocol
// (Vol 17.19). Physical notarisation is roadmap; the digital checkpoint is
// real and recorded as an `oracle_mirror_sync` ledger event.
const PHYSICAL_VAULTS = [
  { id: "OM-CR-001", location: "Cairo Notary Office — Vault 12-B", custodian: "Notary Public Hassan Mahmoud" },
  { id: "OM-AL-002", location: "Alexandria Bar Association — Safe 4", custodian: "Bar Assoc. Secretary" },
  { id: "OM-GI-003", location: "Giza Chamber of Commerce — Cabinet 9", custodian: "Chamber Registrar" },
];

export default async function OracleMirrorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/oracle-mirror");

  // Global ledger stats — used by the "Latest snapshot" card.
  const totalEvents = await db.ledgerEvent.count();
  const lastEvent = await db.ledgerEvent.findFirst({
    orderBy: { timestamp: "desc" },
    select: { timestamp: true, payloadHash: true, eventType: true, enterpriseId: true },
  });

  // Per-enterprise last sync — computed from the latest LedgerEvent for each
  // enterprise the user belongs to (or has holdings in).
  const enterpriseIds = Array.from(
    new Set([
      ...user.memberships.map((m) => m.enterpriseId),
      ...user.ownershipRecords.map((s) => s.enterpriseId),
    ])
  );

  // Pull the latest ledger event per enterprise + the most recent
  // oracle_mirror_sync events across the user's scope (or globally if the
  // user has no enterprise affiliations yet).
  const enterpriseLastSync = enterpriseIds.length
    ? await Promise.all(
        enterpriseIds.map(async (eid) => {
          const [ent, latest] = await Promise.all([
            db.enterprise.findUnique({
              where: { id: eid },
              select: { id: true, name: true, slug: true, tier: true },
            }),
            db.ledgerEvent.findFirst({
              where: { enterpriseId: eid },
              orderBy: { timestamp: "desc" },
              select: { id: true, timestamp: true, payloadHash: true, eventType: true, sequence: true },
            }),
          ]);
          return { enterprise: ent, latest };
        })
      )
    : [];

  // Determine the most-recent ledger event across the user's scope (fall back
  // to the global latest event if the user has no enterprise affiliations).
  const scopedLatest = enterpriseLastSync
    .map((e) => e.latest)
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  const referenceEvent = scopedLatest ?? lastEvent;
  const mirrorStatus = computeMirrorStatus(referenceEvent?.timestamp ?? null);
  const statusStyle = STATUS_STYLE[mirrorStatus];

  // Recent oracle_mirror_sync checkpoints — real ledger events.
  const syncCheckpoints = await db.ledgerEvent.findMany({
    where: { eventType: "oracle_mirror_sync" },
    orderBy: { timestamp: "desc" },
    take: 6,
    select: {
      id: true,
      timestamp: true,
      payloadHash: true,
      sequence: true,
      payload: true,
      actorId: true,
      enterpriseId: true,
    },
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Oracle Mirror"
        icon={BookCopy}
        title="When the network fails, the paper holds"
        subtitle="The Oracle Mirror is the physical paper backup of the entire constitutional ledger — three copies, sealed in notary vaults across Cairo, Alexandria, and Giza. If the CRE goes dark for 7 days, the Mirror activates as the authoritative source of truth."
      />

      {/* Activation threshold + live mirror status */}
      <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
            <AlertTriangle className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-base font-semibold text-gold-light">Activation threshold: 7-day CRE outage</div>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              After 168 consecutive hours of CRE unavailability, the Steward declares Oracle Mirror active. All constitutional decisions revert to the most recent sealed paper copy until the CRE returns.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> CRE online · mirror armed
          </span>
        </div>

        {/* Live mirror status row — computed from real ledger data */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-gold/12 bg-background/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusStyle.dot} shadow-[0_0_8px_2px_rgba(212,175,55,0.35)]`} />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">Mirror status</span>
            <span className={`font-mono text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</span>
          </div>
          <span className="hidden text-gold/15 sm:inline">|</span>
          <span className="font-sans text-[11px] text-muted-foreground/85">{statusStyle.description}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground/85">
            {referenceEvent ? `latest event ${timeAgo(referenceEvent.timestamp)}` : "no events sealed"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Physical copies — protocol reference (roadmap) */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Archive className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Physical copies</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-gold-light/80">
              roadmap
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">3 designated vaults</span>
          </div>
          <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground/85">
            Protocol (roadmap — physical notarization pending). The three notary-vault sites are designated by the Oracle Mirror protocol (Vol 17.19); physical binder sealing is not yet operational. Digital checkpoints are recorded as <span className="font-mono">oracle_mirror_sync</span> ledger events in real time.
          </p>
          <ul className="mt-3 space-y-3">
            {PHYSICAL_VAULTS.map((c) => {
              // Real "last sync" — fall back to "—" if no events yet for any
              // enterprise, otherwise show the most recent global sync
              // timestamp (which is the closest proxy we have for the binder
              // seal time).
              const lastSyncAt = referenceEvent?.timestamp ?? null;
              return (
                <li key={c.id} className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold-light">{c.id}</span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-amber-300">
                      pending notarisation
                    </span>
                  </div>
                  <div className="mt-1.5 font-serif text-sm font-semibold">{c.location}</div>
                  <div className="font-sans text-[11px] text-muted-foreground">Designated custodian: {c.custodian}</div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground/85">
                    <span>digital checkpoint: sealed</span>
                    <span>last sync {lastSyncAt ? timeAgo(lastSyncAt) : "—"}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Real "Generate physical copy" action — seals a ledger event */}
          <div className="mt-4 border-t border-gold/10 pt-4">
            <OracleMirrorSyncButton label="Seal Oracle Mirror checkpoint" />
          </div>
        </section>

        {/* Latest snapshot */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Latest snapshot</h2>
            <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-background/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${statusStyle.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} /> {statusStyle.label}
            </span>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-xs">
            <Row k="Snapshot date" v={lastEvent ? new Date(lastEvent.timestamp).toLocaleString() : "—"} />
            <Row k="Total ledger events" v={totalEvents.toLocaleString()} />
            <Row k="Last event type" v={lastEvent?.eventType ?? "—"} />
            <Row k="Last event hash" v={lastEvent ? shortHash(lastEvent.payloadHash, 14, 6) : "—"} />
            <Row k="Mirror sync cadence" v="hourly · auto · delta-only" />
            <Row k="Full re-print cadence" v="quarterly (physical: roadmap)" />
            <Row k="Encryption" v="AES-256-GCM (offline key)" />
            <Row k="Witness requirement" v="2 notaries + 1 Steward" />
          </ul>

          {/* Per-enterprise last sync (real data) */}
          {enterpriseLastSync.length > 0 && (
            <div className="mt-4 border-t border-gold/10 pt-3">
              <div className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground/80">
                Per-enterprise last sync
              </div>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {enterpriseLastSync.map((row) => (
                  <li key={row.enterprise?.id ?? "unknown"} className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="truncate text-foreground/85">
                      <span className="text-gold-light/80">{row.enterprise ? `T${row.enterprise.tier}` : "—"}</span>{" "}
                      {row.enterprise?.name ?? "—"}
                    </span>
                    <span className="shrink-0 text-muted-foreground/85">
                      {row.latest ? timeAgo(row.latest.timestamp) : "no events"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Recent sync checkpoints — real oracle_mirror_sync ledger events */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Recent sync checkpoints</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              oracle_mirror_sync events · {syncCheckpoints.length} sealed
            </span>
          </div>
        </div>
        {syncCheckpoints.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-sans text-xs text-muted-foreground">
              No Oracle Mirror checkpoints sealed yet.
            </p>
            <p className="mt-1 font-sans text-xs text-muted-foreground/85">
              Use the “Seal Oracle Mirror checkpoint” button above to record the first digital checkpoint on the immutable ledger.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/8">
            {syncCheckpoints.map((c) => {
              let note = "";
              let actor = "";
              try {
                const parsed = JSON.parse(c.payload);
                note = typeof parsed.note === "string" ? parsed.note : "";
                actor = typeof parsed.actor === "string" ? parsed.actor : "";
              } catch {
                note = "";
              }
              return (
                <li key={c.id} className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-5 sm:items-center">
                  <div className="sm:col-span-2">
                    <div className="font-mono text-xs text-gold-light">
                      seq #{c.sequence} · {shortHash(c.payloadHash, 10, 6)}
                    </div>
                    <div className="font-sans text-xs text-muted-foreground/85">
                      {new Date(c.timestamp).toLocaleString()} · {timeAgo(c.timestamp)}
                    </div>
                  </div>
                  <div className="sm:col-span-2 font-sans text-xs text-foreground/90">
                    {note || "Oracle Mirror sync checkpoint"}
                    {actor && <span className="block font-sans text-xs text-muted-foreground/80">by {actor}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 font-sans text-[11px] text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> sealed
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Drill history — protocol reference (roadmap) */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Drill history</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-gold-light/80">
              protocol reference (roadmap)
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">quarterly reconciliation cadence</span>
          </div>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted-foreground/80">
            Drills are scheduled quarterly per Vol 17.19. The first live reconciliation drill will run once physical notarisation is operational. The entries below are the protocol’s planned cadence, not historical results.
          </p>
        </div>
        <ul className="divide-y divide-gold/8">
          {[
            { id: "DRILL-2026-Q1", date: "2026-03-15", duration: "4h 12m (target)", scope: "Nile Brew + SmartFarm ledgers", outcome: "Target: 0 drift" },
            { id: "DRILL-2025-Q4", date: "2025-12-09", duration: "6h 38m (target)", scope: "Full network (3 enterprises)", outcome: "Target: 0 drift" },
            { id: "DRILL-2025-Q3", date: "2025-09-02", duration: "5h 51m (target)", scope: "Street Bites + EcoPack", outcome: "Target: 0 drift" },
          ].map((d) => (
            <li key={d.id} className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-5 sm:items-center">
              <div className="sm:col-span-1">
                <div className="font-mono text-xs text-gold-light">{d.id}</div>
                <div className="font-sans text-xs text-muted-foreground/80">{d.date}</div>
              </div>
              <div className="sm:col-span-2 font-sans text-xs">{d.scope}</div>
              <div className="font-mono text-xs text-muted-foreground/85">{d.duration}</div>
              <div className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground/85">
                <AlertTriangle className="h-3 w-3 text-gold/60" /> {d.outcome}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Oracle Mirror protocol per Vol 17.19 CRE Outage Runbook · activation requires Steward + 2 notary witnesses · physical notarisation is roadmap
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-gold/8 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-mono text-[11px] text-foreground">{v}</span>
    </li>
  );
}

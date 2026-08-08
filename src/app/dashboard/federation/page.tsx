import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import {
  Globe,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Handshake,
  Vote,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Federation Protocol · AURIENTA",
  description:
    "Health-Rating-Share federation protocol, member roster, and inter-network capital flows between AURIENTA-compatible sovereign platforms.",
};

// Mock federation members — in production these are real AURIENTA-compatible networks.
const MEMBERS = [
  { id: "FED-AURI-EG", name: "AURIENTA Egypt", country: "Egypt", healthShare: 0.92, members: 1247, joinedAt: "2025-03-12", role: "Founding Steward" },
  { id: "FED-AURI-KE", name: "AURIENTA Kenya", country: "Kenya", healthShare: 0.78, members: 312, joinedAt: "2025-09-04", role: "Member" },
  { id: "FED-AURI-NG", name: "AURIENTA Nigeria", country: "Nigeria", healthShare: 0.74, members: 428, joinedAt: "2025-11-21", role: "Member" },
  { id: "FED-AURI-SA", name: "AURIENTA South Africa", country: "South Africa", healthShare: 0.81, members: 564, joinedAt: "2026-01-18", role: "Member" },
  { id: "FED-AURI-IN", name: "AURIENTA India", country: "India", healthShare: 0.69, members: 891, joinedAt: "2026-02-09", role: "Observer" },
];

// Mock federation proposals.
const PROPOSALS = [
  { id: "FED-P-014", title: "Adopt unified graduation reciprocity (cross-network)", votes: 4, total: 5, status: "voting_open", closesAt: "2026-07-04" },
  { id: "FED-P-013", title: "Increase Health-Rating-Share floor from 0.65 to 0.70", votes: 5, total: 5, status: "executed", closesAt: "2026-06-12" },
  { id: "FED-P-012", title: "Add AURIENTA India as Observer", votes: 4, total: 5, status: "executed", closesAt: "2026-02-09" },
];

export default async function FederationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/federation");

  // Domestic aggregate.
  const eg = await db.enterprise.aggregate({ _sum: { raisedEgp: true }, _count: true });
  const totalMembers = MEMBERS.reduce((s, m) => s + m.members, 0);
  const avgHealthShare = MEMBERS.reduce((s, m) => s + m.healthShare, 0) / MEMBERS.length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Federation Protocol"
        icon={Globe}
        title="A network of sovereign networks"
        subtitle="The Federation Protocol lets independent AURIENTA-compatible platforms in different jurisdictions share a common constitutional core while preserving local legal autonomy. Membership is gated on a Health-Rating-Share ≥0.70 — every network must operate to the same institutional standard."
      />

      {/* Federation KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Federation members" value={String(MEMBERS.length)} icon={Handshake} />
        <KPI label="Total partners" value={totalMembers.toLocaleString()} icon={Users} />
        <KPI label="Avg Health-Rating-Share" value={pct(avgHealthShare * 100, 1)} icon={ShieldCheck} ok={avgHealthShare >= 0.70} />
        <KPI label="Egypt network" value={eg._count.toString()} icon={TrendingUp} />
      </div>

      {/* Health-Rating-Share explainer */}
      <section className="rounded-2xl border border-gold/30 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Health-Rating-Share — the federation gate</h2>
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">
          Health-Rating-Share (HRS) is the weighted average of an entire network's enterprise health
          scores. A network must maintain HRS ≥ 0.70 to keep its federation seat. Below 0.65, the
          network enters a 90-day cure period; below 0.60, it is automatically suspended and its
          cross-network capital flows are paused. HRS is recomputed on every graduation event.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gold-gradient"
            style={{ width: `${avgHealthShare * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground/80">
          <span>floor 0.70</span>
          <span className="text-gold-light">network: {avgHealthShare.toFixed(3)}</span>
          <span>cure 0.65</span>
        </div>
      </section>

      {/* Members table */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Federation members</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">{MEMBERS.length} networks</span>
          </div>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="sticky top-0 z-10 bg-[#0c0c0f]/95 backdrop-blur">
              <tr className="border-b border-gold/12 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Network</th>
                <th className="px-4 py-2.5 font-medium">Country</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Partners</th>
                <th className="px-4 py-2.5 font-medium">HRS</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((m) => (
                <tr key={m.id} className="border-b border-gold/8 hover:bg-gold/[0.03]">
                  <td className="px-4 py-2.5">
                    <div className="font-serif text-sm font-medium">{m.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground/80">{m.id}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.country}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                      m.role === "Founding Steward"
                        ? "border-gold/40 bg-gold/15 text-gold-light"
                        : m.role === "Observer"
                        ? "border-gold/15 bg-foreground/5 text-muted-foreground"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    }`}>
                      {m.role === "Founding Steward" && <CheckCircle2 className="h-3 w-3" />}
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{m.members.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono ${m.healthShare >= 0.70 ? "text-emerald-300" : "text-amber-300"}`}>
                      {m.healthShare.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground/85">{m.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Federation proposals */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Vote className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Federation constitutional proposals</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">1 network · 1 vote</span>
          </div>
        </div>
        <ul className="divide-y divide-gold/8">
          {PROPOSALS.map((p) => (
            <li key={p.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gold-light">{p.id}</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                  p.status === "executed"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                }`}>
                  {p.status === "executed" ? <CheckCircle2 className="h-3 w-3" /> : <Vote className="h-3 w-3" />}
                  {p.status.replace("_", " ")}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                  {p.votes}/{p.total} votes · closes {p.closesAt}
                </span>
              </div>
              <p className="mt-1 font-sans text-sm">{p.title}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Federation protocol per Vol 19 · Health-Rating-Share gate · 1 network = 1 vote · cross-border capital via dual law-firm-client-account treaties
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${ok === false ? "text-rose-400" : "text-gold"}`} />
        {ok !== undefined && (ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <CheckCircle2 className="h-3 w-3 text-rose-400" />)}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AlumniCard } from "@/components/dashboard/institutional/alumni-card";
import { AlumniStats } from "@/components/dashboard/institutional/alumni-stats";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";
import { Award, GraduationCap } from "lucide-react";

export const metadata = { title: "Alumni Hall · AURIENTA" };

export default async function AlumniPage() {
  // Public, read-only directory of graduated sovereign enterprises.
  const records = await db.graduationRecord.findMany({
    orderBy: { graduationDate: "desc" },
  });

  // Map records to alumni cards. The first record is the "featured" alumni.
  const alumni = records.map((r, idx) => ({
    id: r.id,
    enterpriseName: r.enterpriseName,
    tierAtGraduation: r.tierAtGraduation,
    finalTier: r.tierAtGraduation,
    finalHealthScore: r.finalHealthScore,
    finalMaturityScore: r.finalMaturityScore,
    readinessScore: r.readinessScore,
    graduationDate: r.graduationDate,
    sovereignCert: r.sovereignCert,
    testimonial: r.testimonial,
    website: r.website,
    exportHash: r.exportHash,
    featured: idx === 0,
  }));

  // Aggregate stats
  const total = alumni.length;
  const avgReadiness = total > 0 ? alumni.reduce((s, a) => s + a.readinessScore, 0) / total : 0;
  const totalCapitalGraduatedEgp = total > 0 ? 250_000_000 : 0; // mock — based on SmartFarm raise
  const avgYearsToGraduation = total > 0 ? 2.6 : 0; // mock — typical from blueprint

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Alumni Hall"
        icon={Award}
        title="Enterprises that outgrew the platform."
        subtitle="Sovereign, certified, independent. Each alumni below cleared all six graduation gates, won a 75% supermajority vote, and assumed full authority over its own constitution, ledger, and CRE. They are the proof that dependency is transitional."
      />

      {total === 0 ? (
        <div className="rounded-2xl border border-gold/12 glass p-10 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-gold/40" />
          <p className="mt-4 font-serif text-lg font-semibold">No graduates yet</p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            The first sovereign enterprise will take its place in this hall on graduation.
          </p>
        </div>
      ) : (
        <>
          <AlumniStats
            total={total}
            avgReadiness={avgReadiness}
            totalCapitalGraduatedEgp={totalCapitalGraduatedEgp}
            avgYearsToGraduation={avgYearsToGraduation}
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {alumni.map((a) => (
              <AlumniCard key={a.id} a={a} />
            ))}
          </div>
        </>
      )}

      <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
            <Award className="h-4 w-4 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-base font-semibold">What alumni keep — and lose</h2>
            <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-muted-foreground">
              Alumni retain their immutable ledger history, sovereign certification, and inclusion in this public
              directory. They forfeit platform enforcement, board representation, and access to the AI risk overlay —
              unless they elect to self-host the CRE under their own constitution.
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/85">
              Once graduated, an enterprise cannot return to platform enforcement. The decision is final and
              constitutionally irreversible (Article VII §4).
            </p>
          </div>
        </div>
      </section>

      <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Directory anchored at {shortHash(CONSTITUTIONAL_HASH, 14, 6)} · read-only · any third party may verify
        alumni export signatures against the AURIENTA-published Ed25519 public key.
      </p>
    </div>
  );
}

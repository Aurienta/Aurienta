import * as React from "react";
import Link from "next/link";
import { Star, ExternalLink, BadgeCheck, ShieldCheck, FileCheck2, Quote } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";

type Alumni = {
  id: string;
  enterpriseName: string;
  tierAtGraduation: string;
  finalTier?: string | null;
  finalHealthScore: number;
  finalMaturityScore: number;
  readinessScore: number;
  graduationDate: Date;
  sovereignCert: boolean;
  testimonial: string | null;
  website: string | null;
  exportHash: string | null;
  featured?: boolean;
};

const COMPLIANCE_BADGES = [
  { icon: BadgeCheck, label: "Social Insurance Compliant" },
  { icon: ShieldCheck, label: "Police Clearance Verified" },
  { icon: FileCheck2, label: "Sovereign Survivability Certified" },
];

function ratingFromScore(s: number): string {
  if (s >= 95) return "AAA";
  if (s >= 90) return "AA";
  if (s >= 85) return "A";
  if (s >= 80) return "BBB";
  if (s >= 70) return "BB";
  return "B";
}

export function AlumniCard({ a }: { a: Alumni }) {
  const rating = ratingFromScore(a.finalHealthScore);
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-0.5 ${
        a.featured
          ? "border-gold/30 glass-gold gold-glow-sm"
          : "border-gold/12 glass hover:border-gold/25"
      }`}
    >
      {a.featured && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-black">
          <Star className="h-2.5 w-2.5 fill-black" /> Featured
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
          <GoldStar className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
            {a.enterpriseName}
          </h3>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/80">
            graduated {a.graduationDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Tier transition */}
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="rounded border border-gold/20 bg-gold/[0.04] px-2 py-0.5 text-muted-foreground">
          entered T{a.tierAtGraduation}
        </span>
        <span className="text-gold">→</span>
        <span className="rounded border border-emerald-400/25 bg-emerald-400/[0.06] px-2 py-0.5 font-semibold text-emerald-300">
          graduated T{a.finalTier ?? a.tierAtGraduation}
        </span>
      </div>

      {/* Scores grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Score label="Health" value={`${a.finalHealthScore}`} sub={rating} />
        <Score label="Maturity" value={`${a.finalMaturityScore}`} sub="/ 100" />
        <Score label="Readiness" value={`${a.readinessScore}`} sub="/ 100" />
      </div>

      {/* Compliance badges */}
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {COMPLIANCE_BADGES.map((b) => (
          <li
            key={b.label}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/[0.05] px-1.5 py-0.5 font-sans text-[11px] text-emerald-300/90"
          >
            <b.icon className="h-2.5 w-2.5" />
            {b.label}
          </li>
        ))}
      </ul>

      {/* Testimonial */}
      {a.testimonial && (
        <blockquote className="relative mt-4 rounded-xl border border-gold/10 bg-background/40 p-3.5">
          <Quote className="absolute -top-2 left-3 h-3.5 w-3.5 text-gold/40" />
          <p className="font-serif text-[13px] italic leading-relaxed text-foreground/85">
            “{a.testimonial}”
          </p>
        </blockquote>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-gold/8 pt-4">
        <span className="font-mono text-[11px] text-muted-foreground/85">
          {a.exportHash ? `export ${a.exportHash.slice(0, 16)}…` : "sovereign"}
        </span>
        {a.website && (
          <Link
            href={`https://${a.website.replace(/^https?:\/\//, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-xs text-gold/80 transition-colors hover:text-gold-light"
          >
            {a.website} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  );
}

function Score({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5 text-center">
      <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground/80">{label}</p>
      <p className="font-serif text-lg font-semibold text-gold-light">
        {value}
        {sub && <span className="ml-0.5 font-mono text-xs text-muted-foreground">{sub}</span>}
      </p>
    </div>
  );
}

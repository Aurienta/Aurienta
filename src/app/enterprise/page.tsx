import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Enterprise Directory · AURIENTA",
  description:
    "Browse every active AURIENTA constitutional enterprise — A–F tier, sector, tagline, and a one-line description. Each profile links to the full enterprise public profile.",
};

export const dynamic = "force-dynamic";

type DirectoryEntry = {
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  sector: string;
  tier: string;
  legalForm: string;
  status: string;
};

/**
 * Static fallback list — used only if the database is unreachable or
 * returns no enterprises. Mirrors the seed enterprises so the directory
 * always renders something useful.
 */
const FALLBACK_ENTERPRISES: DirectoryEntry[] = [
  {
    slug: "street-bites",
    name: "Street Bites",
    tagline: "Constitutional street food — Cairo's first token-free food network",
    description:
      "A Tier A microenterprise serving authentic Egyptian street food from three kiosks across Cairo. Founded by a first-time operator, it converts everyday capital into real-economy ownership — no speculation required.",
    sector: "food",
    tier: "A",
    legalForm: "LLC",
    status: "active",
  },
  {
    slug: "ecopack-solutions",
    name: "EcoPack Solutions",
    tagline: "Sustainable packaging for a sovereign Egyptian supply chain",
    description:
      "A Tier C growth enterprise producing compostable packaging for Egyptian retailers. ERP-integrated, AI-valued, governed by constitutional consensus — on the path to sovereign graduation.",
    sector: "manufacturing",
    tier: "C",
    legalForm: "LLC",
    status: "active",
  },
  {
    slug: "nile-brew-cafe",
    name: "Nile Brew Café",
    tagline: "Specialty coffee chain — graduated to sovereign operation",
    description:
      "A Tier D established café chain that expanded across Cairo and Alexandria. Now in Stage 3 Institutional Independence with a readiness score of 96 — preparing for the graduation vote.",
    sector: "retail",
    tier: "D",
    legalForm: "LLC",
    status: "graduation_pending",
  },
  {
    slug: "smartfarm-egypt",
    name: "SmartFarm Egypt",
    tagline: "AI-irrigated agriculture — from Tier C to a sovereign EGX listing",
    description:
      "An agritech enterprise combining weather-indexed milestones with AI irrigation algorithms. Graduated to sovereign independence, then converted to a Tier F Joint Stock Company preparing for EGX listing.",
    sector: "agriculture",
    tier: "F",
    legalForm: "JSC",
    status: "graduated",
  },
];

function tierColor(tier: string): string {
  switch (tier) {
    case "A":
    case "B":
      return "border-emerald-400/40 text-emerald-300 bg-emerald-400/5";
    case "C":
      return "border-gold/40 text-gold-light bg-gold/5";
    case "D":
    case "E":
      return "border-amber-400/40 text-amber-300 bg-amber-400/5";
    case "F":
      return "border-fuchsia-400/30 text-fuchsia-300 bg-fuchsia-400/5";
    default:
      return "border-muted-foreground/30 text-muted-foreground";
  }
}

function statusColor(status: string): string {
  if (status === "graduated") return "border-emerald-400/40 text-emerald-300 bg-emerald-400/5";
  if (status === "frozen") return "border-red-400/40 text-red-300 bg-red-400/5";
  if (status === "fundraising_active") return "border-gold/40 text-gold-light bg-gold/5";
  if (status === "graduation_pending") return "border-amber-400/40 text-amber-300 bg-amber-400/5";
  return "border-muted-foreground/30 text-muted-foreground";
}

function pretty(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

async function loadEnterprises(): Promise<{ entries: DirectoryEntry[]; usedFallback: boolean }> {
  try {
    const rows = await db.enterprise.findMany({
      where: { archivedAt: null, status: { not: "draft" } },
      select: {
        slug: true,
        name: true,
        tagline: true,
        description: true,
        sector: true,
        tier: true,
        legalForm: true,
        status: true,
      },
      orderBy: [{ tier: "asc" }, { createdAt: "desc" }],
      take: 60,
    });
    if (rows.length === 0) {
      return { entries: FALLBACK_ENTERPRISES, usedFallback: true };
    }
    return { entries: rows, usedFallback: false };
  } catch {
    // Database unreachable — render the static fallback list so the page
    // still works in degraded environments (e.g. preview deployments
    // without the database configured).
    return { entries: FALLBACK_ENTERPRISES, usedFallback: true };
  }
}

export default async function EnterpriseDirectoryPage() {
  const { entries, usedFallback } = await loadEnterprises();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicTrustHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Page header */}
          <section className="relative overflow-hidden rounded-3xl border border-gold/15 glass-gold p-6 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <AurientaMark className="h-8 w-8" />
                <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                  Constitutional Enterprise Directory
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <GoldStar className="h-5 w-5" />
                <h1 className="font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">
                  Enterprises on AURIENTA
                </h1>
              </div>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                Every active constitutional enterprise on AURIENTA, from Tier A microenterprises
                to Tier F Joint Stock Companies preparing for EGX listing. Each entry is a
                real-economy company governed by the Constitutional Runtime Engine — never a
                speculative token, never a custody arrangement.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground/85">
                <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                  Enterprises: <span className="text-gold-light">{entries.length}</span>
                </span>
                <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                  Tiers: <span className="text-gold-light">A&ndash;F</span>
                </span>
                <Link
                  href="/registry"
                  className="rounded-full border border-gold/20 bg-background/50 px-3 py-1.5 text-gold-light/85 transition-colors hover:bg-gold/5"
                >
                  Full Constitutional Registry →
                </Link>
              </div>

              {usedFallback && (
                <p className="mt-3 font-sans text-xs text-amber-300/80" role="note">
                  Showing the curated demo directory — the live database is unreachable from this
                  environment. Visit the public registry for the live, ledger-anchored list.
                </p>
              )}
            </div>
          </section>

          {/* Enterprise grid */}
          <section className="mt-8" aria-label="Enterprises">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((e) => (
                <Card
                  key={e.slug}
                  className="group relative border-gold/15 bg-card/60 backdrop-blur-sm transition-all hover:border-gold/30 hover:shadow-[0_8px_30px_-12px_rgba(212,175,55,0.4)]"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground/85">
                          <span className="font-serif text-sm font-bold text-gold-gradient">
                            Tier {e.tier}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{e.legalForm}</span>
                          <span aria-hidden>·</span>
                          <span className="capitalize">{e.sector}</span>
                        </div>
                        <CardTitle className="mt-1.5 font-serif text-lg font-semibold leading-tight text-foreground group-hover:text-gold-light">
                          {e.name}
                        </CardTitle>
                        {e.tagline && (
                          <CardDescription className="mt-1 line-clamp-1 text-xs">
                            {e.tagline}
                          </CardDescription>
                        )}
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${statusColor(e.status)}`}
                      >
                        {pretty(e.status)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 font-sans text-sm leading-relaxed text-muted-foreground/90">
                      {e.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`font-mono ${tierColor(e.tier)}`}
                      >
                        Tier {e.tier}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        <Building2 className="mr-1 h-3 w-3" />
                        {pretty(e.sector)}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        <Layers className="mr-1 h-3 w-3" />
                        {e.legalForm}
                      </Badge>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full border-gold/25 text-foreground hover:bg-gold/5 hover:text-gold-light"
                    >
                      <Link href={`/enterprise/${e.slug}`}>
                        View enterprise
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

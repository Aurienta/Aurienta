"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2, Banknote, Landmark, Factory, TrendingUp, Scale,
  Wallet, FileText, LineChart, Map, Search, Loader2, Database,
  Users, HardHat, Globe, ShieldCheck, Activity,
} from "lucide-react";

type Dataset =
  | "overview" | "sectors" | "governorates" | "projects"
  | "regulatory" | "banks" | "benchmarks" | "salary-bands"
  | "legal-forms" | "fx-history" | "macro";

const DATASET_LABELS: Record<Dataset, string> = {
  overview: "Overview",
  sectors: "Sectors (36)",
  governorates: "Governorates (27)",
  projects: "National Projects (20)",
  regulatory: "Regulatory Bodies (32)",
  banks: "Banks (31)",
  benchmarks: "Feasibility Benchmarks (36)",
  "salary-bands": "Salary Bands (780)",
  "legal-forms": "Legal Forms (15)",
  "fx-history": "FX History (120)",
  macro: "Macro Live (FRED)",
};

const DATASET_ICONS: Record<Dataset, React.ComponentType<{ className?: string }>> = {
  overview: Database,
  sectors: Factory,
  governorates: Map,
  projects: HardHat,
  regulatory: Landmark,
  banks: Banknote,
  benchmarks: TrendingUp,
  "salary-bands": Wallet,
  "legal-forms": Scale,
  "fx-history": LineChart,
  macro: Activity,
};

interface OverviewData {
  service: string;
  version: string;
  description: string;
  datasets: Record<string, { count: number; stats: Record<string, unknown>; endpoint: string }>;
  totalRecords: number;
  sources: string[];
  lastUpdated: string;
}

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatEgp(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return `${formatNumber(n)} EGP`;
}

export default function EgyptMarketPage() {
  const [dataset, setDataset] = useState<Dataset>("overview");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setData(null);
    // Macro indicators live on a separate endpoint (FRED-backed, live data)
    const url = dataset === "macro"
      ? "/api/v1/macro"
      : `/api/v1/egypt?dataset=${dataset}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [dataset]);

  const filtered = useMemo(() => {
    if (!search || !data) return data;
    const term = search.toLowerCase();
    const json = JSON.stringify(data).toLowerCase();
    if (!json.includes(term)) return data; // return original if no match
    // Filter arrays in the data
    if (Array.isArray((data as Record<string, unknown>)[getArrayKey(dataset)])) {
      const arr = (data as Record<string, unknown>)[getArrayKey(dataset)] as Record<string, unknown>[];
      const filteredArr = arr.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(term)
      );
      return { ...(data as Record<string, unknown>), [getArrayKey(dataset)]: filteredArr, count: filteredArr.length };
    }
    return data;
  }, [data, search, dataset]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Egyptian Market Reference Database</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive reference data for the Egyptian market — 9 databases, 1,100+ records covering sectors, governorates,
            national projects, regulatory bodies, banks, feasibility benchmarks, salary bands, legal forms, and FX history.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline"><ShieldCheck className="w-3 h-3 mr-1" /> Public Reference Data</Badge>
            <Badge variant="secondary">CAPMAS</Badge>
            <Badge variant="secondary">GAFI</Badge>
            <Badge variant="secondary">CBE</Badge>
            <Badge variant="secondary">FRA</Badge>
            <Badge variant="secondary">NUCA</Badge>
          </div>
        </header>

        {/* Dataset Selector Tabs */}
        <Tabs value={dataset} onValueChange={(v) => setDataset(v as Dataset)} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto flex-wrap">
              {(Object.keys(DATASET_LABELS) as Dataset[]).map((ds) => {
                const Icon = DATASET_ICONS[ds];
                return (
                  <TabsTrigger key={ds} value={ds} className="gap-1.5 py-2">
                    <Icon className="w-3.5 h-3.5" />
                    {DATASET_LABELS[ds]}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Search bar (hide on overview) */}
          {dataset !== "overview" && (
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${DATASET_LABELS[dataset]}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <TabsContent value={dataset} className="mt-4">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {!loading && data && dataset === "overview" && (
              <OverviewView data={data as OverviewData} onNavigate={setDataset} />
            )}

            {!loading && filtered && dataset === "sectors" && (
              <SectorsView data={filtered as { sectors: Sector[]; count: number; stats: Record<string, unknown> }} />
            )}

            {!loading && filtered && dataset === "governorates" && (
              <GovernoratesView data={filtered as { governorates: Governorate[]; count: number }} />
            )}

            {!loading && filtered && dataset === "projects" && (
              <ProjectsView data={filtered as { projects: NationalProject[]; count: number }} />
            )}

            {!loading && filtered && dataset === "regulatory" && (
              <RegulatoryView data={filtered as { bodies: RegulatoryBody[]; count: number }} />
            )}

            {!loading && filtered && dataset === "banks" && (
              <BanksView data={filtered as { banks: Bank[]; count: number }} />
            )}

            {!loading && filtered && dataset === "benchmarks" && (
              <BenchmarksView data={filtered as { benchmarks: Benchmark[]; count: number }} />
            )}

            {!loading && filtered && dataset === "salary-bands" && (
              <SalaryBandsView data={filtered as { bands: SalaryBand[]; count: number }} />
            )}

            {!loading && filtered && dataset === "legal-forms" && (
              <LegalFormsView data={filtered as { legalForms: LegalForm[]; count: number }} />
            )}

            {!loading && filtered && dataset === "fx-history" && (
              <FxHistoryView data={filtered as { rates: FxRate[]; count: number }} />
            )}

            {!loading && filtered && dataset === "macro" && (
              <MacroView data={filtered as { indicators: MacroIndicator[]; count: number; configured: boolean; source?: string }} />
            )}
          </TabsContent>
        </Tabs>

        <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Data Sources:</strong> CAPMAS, GAFI, CBE, FRA, NUCA, IDA, SCZone, NTRA, NREA, EMRA, EEAA, NFSA, EDA, Ministry of Planning — Egypt Vision 2030.
          </p>
          <p>
            All data is publicly available from official Egyptian sources. AURIENTA aggregates for enterprise feasibility analysis.
            <span className="ml-1">Not investment advice.</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

function getArrayKey(dataset: Dataset): string {
  const map: Record<Dataset, string> = {
    overview: "",
    sectors: "sectors",
    governorates: "governorates",
    projects: "projects",
    regulatory: "bodies",
    banks: "banks",
    benchmarks: "benchmarks",
    "salary-bands": "bands",
    "legal-forms": "legalForms",
    "fx-history": "rates",
    macro: "indicators",
  };
  return map[dataset];
}

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewView({ data, onNavigate }: { data: OverviewData; onNavigate: (d: Dataset) => void }) {
  const datasetKeys = Object.keys(data.datasets) as Dataset[];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            {data.service} <span className="text-sm font-normal text-muted-foreground">v{data.version}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{data.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Datasets" value="9" icon={Database} />
            <Stat label="Total Records" value={data.totalRecords.toLocaleString()} icon={FileText} />
            <Stat label="Data Sources" value={data.sources.length.toString()} icon={Landmark} />
            <Stat label="Last Updated" value={new Date(data.lastUpdated).toLocaleDateString()} icon={TrendingUp} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasetKeys.map((ds) => {
          const info = data.datasets[ds];
          const Icon = DATASET_ICONS[ds] ?? Database;
          if (!info) return null;
          return (
            <Card key={ds} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {DATASET_LABELS[ds]}
                  </span>
                  <Badge variant="secondary">{info.count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate(ds)}
                >
                  Browse {DATASET_LABELS[ds]}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Official Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((source) => (
              <Badge key={source} variant="outline">{source}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

// ── Sectors ──────────────────────────────────────────────────────────────

interface Sector {
  id: string; nameEn: string; nameAr: string; code: string; isicDivision: string;
  egxSector: string; gafiCode: string; tierEligibility: string[];
  regulatoryBody: string; riskProfile: string; capitalIntensity: string;
  avgEnterpriseSizeEgp: number; vision2030Priority: string; description: string;
  examples: string[];
}

function SectorsView({ data }: { data: { sectors: Sector[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} sectors</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.sectors.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{s.nameEn}</span>
                <Badge variant="secondary">ISIC {s.code}</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{s.nameAr}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {s.tierEligibility.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">Tier {t}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Risk:</span> {s.riskProfile}</div>
                <div><span className="text-muted-foreground">Capital:</span> {s.capitalIntensity}</div>
                <div><span className="text-muted-foreground">Avg size:</span> {formatEgp(s.avgEnterpriseSizeEgp)}</div>
                <div><span className="text-muted-foreground">Vision 2030:</span> {s.vision2030Priority}</div>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Regulator:</span> {s.regulatoryBody}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Governorates ─────────────────────────────────────────────────────────

interface Governorate {
  id: string; nameEn: string; nameAr: string; capitalEn: string;
  region: string; population: number; areaKm2: number; gdpSharePct: number;
  keyIndustries: string[]; regionalAdjustment: number;
  specialEconomicZones: string[]; universities: number;
  ports: string[]; airports: string[];
}

function GovernoratesView({ data }: { data: { governorates: Governorate[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} governorates</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.governorates.map((g) => (
          <Card key={g.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{g.nameEn}</span>
                <Badge variant="secondary">{g.region}</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{g.nameAr} — {g.capitalEn}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Population:</span> {formatNumber(g.population)}</div>
                <div><span className="text-muted-foreground">Area:</span> {formatNumber(g.areaKm2)} km²</div>
                <div><span className="text-muted-foreground">GDP share:</span> {g.gdpSharePct}%</div>
                <div><span className="text-muted-foreground">Salary adj:</span> ×{g.regionalAdjustment}</div>
                <div><span className="text-muted-foreground">Universities:</span> {g.universities}</div>
                <div><span className="text-muted-foreground">SEZs:</span> {g.specialEconomicZones.length}</div>
              </div>
              {g.keyIndustries.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Industries:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.keyIndustries.slice(0, 4).map((ind) => (
                      <Badge key={ind} variant="outline" className="text-[10px]">{ind}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(g.ports.length > 0 || g.airports.length > 0) && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Transport:</span> {g.ports.length} ports, {g.airports.length} airports
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── National Projects ────────────────────────────────────────────────────

interface NationalProject {
  id: string; nameEn: string; nameAr: string; category: string;
  status: string; totalInvestmentEgp: number; foreignInvestmentUsd?: number;
  location: string; leadEntity: string; enterpriseOpportunities: string[];
  description: string;
}

function ProjectsView({ data }: { data: { projects: NationalProject[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {data.count} projects — Total investment:{" "}
        {formatEgp(data.projects.reduce((s, p) => s + p.totalInvestmentEgp, 0))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.projects.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{p.nameEn}</span>
                <Badge variant={p.status === "operational" ? "default" : p.status === "completed" ? "secondary" : "outline"}>
                  {p.status.replace("_", " ")}
                </Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{p.nameAr}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Investment:</span> {formatEgp(p.totalInvestmentEgp)}</div>
                {p.foreignInvestmentUsd ? (
                  <div><span className="text-muted-foreground">Foreign:</span> ${formatNumber(p.foreignInvestmentUsd)}</div>
                ) : null}
                <div><span className="text-muted-foreground">Location:</span> {p.location}</div>
                <div><span className="text-muted-foreground">Category:</span> {p.category}</div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="text-xs">
                <span className="text-muted-foreground">Lead:</span> {p.leadEntity}
              </div>
              {p.enterpriseOpportunities.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Enterprise opportunities:</span>
                  <ScrollArea className="h-20 mt-1">
                    <ul className="space-y-0.5">
                      {p.enterpriseOpportunities.slice(0, 5).map((opp, i) => (
                        <li key={i} className="text-[10px]">• {opp}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Regulatory Bodies ────────────────────────────────────────────────────

interface RegulatoryBody {
  id: string; nameEn: string; nameAr: string; acronym: string;
  type: string; sector: string; mandate: string; website: string;
  requiredForTiers: string[]; registrationRequired: boolean;
  complianceFrequency: string; aurentaIntegration: string;
  relatedLaws: string[]; digitalServicesAvailable: boolean;
}

function RegulatoryView({ data }: { data: { bodies: RegulatoryBody[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} regulatory bodies</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.bodies.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{b.acronym}</span>
                <Badge variant="secondary">{b.type}</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{b.nameEn}</div>
              <div className="text-xs text-muted-foreground">{b.nameAr}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{b.mandate}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Required:</span>{" "}
                  {b.registrationRequired ? "Yes" : "Optional"}
                </div>
                <div>
                  <span className="text-muted-foreground">Digital:</span>{" "}
                  {b.digitalServicesAvailable ? "✓" : "✗"}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Frequency:</span> {b.complianceFrequency}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {b.requiredForTiers.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
              {b.relatedLaws.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Laws:</span> {b.relatedLaws.slice(0, 2).join(", ")}
                </div>
              )}
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Visit website →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Banks ────────────────────────────────────────────────────────────────

interface Bank {
  id: string; nameEn: string; nameAr: string; acronym: string;
  type: string; totalAssetsEgpBn: number; branchesCount: number;
  atmsCount: number; ownership: string; establishedYear: number;
  headquarters: string; isIslamic: boolean;
  aurentaRole: string; smeProgramsAvailable: boolean;
  digitalBankingAvailable: boolean;
}

function BanksView({ data }: { data: { banks: Bank[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {data.count} banks — Total assets: {formatNumber(data.banks.reduce((s, b) => s + b.totalAssetsEgpBn, 0))} EGP Bn
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.banks.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{b.acronym}</span>
                {b.isIslamic && <Badge variant="secondary">Islamic</Badge>}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{b.nameEn}</div>
              <div className="text-xs text-muted-foreground">{b.nameAr}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Type:</span> {b.type.replace(/_/g, " ")}</div>
                <div><span className="text-muted-foreground">Est.:</span> {b.establishedYear}</div>
                <div><span className="text-muted-foreground">Assets:</span> {formatNumber(b.totalAssetsEgpBn)} Bn EGP</div>
                <div><span className="text-muted-foreground">HQ:</span> {b.headquarters}</div>
                <div><span className="text-muted-foreground">Branches:</span> {b.branchesCount}</div>
                <div><span className="text-muted-foreground">ATMs:</span> {b.atmsCount}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{b.ownership}</Badge>
                <Badge variant="outline" className="text-[10px]">{b.aurentaRole.replace(/_/g, " ")}</Badge>
                {b.smeProgramsAvailable && <Badge variant="outline" className="text-[10px]">SME</Badge>}
                {b.digitalBankingAvailable && <Badge variant="outline" className="text-[10px]">Digital</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Feasibility Benchmarks ────────────────────────────────────────────────

interface Benchmark {
  sectorId: string; sectorName: string;
  avgGrossMarginPct: number; avgNetMarginPct: number;
  avgPaybackYears: number; avgRoiPct: number; breakevenMonths: number;
  startupCapitalMinEgp: number; startupCapitalMaxEgp: number;
  marketSizeEgpBn: number; marketGrowthPct: number;
  keyCostDrivers: string[]; keyRevenueDrivers: string[]; keyRisks: string[];
}

function BenchmarksView({ data }: { data: { benchmarks: Benchmark[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} sector benchmarks</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Sector</th>
              <th className="text-right p-2">Gross Margin</th>
              <th className="text-right p-2">Net Margin</th>
              <th className="text-right p-2">ROI</th>
              <th className="text-right p-2">Payback</th>
              <th className="text-right p-2">Breakeven</th>
              <th className="text-right p-2">Market Size</th>
              <th className="text-right p-2">Growth</th>
              <th className="text-right p-2">Startup Cap</th>
            </tr>
          </thead>
          <tbody>
            {data.benchmarks.map((b) => (
              <tr key={b.sectorId} className="border-b hover:bg-muted/50">
                <td className="p-2 font-medium">{b.sectorName}</td>
                <td className="text-right p-2">{b.avgGrossMarginPct.toFixed(1)}%</td>
                <td className="text-right p-2">{b.avgNetMarginPct.toFixed(1)}%</td>
                <td className="text-right p-2">
                  <span className={b.avgRoiPct >= 20 ? "text-green-600 font-medium" : ""}>
                    {b.avgRoiPct.toFixed(1)}%
                  </span>
                </td>
                <td className="text-right p-2">{b.avgPaybackYears.toFixed(1)}y</td>
                <td className="text-right p-2">{b.breakevenMonths}mo</td>
                <td className="text-right p-2">{formatNumber(b.marketSizeEgpBn)} Bn</td>
                <td className="text-right p-2">
                  <span className={b.marketGrowthPct >= 10 ? "text-green-600" : ""}>
                    {b.marketGrowthPct.toFixed(1)}%
                  </span>
                </td>
                <td className="text-right p-2 text-xs">
                  {formatEgp(b.startupCapitalMinEgp)} — {formatEgp(b.startupCapitalMaxEgp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Salary Bands ─────────────────────────────────────────────────────────

interface SalaryBand {
  sectorId: string; positionCode: string; positionEn: string;
  role: string; region: string; tier: string;
  minSalaryEgp: number; medianSalaryEgp: number; maxSalaryEgp: number;
  benefitsPct: number; bonusPct: number; equityPct: number;
}

function SalaryBandsView({ data }: { data: { bands: SalaryBand[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} salary bands (showing first 100)</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Position</th>
              <th className="text-left p-2">Sector</th>
              <th className="text-left p-2">Region</th>
              <th className="text-center p-2">Tier</th>
              <th className="text-right p-2">Min (EGP)</th>
              <th className="text-right p-2">Median (EGP)</th>
              <th className="text-right p-2">Max (EGP)</th>
              <th className="text-right p-2">Bonus</th>
              <th className="text-right p-2">Equity</th>
            </tr>
          </thead>
          <tbody>
            {data.bands.slice(0, 100).map((b, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                <td className="p-2">{b.positionEn}</td>
                <td className="p-2 text-xs text-muted-foreground">{b.sectorId}</td>
                <td className="p-2 text-xs">{b.region}</td>
                <td className="text-center p-2"><Badge variant="outline" className="text-xs">{b.tier}</Badge></td>
                <td className="text-right p-2">{formatNumber(b.minSalaryEgp)}</td>
                <td className="text-right p-2 font-medium">{formatNumber(b.medianSalaryEgp)}</td>
                <td className="text-right p-2">{formatNumber(b.maxSalaryEgp)}</td>
                <td className="text-right p-2 text-xs">{b.bonusPct}%</td>
                <td className="text-right p-2 text-xs">{b.equityPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Legal Forms ─────────────────────────────────────────────────────────

interface LegalForm {
  id: string; nameEn: string; nameAr: string; lawRef: string;
  aurentaTier: string[]; minCapitalEgp: number;
  minShareholders: number; liabilityType: string;
  canGoPublic: boolean; requiresAuditor: boolean;
  taxRate: number; registrationFeeEgp: number;
  description: string;
}

function LegalFormsView({ data }: { data: { legalForms: LegalForm[]; count: number } }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{data.count} legal entity types</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.legalForms.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{f.nameEn}</span>
                <div className="flex gap-1">
                  {f.aurentaTier.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </CardTitle>
              <div className="text-sm text-muted-foreground">{f.nameAr}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">{f.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Min capital:</span> {formatEgp(f.minCapitalEgp)}</div>
                <div><span className="text-muted-foreground">Shareholders:</span> {f.minShareholders}+</div>
                <div><span className="text-muted-foreground">Liability:</span> {f.liabilityType}</div>
                <div><span className="text-muted-foreground">Tax rate:</span> {f.taxRate}%</div>
                <div><span className="text-muted-foreground">Reg. fee:</span> {formatEgp(f.registrationFeeEgp)}</div>
                <div><span className="text-muted-foreground">Auditor:</span> {f.requiresAuditor ? "Required" : "Optional"}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {f.canGoPublic && <Badge variant="secondary" className="text-[10px]">EGX eligible</Badge>}
                <Badge variant="outline" className="text-[10px]">{f.lawRef}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── FxHistoryView is defined above; MacroView below ────────────────────

interface MacroIndicator {
  seriesId: string;
  date: string;
  value: number;
  name: string;
  category: "egypt" | "us_rates" | "us_inflation" | "us_labor";
  unit: string;
  frequency: string;
  description: string;
  higherIsBetter?: boolean;
  fetchedAt: string;
}

function formatMacroValue(v: number, unit: string): string {
  if (unit === "US$") {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toFixed(2)}`;
  }
  if (unit === "persons") {
    return `${(v / 1e6).toFixed(2)}M`;
  }
  if (unit === "index") {
    return v.toFixed(3);
  }
  return v.toFixed(2);
}

const MACRO_CATEGORY_META: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  egypt: {
    title: "Egypt Macro Indicators",
    icon: Globe,
    description: "IMF/World Bank data via FRED — annual. Context for feasibility studies, pricing, and market sizing.",
  },
  us_rates: {
    title: "US Interest Rates (EGP Drivers)",
    icon: Landmark,
    description: "The Fed's policy rate and the 10Y treasury. Higher US rates pull capital out of emerging markets like Egypt, pressuring EGP.",
  },
  us_inflation: {
    title: "US Inflation",
    icon: TrendingUp,
    description: "US inflation drives Fed policy and USD strength — the anchor for global pricing.",
  },
  us_labor: {
    title: "US Labor Market",
    icon: Users,
    description: "Strong US labor = hawkish Fed = EGP pressure.",
  },
};

function MacroView({ data }: { data: { indicators: MacroIndicator[]; count: number; configured: boolean; source?: string } }) {
  if (!data.configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">FRED_API_KEY not configured. Add it to .env to enable live macro indicators.</p>
        </CardContent>
      </Card>
    );
  }

  const categories = Array.from(new Set(data.indicators.map((i) => i.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          {data.count} live indicators · <Badge variant="secondary" className="ml-1">LIVE</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Source: {data.source ?? "St. Louis Fed FRED API"} · Cached 60 min
        </div>
      </div>

      {categories.map((cat) => {
        const meta = MACRO_CATEGORY_META[cat] ?? { title: cat, icon: Activity, description: "" };
        const Icon = meta.icon;
        const items = data.indicators.filter((i) => i.category === cat);
        return (
          <Card key={cat}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="w-5 h-5 text-primary" />
                {meta.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((ind) => (
                  <div key={ind.seriesId} className="p-4 rounded-lg border bg-muted/30 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium leading-tight">{ind.name}</div>
                      <Activity className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatMacroValue(ind.value, ind.unit)}
                      {ind.unit === "%" && <span className="text-base font-normal text-muted-foreground ml-0.5">%</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(ind.date).toLocaleDateString()} · {ind.frequency}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">{ind.description}</p>
                    <a
                      href={`https://fred.stlouisfed.org/series/${ind.seriesId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      FRED: {ind.seriesId} →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── FX History ──────────────────────────────────────────────────────────

interface FxRate {
  date: string; pair: string; from: string; to: string;
  rate: number; source: string;
}

function FxHistoryView({ data }: { data: { rates: FxRate[]; count: number } }) {
  const pairs = Array.from(new Set(data.rates.map((r) => r.pair)));
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {data.count} FX rate snapshots — {pairs.length} pairs
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Pair</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-left p-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.rates.slice(0, 100).map((r, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                <td className="p-2">{r.date}</td>
                <td className="p-2 font-mono">{r.pair}</td>
                <td className="text-right p-2 font-medium">{r.rate.toFixed(4)}</td>
                <td className="p-2 text-xs text-muted-foreground uppercase">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

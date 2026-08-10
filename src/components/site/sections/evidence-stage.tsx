import { GoldStar } from "@/components/aurienta-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, FileCheck } from "lucide-react";

const BUILT = [
  "25 CRE enforcement functions — all wired and operational",
  "Zero Custody architecture (Amendment IX) — funds never held by AURIENTA",
  "7-stage Constitutional Project Evaluation Engine (Feasibility Score 0-100)",
  "AI Salary Engine with board override and transparency controls",
  "FIFO matching engine for the constitutional secondary market",
  "NOSI 30/60-day enforcement with expense freeze",
  "Salary-to-Equity conversion (10% max, 15% discount, 12-month lock-up)",
  "Graduation export API for sovereign independence",
  "Anti-Fragility Insurance Vault (0.5% contribution, interest-free loans)",
  "Proof-of-Solvency with 3-level health flags",
  "Role-aware transparency (salary bands vs exact salary)",
  "Bilingual legal disclaimer with evidentiary acceptance record",
];

const VALIDATING = [
  "FRA regulatory classification (technology infrastructure, not financial activity)",
  "GAFI API integration for commercial registration verification",
  "NOSI API integration for social insurance verification",
  "Law firm partnership for client account infrastructure",
  "First real Egyptian enterprise pilot",
];

const REMAINING = [
  "First real founder conversation and enterprise submission",
  "Legal opinion on FRA classification and securities exemption",
  "Law firm engagement for client account operations",
  "First measured outcome (E7) from a real enterprise",
  "First collected revenue (E8) from platform fees",
  "Repeatable enterprise creation process (E9)",
];

export function EvidenceStage() {
  return (
    <section id="evidence-stage" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="border-gold/30 text-gold mb-4">
            <GoldStar className="mr-1 h-3 w-3" />
            HONEST STATUS
          </Badge>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Evidence & Development Stage
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            AURIENTA is founder-led, under active development, and has not yet served its first real enterprise.
            We do not fabricate traction, customers, partners, or regulatory approvals.
          </p>
        </div>

        {/* Evidence level badge */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/[0.03] px-6 py-3">
            <FileCheck className="h-5 w-5 text-gold" />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Evidence Level</div>
              <div className="font-serif text-lg text-foreground">E1 — Market Hypothesis</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* What has been built */}
          <Card className="border-green-500/20 bg-green-500/[0.02]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-serif text-lg font-semibold text-foreground">What has been built</h3>
              </div>
              <ul className="space-y-2">
                {BUILT.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What is being validated */}
          <Card className="border-amber-500/20 bg-amber-500/[0.02]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-serif text-lg font-semibold text-foreground">What is being validated</h3>
              </div>
              <ul className="space-y-2">
                {VALIDATING.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What remains to be proven */}
          <Card className="border-gold/20 bg-gold/[0.02]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gold" />
                <h3 className="font-serif text-lg font-semibold text-foreground">What remains to be proven</h3>
              </div>
              <ul className="space-y-2">
                {REMAINING.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Evidence hierarchy explanation */}
        <div className="mt-8 rounded-lg border border-border/40 bg-muted/20 p-6">
          <p className="text-center text-xs text-muted-foreground">
            AURIENTA uses an E0-E9 evidence hierarchy.{" "}
            <span className="font-medium text-foreground">E0</span> = founder assumption →{" "}
            <span className="font-medium text-foreground">E5</span> = signed agreement →{" "}
            <span className="font-medium text-foreground">E7</span> = measured outcome →{" "}
            <span className="font-medium text-foreground">E9</span> = repeatable outcome.{" "}
            We are currently at <span className="font-semibold text-gold">E1</span> — market hypothesis.
            No claim on this platform exceeds its evidence level.
          </p>
        </div>
      </div>
    </section>
  );
}

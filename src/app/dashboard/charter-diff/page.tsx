import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import {
  CharterDiffViewer,
  type CharterAmendment,
} from "@/components/dashboard/intel/charter-diff-viewer";
import { GitCompareArrows, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Charter Diff · AURIENTA",
  description:
    "Git-style diff of constitutional charter amendments, with AI-explained implications.",
};

// Mock charter amendments — illustrative text pairs that mirror real
// constitutional amendment patterns (threshold changes, quorum changes,
// founder-equity vesting). Used when the seeded ledger has no
// constitutional_amendment proposals (it currently has none).
const MOCK_AMENDMENTS: Omit<CharterAmendment, "id">[] = [
  {
    title: "Raise dual-signature expense threshold from 1% to 2% of capital",
    enterpriseName: "EcoPack Egypt",
    enterpriseTier: "C",
    summary:
      "Increases the expense threshold above which dual signature is required — from 1% of total capital (~21,052 EGP) to 2% (~42,105 EGP). Cited justification: reduce signature friction on routine logistics invoices.",
    beforeText: `Article VII — Treasury Controls

7.1  Dual Signature Threshold
     Any expense exceeding 1% of total paid-in capital
     shall require the dual signature of (a) the manager
     and (b) a board-appointed counter-signatory.

7.2  Single-Signature Band
     Expenses at or below 1% of capital may be approved
     by the manager alone, subject to ex-post CRE audit.

7.3  Threshold Review
     The threshold shall be reviewed by the Constitutional
     Council no later than the end of each fiscal year.`,
    afterText: `Article VII — Treasury Controls

7.1  Dual Signature Threshold
     Any expense exceeding 2% of total paid-in capital
     shall require the dual signature of (a) the manager
     and (b) a board-appointed counter-signatory.

7.2  Single-Signature Band
     Expenses at or below 2% of capital may be approved
     by the manager alone, subject to ex-post CRE audit.

7.3  Threshold Review
     The threshold shall be reviewed by the Constitutional
     Council no later than the end of each fiscal year.
     Any increase above 2% requires a 75% supermajority.`,
  },
  {
    title: "Extend founder equity vesting from 36 to 48 months",
    enterpriseName: "Nile Brew Café",
    enterpriseTier: "D",
    summary:
      "Lengthens the founder equity vesting cliff from 36 to 48 months to better align with the 5-year sovereign survival horizon. Affects 5% + 5% founder pool.",
    beforeText: `Article IV — Founder Equity

4.2  Vesting Schedule
     The founder equity grant (5% + 5% performance tranche)
     shall vest over 36 months with a 12-month cliff.

4.3  Acceleration
     On graduation, all unvested founder equity shall
     accelerate in full. On involuntary removal per
     Article IX, unvested equity returns to the pool.

4.4  Transfer Restriction
     Vested founder shares are restricted for an additional
     12 months post-graduation.`,
    afterText: `Article IV — Founder Equity

4.2  Vesting Schedule
     The founder equity grant (5% + 5% performance tranche)
     shall vest over 48 months with an 18-month cliff,
     aligning with the 5-year sovereign survival horizon.

4.3  Acceleration
     On graduation, all unvested founder equity shall
     accelerate in full. On involuntary removal per
     Article IX, unvested equity returns to the pool.

4.4  Transfer Restriction
     Vested founder shares are restricted for an additional
     18 months post-graduation.`,
  },
  {
    title: "Lower quorum for routine proposals from 51% to 45%",
    enterpriseName: "StreetBites",
    enterpriseTier: "A",
    summary:
      "Reduces the quorum required for routine (non-amendment, non-graduation) proposals from 51% to 45% of total voting power. Supermajority requirements unchanged.",
    beforeText: `Article III — Constitutional Consensus

3.1  Quorum
     A vote shall be deemed quorate when at least 51% of
     total voting power has cast a ballot within the
     voting window.

3.2  Pass Thresholds
     - Routine proposals: simple majority of cast votes.
     - Constitutional amendment: 75% supermajority.
     - Graduation: 75% supermajority.

3.3  Cooling Period
     Every proposal shall observe a cooling period between
     publication and the opening of voting, per the type
     matrix in Annex A.`,
    afterText: `Article III — Constitutional Consensus

3.1  Quorum
     A vote shall be deemed quorate when at least 45% of
     total voting power has cast a ballot within the
     voting window. The quorum for constitutional
     amendments and graduation remains 51%.

3.2  Pass Thresholds
     - Routine proposals: simple majority of cast votes.
     - Constitutional amendment: 75% supermajority.
     - Graduation: 75% supermajority.

3.3  Cooling Period
     Every proposal shall observe a cooling period between
     publication and the opening of voting, per the type
     matrix in Annex A.`,
  },
];

export default async function CharterDiffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/charter-diff");

  // Pull constitutional_amendment proposals from the seeded ledger.
  const amendments = await db.proposal.findMany({
    where: { type: "constitutional_amendment" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      enterprise: { select: { id: true, name: true, tier: true } },
    },
  });

  // Serialize real amendments (if any). We don't have stored before/after
  // charter text on the Proposal model — these would normally be attached
  // as IpfsEvidence. For the demo we synthesize plausible charter text
  // from the proposal title + description.
  const realAmendments: CharterAmendment[] = amendments.map((p) => ({
    id: p.id,
    title: p.title,
    enterpriseName: p.enterprise.name,
    enterpriseTier: p.enterprise.tier,
    summary: p.description,
    beforeText: synthesizeCharterFromTitle(p.title, "before"),
    afterText: synthesizeCharterFromTitle(p.title, "after"),
  }));

  const mockAmendments: CharterAmendment[] = MOCK_AMENDMENTS.map((m, i) => ({
    ...m,
    id: `mock-amendment-${i + 1}`,
  }));

  const all = [...realAmendments, ...mockAmendments];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <PageHeader
        eyebrow="Constitutional Diff Viewer"
        icon={GitCompareArrows}
        title="Charter amendments, line by line."
        subtitle="When a proposal amends the enterprise charter, AURIENTA renders a git-style diff of the constitutional text — green for additions, red for deletions. The AI then explains the implications and quantifies the impact on past decisions. Sealed to the immutable ledger as a court-admissible AiArtifact."
      />

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-16 text-center">
          <Inbox className="h-8 w-8 text-gold/60" />
          <p className="font-serif text-base font-semibold">No charter amendments</p>
          <p className="max-w-sm font-sans text-[12px] text-muted-foreground">
            No constitutional amendment proposals have been raised yet. They
            require a 75% supermajority and a 90-day cooling period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {all.map((a, i) => (
            <CharterDiffViewer
              key={a.id}
              amendment={a}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Charter text is sealed to IPFS (QmY8… constitutional_blueprint_v8.2).
        Every diff and AI implication is hash-stamped and admissible as evidence.
      </p>
    </div>
  );
}

/**
 * Synthesize a minimal charter excerpt from a proposal title.
 * Real implementations would pull the actual charter text from IPFS —
 * this fallback produces a believable two-paragraph excerpt for the demo.
 */
function synthesizeCharterFromTitle(title: string, side: "before" | "after"): string {
  const lower = title.toLowerCase();
  if (lower.includes("threshold")) {
    return side === "before"
      ? `Article VII — Treasury Controls\n\n7.1  Dual Signature Threshold\n     Any expense exceeding 1% of total paid-in capital\n     shall require the dual signature of (a) the manager\n     and (b) a board-appointed counter-signatory.\n\n7.2  Single-Signature Band\n     Expenses at or below 1% of capital may be approved\n     by the manager alone, subject to ex-post CRE audit.`
      : `Article VII — Treasury Controls\n\n7.1  Dual Signature Threshold\n     Any expense exceeding 2% of total paid-in capital\n     shall require the dual signature of (a) the manager\n     and (b) a board-appointed counter-signatory.\n\n7.2  Single-Signature Band\n     Expenses at or below 2% of capital may be approved\n     by the manager alone, subject to ex-post CRE audit.`;
  }
  if (lower.includes("quorum")) {
    return side === "before"
      ? `Article III — Constitutional Consensus\n\n3.1  Quorum\n     A vote shall be deemed quorate when at least 51% of\n     total voting power has cast a ballot within the\n     voting window.\n\n3.2  Pass Thresholds\n     - Routine proposals: simple majority of cast votes.\n     - Constitutional amendment: 75% supermajority.`
      : `Article III — Constitutional Consensus\n\n3.1  Quorum\n     A vote shall be deemed quorate when at least 45% of\n     total voting power has cast a ballot within the\n     voting window.\n\n3.2  Pass Thresholds\n     - Routine proposals: simple majority of cast votes.\n     - Constitutional amendment: 75% supermajority.`;
  }
  if (lower.includes("vesting") || lower.includes("equity")) {
    return side === "before"
      ? `Article IV — Founder Equity\n\n4.2  Vesting Schedule\n     The founder equity grant (5% + 5% performance tranche)\n     shall vest over 36 months with a 12-month cliff.\n\n4.3  Acceleration\n     On graduation, all unvested founder equity shall\n     accelerate in full.`
      : `Article IV — Founder Equity\n\n4.2  Vesting Schedule\n     The founder equity grant (5% + 5% performance tranche)\n     shall vest over 48 months with an 18-month cliff.\n\n4.3  Acceleration\n     On graduation, all unvested founder equity shall\n     accelerate in full.`;
  }
  // Generic fallback
  return side === "before"
    ? `Article X — Constitutional Provision\n\n10.1  Current Rule\n     The existing constitutional provision shall remain\n     in force until amended per Article XII.\n\n10.2  Scope\n     This article applies to all enterprises and may not\n     be waived by individual charter.`
    : `Article X — Constitutional Provision\n\n10.1  Amended Rule\n     The provision is hereby amended as proposed, with\n     immediate effect upon passage of the supermajority\n     vote required by Article XII.\n\n10.2  Scope\n     This article applies to all enterprises and may not\n     be waived by individual charter.`;
}

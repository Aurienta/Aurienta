import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH, TIER_META, PROPOSAL_TYPES } from "@/lib/aurienta/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, ScrollText, Users, ShieldCheck, Vote, FileText } from "lucide-react";

export const metadata = { title: "Board Member Console · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function BoardMemberPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/board-member");

  // Find enterprises where the user is a board member.
  const boardSeats = await db.enterpriseMember.findMany({
    where: { userId: user.id, role: "board_member", boardSeat: true },
    include: {
      enterprise: {
        select: {
          id: true, name: true, slug: true, tier: true, sector: true,
          healthRating: true, healthScore: true, stage: true, status: true,
          fundraisingGoalEgp: true, raisedEgp: true, lawFirmClientAccountBalanceEgp: true,
          founderEquityPct: true, totalEquityUnits: true, equityUnitPriceEgp: true,
        },
      },
    },
  });

  if (boardSeats.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <BoardMemberHeader user={user} />
        <Card className="border-gold/12 glass-gold">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Gavel className="h-10 w-10 text-gold/40" />
            <p className="font-serif text-lg font-semibold">No board seats assigned</p>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              You do not currently hold a board seat on any constitutional enterprise.
              Board seats are assigned by shareholder vote. Once you hold a seat, this console
              will show your constitutional duties, pending proposals, and voting power.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch board-relevant data for each enterprise.
  const enterpriseData = await Promise.all(
    boardSeats.map(async (seat) => {
      const ent = seat.enterprise;
      const [proposals, expenses, milestones, ledgerCount, totalShareholders] = await Promise.all([
        db.proposal.findMany({
          where: { enterpriseId: ent.id, status: "voting_open" },
          orderBy: { votingEndsAt: "asc" },
          take: 5,
        }),
        db.expense.findMany({
          where: { enterpriseId: ent.id, status: { in: ["pending", "dual_signature_pending"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        db.milestone.findMany({
          where: { enterpriseId: ent.id, status: "board_review" },
          take: 5,
        }),
        db.ledgerEvent.count({ where: { enterpriseId: ent.id } }),
        db.ownershipRecord.count({ where: { enterpriseId: ent.id } }),
      ]);
      return { seat, ent, proposals, expenses, milestones, ledgerCount, totalShareholders };
    })
  );

  return (
    <div className="mx-auto max-w-6xl">
      <BoardMemberHeader user={user} />

      {/* Constitutional duties summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DutyCard icon={ScrollText} label="Board seats" value={boardSeats.length} />
        <DutyCard icon={Vote} label="Open proposals" value={enterpriseData.reduce((s, e) => s + e.proposals.length, 0)} />
        <DutyCard icon={ShieldCheck} label="Pending approvals" value={enterpriseData.reduce((s, e) => s + e.expenses.length + e.milestones.length, 0)} />
        <DutyCard icon={FileText} label="Ledger events" value={enterpriseData.reduce((s, e) => s + e.ledgerCount, 0)} />
      </div>

      {/* Board-exclusive powers */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Gavel className="h-4 w-4 text-gold" /> Board-exclusive constitutional powers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PowerCard
              title="Constitutional amendments"
              threshold="75% supermajority"
              cooling="90-day cooling"
              voting="14-day vote"
              desc="The board may propose amendments to the Constitutional Charter. Non-amendable rules (Zero Custody, One Identity) cannot be changed."
            />
            <PowerCard
              title="Emergency freeze"
              threshold="75% supermajority"
              cooling="No cooling (emergency)"
              voting="24-hour vote"
              desc="The board may freeze an enterprise's transactions in case of fraud, regulatory action, or existential threat. All money-moving actions are blocked while frozen."
            />
            <PowerCard
              title="Expenses >10% of capital"
              threshold="Board approval"
              cooling="Standard"
              voting="Per proposal"
              desc="Expenses exceeding 10% of enterprise capital require board approval. The CRE enforces this gate — no single role can bypass it."
            />
            <PowerCard
              title="Manager appointment"
              threshold="50% majority"
              cooling="24-hour cooling"
              voting="48-hour vote"
              desc="Appoint an independent manager (police clearance required). Founders are banned from the manager seat for 12 months at Tier A."
            />
            <PowerCard
              title="Manager removal (Art. 118)"
              threshold="50% majority"
              cooling="48-hour cooling"
              voting="72-hour vote"
              desc="Remove a manager for cause (fraud, negligence, regulatory breach). Due process enforced by the CRE."
            />
            <PowerCard
              title="Graduation vote"
              threshold="75% supermajority"
              cooling="30-day cooling"
              voting="14-day vote"
              desc="Call the graduation vote to release the enterprise to sovereign independence. Requires readiness ≥90 and all graduation gates passed."
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-enterprise board view */}
      {enterpriseData.map(({ seat, ent, proposals, expenses, milestones, totalShareholders }) => (
        <Card key={ent.id} className="mb-4 border-gold/12 glass-gold">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-xl">{ent.name}</CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-gold/25 bg-gold/5 font-mono text-[11px] text-gold-light">
                    Tier {ent.tier} · {TIER_META[ent.tier]?.name ?? ent.tier}
                  </Badge>
                  <Badge variant="outline" className="border-gold/15 font-mono text-[11px]">
                    {ent.sector}
                  </Badge>
                  <Badge variant="outline" className="border-gold/15 font-mono text-[11px]">
                    Health {ent.healthRating ?? "—"} ({ent.healthScore}/100)
                  </Badge>
                  <span className="font-sans text-[11px] text-muted-foreground">
                    {totalShareholders} shareholders
                  </span>
                </div>
              </div>
              <Badge className="border-gold/30 bg-gold/10 text-gold-light" variant="outline">
                Board seat
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Open proposals */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Vote className="h-3 w-3 text-gold/70" /> Open proposals ({proposals.length})
                </p>
                {proposals.length === 0 ? (
                  <p className="font-sans text-xs text-muted-foreground">No open proposals.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {proposals.map((p) => {
                      const meta = PROPOSAL_TYPES[p.type];
                      return (
                        <div key={p.id} className="rounded-lg border border-gold/10 bg-background/40 p-2.5">
                          <p className="font-sans text-xs font-medium text-foreground line-clamp-1">{p.title}</p>
                          <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                            <span className="text-gold-light">{meta?.label ?? p.type}</span>
                            <span>· {p.passThreshold}% to pass</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                            <span className="text-emerald-300">For {p.votesFor.toLocaleString()}</span>
                            <span className="text-destructive">Against {p.votesAgainst.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pending expense approvals */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-gold/70" /> Expense approvals ({expenses.length})
                </p>
                {expenses.length === 0 ? (
                  <p className="font-sans text-xs text-muted-foreground">No pending expenses.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {expenses.map((e) => (
                      <div key={e.id} className="rounded-lg border border-gold/10 bg-background/40 p-2.5">
                        <p className="font-sans text-xs font-medium text-foreground line-clamp-1">{e.description}</p>
                        <p className="mt-0.5 font-mono text-xs text-gold-light">{e.amountEgp.toLocaleString()} EGP · {e.category}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{e.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones awaiting board review */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3 w-3 text-gold/70" /> Milestone reviews ({milestones.length})
                </p>
                {milestones.length === 0 ? (
                  <p className="font-sans text-xs text-muted-foreground">No milestones awaiting review.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {milestones.map((m) => (
                      <div key={m.id} className="rounded-lg border border-gold/10 bg-background/40 p-2.5">
                        <p className="font-sans text-xs font-medium text-foreground line-clamp-1">{m.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-gold-light">{m.amountEgp.toLocaleString()} EGP</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Financial snapshot */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FinancialStat label="Law Firm Client Account" value={`${ent.lawFirmClientAccountBalanceEgp.toLocaleString()} EGP`} />
              <FinancialStat label="Capital Participated" value={`${ent.raisedEgp.toLocaleString()} / ${ent.fundraisingGoalEgp.toLocaleString()}`} />
              <FinancialStat label="Founder equity" value={`${ent.founderEquityPct}%`} />
              <FinancialStat label="Total shares" value={ent.totalEquityUnits.toLocaleString()} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BoardMemberHeader({ user }: { user: { legalName: string; sovereignTrustScore: number; tier: string } }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-gold" />
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
          Board Member Console
        </span>
      </div>
      <h1 className="mt-1 font-serif text-3xl font-semibold">{user.legalName}</h1>
      <p className="font-sans text-sm text-muted-foreground">
        Constitutional fiduciary · STS {user.sovereignTrustScore}/100 · {user.tier}
      </p>
    </header>
  );
}

function DutyCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card className="border-gold/12 bg-background/40">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-gold/70" />
        <div>
          <p className="font-serif text-2xl font-semibold text-foreground">{value}</p>
          <p className="font-sans text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerCard({ title, threshold, cooling, voting, desc }: { title: string; threshold: string; cooling: string; voting: string; desc: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
      <p className="font-sans text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="border-gold/20 font-mono text-xs text-gold-light">{threshold}</Badge>
        <Badge variant="outline" className="border-gold/15 font-mono text-xs">{cooling}</Badge>
        <Badge variant="outline" className="border-gold/15 font-mono text-xs">{voting}</Badge>
      </div>
      <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function FinancialStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/8 bg-background/30 p-2.5">
      <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-sans text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

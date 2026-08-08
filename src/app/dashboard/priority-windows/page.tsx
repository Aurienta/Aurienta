import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  PriorityWindows,
  type PriorityWindow,
} from "@/components/dashboard/ux/priority-windows";
import { Hourglass } from "lucide-react";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Priority Windows · AURIENTA",
  description:
    "Cross-enterprise aggregator of Phase 1 pro-rata priority windows — your first-refusal rights on every sell order.",
};

const WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours, per constitutional spec.

export default async function PriorityWindowsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/priority-windows");

  // Pull the user's holdings (shares > 0). Priority windows apply only
  // to enterprises the user already holds equity in.
  const holdings = await db.ownershipRecord.findMany({
    where: { userId: user.id, equityUnits: { gt: 0 } },
    include: { enterprise: { select: { id: true, name: true, slug: true, tier: true, totalEquityUnits: true, equityUnitPriceEgp: true } } },
  });

  const enterpriseIds = holdings.map((h) => h.enterpriseId);

  // Open Phase 1 sell orders placed by OTHER Constitutional Partners on the user's enterprises.
  const orders = enterpriseIds.length
    ? await db.tradeOrder.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          side: "sell",
          status: "open",
          phase: "phase_1",
          userId: { not: user.id },
        },
        include: {
          enterprise: { select: { id: true, name: true, slug: true, tier: true, totalEquityUnits: true } },
          user: { select: { legalName: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Map enterpriseId → user's share count (for pro-rata math).
  const userSharesByEnt = new Map(holdings.map((h) => [h.enterpriseId, h.equityUnits]));

  const windows: PriorityWindow[] = orders
    .map((o) => {
      const userShares = userSharesByEnt.get(o.enterpriseId) ?? 0;
      const totalEquityUnits = o.enterprise.totalEquityUnits;
      const proRata = totalEquityUnits > 0 ? Math.floor((userShares / totalEquityUnits) * o.equityUnits) : 0;
      // If pro-rata rounds to zero, the user is still entitled to know about
      // the window — we surface it but show "0%" so they can grow their stake.
      const closesAt = new Date(o.createdAt.getTime() + WINDOW_MS);
      const sellerInitials = o.user.legalName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return {
        id: o.id,
        enterpriseId: o.enterpriseId,
        enterpriseName: o.enterprise.name,
        enterpriseSlug: o.enterprise.slug,
        enterpriseTier: o.enterprise.tier,
        sharesForSale: o.equityUnits,
        priceEgp: o.priceEgp,
        userShares,
        totalEquityUnits,
        proRataShares: proRata,
        proRataValueEgp: Math.round(proRata * o.priceEgp),
        windowClosesAt: closesAt.toISOString(),
        sellerInitials,
      } satisfies PriorityWindow;
    })
    // Drop windows that have already closed (countdown ≤ 0).
    .filter((w) => new Date(w.windowClosesAt).getTime() > Date.now());

  const summary = {
    count: windows.length,
    totalEquityUnits: windows.reduce((s, w) => s + w.sharesForSale, 0),
    totalEntitlementEgp: windows.reduce((s, w) => s + w.proRataValueEgp, 0),
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
            <Hourglass className="h-3 w-3" />
            Priority Window Aggregator
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-gold-gradient sm:text-4xl">
            Cross-Enterprise Pro-Rata
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
            Every active Phase 1 sell order across your portfolio, with your computed
            pro-rata entitlement and a live countdown to window close.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.03] p-3 font-mono text-xs text-muted-foreground/85">
          <span className="rounded border border-gold/20 bg-gold/[0.06] px-1.5 py-0.5 text-gold-light">Phase 1</span>
          <span>= pro-rata (existing Constitutional Partners)</span>
          <span className="ml-1 hidden sm:inline">·</span>
          <span className="hidden sm:inline">48h window per order</span>
        </div>
      </header>

      <PriorityWindows windows={windows} summary={summary} />

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-4 font-mono text-xs text-muted-foreground/80">
        <span>Constitution live · hash {CONSTITUTIONAL_HASH.slice(0, 18)}…</span>
        <span>
          {windows.length} active phase-1 window{windows.length === 1 ? "" : "s"} across {holdings.length} enterprise{holdings.length === 1 ? "" : "s"}
        </span>
      </footer>
    </div>
  );
}

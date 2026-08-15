import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { AdminPanelClient } from "@/components/dashboard/admin/admin-panel-client";

export const metadata: Metadata = {
  title: "Platform Admin · AURIENTA",
  description: "Comprehensive platform administration panel",
};

export const dynamic = "force-dynamic";

export default async function AdminPanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin-panel");

  // During build phase: no password required, any authenticated user can access
  // TODO: Add admin password gate before production

  const [
    totalUsers,
    totalEnterprises,
    totalLedgerEvents,
    totalReservations,
    totalExpenses,
    totalEmployees,
    activeSessions,
    frozenEnterprises,
    pendingVerifications,
    recentUsers,
    recentEnterprises,
    recentLedgerEvents,
    healthChecks,
  ] = await Promise.all([
    db.user.count(),
    db.enterprise.count(),
    db.ledgerEvent.count(),
    db.reservation.count(),
    db.expense.count(),
    db.employee.count(),
    db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    db.enterprise.count({ where: { status: "frozen" } }),
    db.govApiVerification.count({ where: { status: "pending" } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, email: true, legalName: true, verificationLevel: true, sovereignTrustScore: true, createdAt: true, primaryIntent: true } }),
    db.enterprise.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, slug: true, tier: true, stage: true, status: true, healthScore: true, createdAt: true, founder: { select: { legalName: true } } } }),
    db.ledgerEvent.findMany({ orderBy: { sequence: "desc" }, take: 15, select: { id: true, eventType: true, sequence: true, timestamp: true, actorId: true, payload: true, enterpriseId: true } }),
    Promise.all([
      db.user.count().then(c => ({ name: "Users", count: c, status: "ok" as const })),
      db.enterprise.count().then(c => ({ name: "Enterprises", count: c, status: "ok" as const })),
      db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }).then(c => ({ name: "Active Sessions", count: c, status: "ok" as const })),
      db.ledgerEvent.count().then(c => ({ name: "Ledger Events", count: c, status: "ok" as const })),
      db.govApiVerification.count({ where: { status: "pending" } }).then(c => ({ name: "Pending Verifications", count: c, status: c > 10 ? "warning" as const : "ok" as const })),
      db.enterprise.count({ where: { status: "frozen" } }).then(c => ({ name: "Frozen Enterprises", count: c, status: c > 0 ? "warning" as const : "ok" as const })),
    ]),
  ]);

  return (
    <AdminPanelClient
      stats={{
        totalUsers,
        totalEnterprises,
        totalLedgerEvents,
        totalReservations,
        totalExpenses,
        totalEmployees,
        activeSessions,
        frozenEnterprises,
        pendingVerifications,
      }}
      recentUsers={recentUsers}
      recentEnterprises={recentEnterprises}
      recentLedgerEvents={recentLedgerEvents}
      healthChecks={healthChecks}
    />
  );
}

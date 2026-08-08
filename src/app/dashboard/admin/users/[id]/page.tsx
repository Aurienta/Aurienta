import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  Fingerprint,
  Activity,
  History,
  Building2,
  ScrollText,
  Crown,
  Ban,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
} from "lucide-react";
import {
  VerificationSelector,
  RoleManager,
  SessionsManager,
  SuspendButton,
  PoliceClearanceToggle,
} from "./user-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Detail · AURIENTA Admin",
  description: "AURIENTA Rep — partner identity, verification, STS, roles, sessions, audit, and ledger events.",
};

function stsColor(score: number) {
  if (score >= 90) return "text-gold-light";
  if (score >= 65) return "text-gold";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function stsBarWidth(score: number) {
  return `${Math.max(2, Math.min(100, score))}%`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function verificationBadge(level: string) {
  const cls: Record<string, string> = {
    L0: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    L1: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    L2: "border-gold/30 bg-gold/10 text-gold-light",
    L3: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    L4: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls[level] ?? cls.L1}`}
    >
      {level}
    </span>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect(`/signin?next=/dashboard/admin/users/${(await params).id}`);
  const hasRole = me.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      mobile: true,
      legalName: true,
      verificationLevel: true,
      sovereignTrustScore: true,
      tier: true,
      primaryIntent: true,
      mfaEnabled: true,
      policeClearanceValid: true,
      policeClearanceExpiresAt: true,
      pledgeSignedAt: true,
      pledgeSignature: true,
      nationality: true,
      riskProfile: true,
      familyConsent: true,
      avatarColor: true,
      identityAnchor: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        select: {
          id: true,
          role: true,
          boardSeat: true,
          joinedAt: true,
          enterprise: {
            select: { id: true, name: true, slug: true, tier: true, stage: true, status: true },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      sessions: {
        select: {
          id: true,
          ip: true,
          userAgent: true,
          issuedAt: true,
          lastSeenAt: true,
          expiresAt: true,
          revokedAt: true,
          mfaVerifiedAt: true,
        },
        orderBy: { issuedAt: "desc" },
        take: 50,
      },
      ownershipRecords: {
        select: {
          id: true,
          equityUnits: true,
          avgPriceEgp: true,
          enterprise: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        select: {
          id: true,
          action: true,
          target: true,
          result: true,
          reason: true,
          ip: true,
          timestamp: true,
        },
        orderBy: { timestamp: "desc" },
        take: 20,
      },
      ledEvents: {
        select: {
          id: true,
          eventType: true,
          sequence: true,
          payloadHash: true,
          timestamp: true,
          enterprise: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      _count: {
        select: {
          memberships: true,
          sessions: true,
          ownershipRecords: true,
          proposals: true,
          votes: true,
          auditLogs: true,
          ledEvents: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="User Not Found"
          icon={Ban}
          title="No such partner"
          subtitle="The requested user ID does not exist on the constitutional network."
        />
        <Link
          href="/dashboard/admin/users"
          className="inline-flex w-fit items-center gap-1 rounded-md border border-gold/30 bg-gold/15 px-3 py-1.5 font-sans text-xs font-medium text-gold-light hover:bg-gold/25"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to user list
        </Link>
      </div>
    );
  }

  // List of enterprises available for role assignment — every enterprise on
  // the platform (an AURIENTA Rep can assign a partner to any enterprise).
  const enterprises = await db.enterprise.findMany({
    select: { id: true, name: true, slug: true, tier: true },
    orderBy: { name: "asc" },
  });

  const isSelf = me.id === user.id;
  const isSuspended = user.verificationLevel === "L0";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="User Detail · AURIENTA Rep"
        icon={ShieldCheck}
        title={user.legalName}
        subtitle="Identity, verification, Sovereign Trust Score, roles, sessions, audit trail, and recent ledger activity for one constitutional partner."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/admin/users"
            className="inline-flex items-center gap-1 rounded-md border border-gold/20 bg-foreground/[0.02] px-3 py-1.5 font-sans text-xs text-foreground hover:border-gold/40 hover:bg-gold/8"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to user list
          </Link>
          <SuspendButton
            userId={user.id}
            userLabel={user.legalName}
            isSelf={isSelf}
            alreadySuspended={isSuspended}
          />
        </div>
      </PageHeader>

      {/* Identity panel */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full font-mono text-lg font-semibold text-background"
              style={{ background: user.avatarColor || "#d4af37" }}
              aria-hidden
            >
              {initials(user.legalName)}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl font-semibold">{user.legalName}</h2>
                {verificationBadge(user.verificationLevel)}
                {user.mfaEnabled && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                    <KeyRound className="h-2.5 w-2.5" /> MFA
                  </span>
                )}
                {isSuspended && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-rose-300">
                    <Ban className="h-2.5 w-2.5" /> suspended
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-1 font-sans text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gold/70" /> {user.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gold/70" /> {user.mobile}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gold/70" /> nationality {user.nationality}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-muted-foreground/80">
                <span>created {timeAgo(user.createdAt)}</span>
                <span>·</span>
                <span>updated {timeAgo(user.updatedAt)}</span>
                {user.identityAnchor && (
                  <>
                    <span>·</span>
                    <span>anchor {shortHash(user.identityAnchor, 8, 4)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STS gauge */}
          <div className="w-full max-w-xs rounded-xl border border-gold/15 bg-foreground/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
                Sovereign Trust Score
              </span>
              <span className={`font-serif text-2xl font-semibold ${stsColor(user.sovereignTrustScore)}`}>
                {user.sovereignTrustScore}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-gold"
                style={{ width: stsBarWidth(user.sovereignTrustScore) }}
              />
            </div>
            <div className="mt-2 font-sans text-xs text-muted-foreground">
              Tier · <span className="text-foreground">{user.tier}</span>
            </div>
            <div className="font-sans text-xs text-muted-foreground">
              Intent · <span className="text-foreground">{user.primaryIntent ?? "—"}</span>
            </div>
            <div className="font-sans text-xs text-muted-foreground">
              Risk · <span className="text-foreground">{user.riskProfile ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-gold/10 pt-4 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Memberships" value={user._count.memberships} />
          <Stat label="Sessions" value={user._count.sessions} />
          <Stat label="Shareholdings" value={user._count.ownershipRecords} />
          <Stat label="Proposals" value={user._count.proposals} />
          <Stat label="Votes" value={user._count.votes} />
          <Stat label="Audit logs" value={user._count.auditLogs} />
          <Stat label="Ledger events" value={user._count.ledEvents} />
        </div>
      </section>

      {/* Verification + compliance controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-gold" />
            <h3 className="font-serif text-base font-semibold">Verification level</h3>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground/80">
            Setting to L0 requires the Suspend action (which also revokes sessions).
            L1–L4 can be set directly here. Every change is audit-logged with before/after.
          </p>
          <div className="mt-4">
            <VerificationSelector userId={user.id} currentLevel={user.verificationLevel} />
          </div>

          <div className="mt-5 border-t border-gold/10 pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <h4 className="font-serif text-sm font-semibold">Police clearance</h4>
            </div>
            <div className="mt-2">
              <PoliceClearanceToggle
                userId={user.id}
                valid={user.policeClearanceValid}
                expiresAt={user.policeClearanceExpiresAt?.toISOString() ?? null}
              />
            </div>
          </div>

          {user.pledgeSignedAt && (
            <div className="mt-5 border-t border-gold/10 pt-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" />
                <h4 className="font-serif text-sm font-semibold">Constitutional pledge</h4>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground/80">
                <span>signed {timeAgo(user.pledgeSignedAt)}</span>
                {user.pledgeSignature && (
                  <>
                    <span>·</span>
                    <span>signature {shortHash(user.pledgeSignature, 10, 4)}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Sessions panel */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gold" />
            <h3 className="font-serif text-base font-semibold">Active sessions</h3>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground/80">
            Server-side Session rows (token-hash + IP + UA + MFA flag + revocation).
            Revoke-all invalidates every active login token immediately.
          </p>
          <div className="mt-4">
            <SessionsManager userId={user.id} sessions={user.sessions.map((s) => ({
              id: s.id,
              ip: s.ip,
              userAgent: s.userAgent,
              issuedAt: s.issuedAt.toISOString(),
              lastSeenAt: s.lastSeenAt.toISOString(),
              expiresAt: s.expiresAt.toISOString(),
              revokedAt: s.revokedAt?.toISOString() ?? null,
              mfaVerifiedAt: s.mfaVerifiedAt?.toISOString() ?? null,
            }))} />
          </div>
        </section>
      </div>

      {/* Roles */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-base font-semibold">Enterprise roles</h3>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">
            {user.memberships.length} membership{user.memberships.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4">
          <RoleManager
            userId={user.id}
            memberships={user.memberships.map((m) => ({
              id: m.id,
              role: m.role,
              boardSeat: m.boardSeat,
              joinedAt: m.joinedAt.toISOString(),
              enterprise: m.enterprise,
            }))}
            enterprises={enterprises.map((e) => ({ id: e.id, name: e.name, slug: e.slug, tier: e.tier }))}
          />
        </div>
      </section>

      {/* Shareholdings quick view */}
      {user.ownershipRecords.length > 0 && (
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gold" />
            <h3 className="font-serif text-base font-semibold">Shareholdings</h3>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">
              {user.ownershipRecords.length} holding{user.ownershipRecords.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-gold/8">
            {user.ownershipRecords.map((sh) => (
              <li key={sh.id} className="flex flex-wrap items-center gap-2 py-2">
                <Link
                  href={`/dashboard/admin/enterprises?search=${encodeURIComponent(sh.enterprise.slug)}`}
                  className="font-serif text-sm font-semibold text-foreground hover:text-gold-light"
                >
                  {sh.enterprise.name}
                </Link>
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  {sh.equityUnits.toLocaleString()} shares · avg {sh.avgPriceEgp.toFixed(0)} EGP
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Audit log + Ledger events side-by-side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gold" />
            <h3 className="font-serif text-base font-semibold">Recent audit log</h3>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">last 20</span>
          </div>
          {user.auditLogs.length === 0 ? (
            <p className="mt-3 font-sans text-xs text-muted-foreground/80">
              No audit-log entries yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gold/8 max-h-96 overflow-y-auto">
              {user.auditLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-start gap-2 py-2">
                  <span className="mt-0.5">
                    {log.result === "allowed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="font-mono text-[11px] text-foreground">
                      {log.action}
                    </span>
                    <span className="font-sans text-[10px] text-muted-foreground/70">
                      {log.target ?? "—"}
                      {log.reason ? ` · ${log.reason}` : ""}
                      {log.ip ? ` · ${log.ip}` : ""}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {timeAgo(log.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-gold" />
            <h3 className="font-serif text-base font-semibold">Recent ledger events</h3>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">last 10 · hash-chained</span>
          </div>
          {user.ledEvents.length === 0 ? (
            <p className="mt-3 font-sans text-xs text-muted-foreground/80">
              No ledger events authored by this user.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gold/8 max-h-96 overflow-y-auto">
              {user.ledEvents.map((ev) => (
                <li key={ev.id} className="flex flex-wrap items-start gap-2 py-2">
                  <span className="mt-0.5">
                    <Clock className="h-3 w-3 text-gold/70" />
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="font-mono text-[11px] text-foreground">
                      {ev.eventType}
                      <span className="ml-2 text-muted-foreground/70">#{ev.sequence}</span>
                    </span>
                    <span className="font-sans text-[10px] text-muted-foreground/70">
                      {ev.enterprise?.name ?? "constitutional infrastructure"} · {shortHash(ev.payloadHash, 10, 4)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {timeAgo(ev.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex items-center justify-center gap-2 text-center">
        <ShieldCheck className="h-3 w-3 text-gold/70" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Every action on this page is audit-logged. Suspend + role changes are wrapped in transactions.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-serif text-lg font-semibold text-foreground">{value.toLocaleString()}</span>
      <span className="font-sans text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
    </div>
  );
}

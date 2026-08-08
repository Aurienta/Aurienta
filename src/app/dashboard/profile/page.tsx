import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { stsLevel, ROLE_META } from "@/lib/aurienta/constants";
import { decryptField, revealLast4 } from "@/lib/aurienta/encryption";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, ShieldCheck, KeyRound, Fingerprint, Award, Clock, CheckCircle2, XCircle, Building2 } from "lucide-react";

export const metadata = { title: "Profile · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/profile");

  // Fetch additional data for the profile
  const [auditCount, ledgerCount, proposalCount, voteCount] = await Promise.all([
    db.auditLog.count({ where: { actorId: user.id } }),
    db.ledgerEvent.count({ where: { actorId: user.id } }),
    db.proposal.count({ where: { createdById: user.id } }),
    db.vote.count({ where: { userId: user.id } }),
  ]);

  const level = stsLevel(user.sovereignTrustScore);
  const nationalIdLast4 = revealLast4(user.nationalIdLast4);
  const initials = user.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const pledgeDate = user.pledgeSignedAt ? new Date(user.pledgeSignedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : null;
  const policeExpires = user.policeClearanceExpiresAt ? new Date(user.policeClearanceExpiresAt).toLocaleDateString("en-GB") : null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Constitutional Partner Profile
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">{user.legalName}</h1>
      </header>

      {/* Identity hero card */}
      <Card className="mb-6 border-gold/15 glass-gold overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-serif text-2xl font-semibold text-black"
              style={{ backgroundColor: user.avatarColor }}
            >
              {initials}
            </div>
            {/* Identity details */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl font-semibold">{user.legalName}</h2>
                <Badge variant="outline" className="border-gold/25 bg-gold/5 font-mono text-[11px] text-gold-light">
                  {user.tier}
                </Badge>
                <Badge variant="outline" className="border-gold/15 font-mono text-[11px]">
                  {user.verificationLevel}
                </Badge>
              </div>
              <p className="font-sans text-sm text-muted-foreground">{user.email}</p>
              <p className="font-sans text-sm text-muted-foreground">{user.mobile}</p>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" style={{ color: level.color }} />
                  <span className="font-sans text-xs font-medium" style={{ color: level.color }}>
                    STS {user.sovereignTrustScore}/100 · {level.name}
                  </span>
                </div>
                <span className="font-sans text-xs text-muted-foreground">·</span>
                <span className="font-sans text-xs text-muted-foreground">Member since {memberSince}</span>
              </div>
            </div>
            {/* STS gauge */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" stroke={level.color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(user.sovereignTrustScore / 100) * 213.6} 213.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-lg font-semibold" style={{ color: level.color }}>{user.sovereignTrustScore}</span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">Trust Score</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Constitutional Identity */}
        <Card className="border-gold/12 glass-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Fingerprint className="h-4 w-4 text-gold" /> Constitutional Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Verification level" value={user.verificationLevel} />
            <DetailRow label="Nationality" value={user.nationality === "EG" ? "Egyptian" : user.nationality} />
            <DetailRow label="National ID (last 4)" value={nationalIdLast4 ? `••••${nationalIdLast4}` : "—"} />
            <DetailRow label="Identity hash" value={user.identityHash ? `${user.identityHash.slice(0, 16)}…` : "—"} mono />
            <DetailRow
              label="Constitutional Pledge"
              value={pledgeDate ? `Signed ${pledgeDate}` : "Not signed"}
              icon={pledgeDate ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
            />
          </CardContent>
        </Card>

        {/* Ed25519 Identity Anchor */}
        <Card className="border-gold/12 glass-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <KeyRound className="h-4 w-4 text-gold" /> Ed25519 Identity Anchor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Public key (hex)</p>
              <p className="mt-1 break-all rounded-lg border border-gold/10 bg-background/40 p-2 font-mono text-[11px] text-gold-light">
                {user.identityAnchor ?? "—"}
              </p>
            </div>
            <DetailRow label="Pledge signature" value={user.pledgeSignature ? "Verified ✓" : "—"} icon={user.pledgeSignature ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : undefined} />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              Your Ed25519 keypair was generated at registration. The private key is AES-256-GCM encrypted and never leaves the constitutional infrastructure. The public anchor verifies your pledge signature and CRE decision tokens.
            </p>
          </CardContent>
        </Card>

        {/* Roles & Memberships */}
        <Card className="border-gold/12 glass-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Building2 className="h-4 w-4 text-gold" /> Roles & Memberships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Primary intent" value={user.primaryIntent ? ROLE_META[user.primaryIntent]?.label ?? user.primaryIntent : "—"} />
            <DetailRow label="Risk profile" value={user.riskProfile ?? "—"} />
            <DetailRow label="Family consent" value={user.familyConsent ? "Granted" : "Not granted"} icon={user.familyConsent ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : undefined} />
            <Separator className="bg-gold/10" />
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Enterprise seats ({user.memberships.length})</p>
              {user.memberships.length === 0 ? (
                <p className="font-sans text-xs text-muted-foreground">No enterprise memberships yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {user.memberships.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded border border-gold/8 bg-background/30 px-2.5 py-1.5">
                      <span className="font-sans text-xs text-foreground">{m.enterprise.name}</span>
                      <Badge variant="outline" className="border-gold/20 font-mono text-[11px] text-gold-light">
                        {ROLE_META[m.role]?.label ?? m.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security & Compliance */}
        <Card className="border-gold/12 glass-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <ShieldCheck className="h-4 w-4 text-gold" /> Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="MFA (TOTP)" value={user.mfaEnabled ? "Enabled" : "Not enabled"} icon={user.mfaEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />} />
            <DetailRow
              label="Police clearance"
              value={user.policeClearanceValid ? `Valid${policeExpires ? ` until ${policeExpires}` : ""}` : "Not valid"}
              icon={user.policeClearanceValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            <Separator className="bg-gold/10" />
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Audit log entries" value={auditCount} />
              <StatBox label="Ledger events" value={ledgerCount} />
              <StatBox label="Proposals created" value={proposalCount} />
              <StatBox label="Votes cast" value={voteCount} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-center">
        <Clock className="h-3 w-3 text-gold/70" />
        <p className="font-sans text-[11px] text-muted-foreground">
          Profile last updated {new Date(user.updatedAt).toLocaleString("en-GB")}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gold/8 pb-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 text-right font-sans text-xs font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gold/8 bg-background/30 p-2.5 text-center">
      <p className="font-serif text-lg font-semibold text-foreground">{value.toLocaleString()}</p>
      <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

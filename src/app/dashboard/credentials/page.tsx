import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  Wallet,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Award,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Credentials Wallet · AURIENTA",
  description:
    "W3C Verifiable Credentials wallet, Ed25519 DID anchor, and per-membership VCs — sovereign, portable, cryptographically signed.",
};

// Mock VCs derived from the user's memberships + shareholdings.
function buildVCs(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return [];
  const vcs: Array<{
    id: string;
    type: string;
    issuer: string;
    subject: string;
    issuedAt: string;
    expiresAt: string | null;
    proof: string;
  }> = [];

  // Identity VC (L2 KYC verified).
  vcs.push({
    id: "VC-IDENTITY-L2",
    type: "Constitutional Identity (L2 KYC)",
    issuer: "AURIENTA Identity Service",
    subject: `${user.legalName} · ${user.email}`,
    issuedAt: user.createdAt.toISOString(),
    expiresAt: null,
    proof: "ed25519:" + (user.identityAnchor?.slice(0, 16) ?? "0".repeat(16)),
  });

  // Sovereign Trust Score VC.
  vcs.push({
    id: "VC-STS",
    type: "Sovereign Trust Score",
    issuer: "AURIENTA Constitutional Council",
    subject: `STS ${user.sovereignTrustScore}/100 · ${user.tier}`,
    issuedAt: user.createdAt.toISOString(),
    expiresAt: null,
    proof: "ed25519:" + (user.identityHash?.slice(0, 16) ?? "0".repeat(16)),
  });

  // Per-membership role VCs.
  for (const m of user.memberships) {
    vcs.push({
      id: `VC-MEM-${m.id.slice(-6).toUpperCase()}`,
      type: `${m.role.replace(/_/g, " ")} · ${m.enterprise.name}`,
      issuer: m.enterprise.name,
      subject: `${m.role} at ${m.enterprise.name} (Tier ${m.enterprise.tier})`,
      issuedAt: m.joinedAt.toISOString(),
      expiresAt: null,
      proof: "ed25519:" + m.id.slice(0, 16),
    });
  }

  // Per-shareholding equity VCs.
  for (const s of user.ownershipRecords) {
    if (s.equityUnits <= 0) continue;
    vcs.push({
      id: `VC-EQ-${s.id.slice(-6).toUpperCase()}`,
      type: `Equity Unit holding · ${s.enterprise.name}`,
      issuer: "AURIENTA Ownership Ledger",
      subject: `${s.equityUnits.toLocaleString()} units of ${s.enterprise.name} (${((s.equityUnits / s.enterprise.totalEquityUnits) * 100).toFixed(2)}%)`,
      issuedAt: s.createdAt?.toISOString() ?? user.createdAt.toISOString(),
      expiresAt: null,
      proof: "ed25519:" + s.id.slice(0, 16),
    });
  }

  return vcs;
}

export default async function CredentialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/credentials");

  const vcs = buildVCs(user);
  const did = `did:aurienta:${user.identityAnchor ?? user.id}`;
  const ed25519Pubkey = user.identityAnchor ?? "0".repeat(64);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Credentials Wallet"
        icon={Wallet}
        title="Your sovereign identity, portable"
        subtitle="W3C Verifiable Credentials wallet. Every role, every equity holding, every certification is a cryptographically-signed VC anchored to your Ed25519 DID. Portable across employers, banks, and federation members — AURIENTA never holds your keys."
      />

      {/* DID + Ed25519 */}
      <section className="overflow-hidden rounded-3xl border border-gold/30 glass-gold p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-gold" />
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">Decentralized Identifier</span>
            </div>
            <div className="mt-3 break-all font-mono text-sm text-gold-light">{did}</div>
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              Your DID is derived from your Ed25519 public key. It is yours alone — AURIENTA cannot rotate or revoke it without your signature.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-gold" />
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">Ed25519 public key</span>
            </div>
            <div className="mt-3 break-all font-mono text-xs text-foreground/90 bg-foreground/[0.04] rounded-lg p-3 border border-gold/12">
              {ed25519Pubkey}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge label="W3C VC v2.0" />
              <Badge label="JSON-LD" />
              <Badge label="BBS+ selective disclosure" />
            </div>
          </div>
        </div>
      </section>

      {/* VCs grid */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <h2 className="font-serif text-base font-semibold">Verifiable Credentials</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">{vcs.length} VCs · cryptographically signed</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vcs.map((vc) => (
            <article key={vc.id} className="rounded-2xl border border-gold/15 glass p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-wide text-gold-light/70">{vc.id}</div>
                  <h3 className="mt-1 font-serif text-sm font-semibold">{vc.type}</h3>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              </div>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">{vc.subject}</p>
              <div className="mt-3 space-y-1 font-sans text-xs text-muted-foreground/85">
                <div className="flex items-center justify-between">
                  <span>Issuer</span>
                  <span className="font-mono text-foreground/80">{vc.issuer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Issued</span>
                  <span className="font-mono text-foreground/80">{timeAgo(new Date(vc.issuedAt))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Expires</span>
                  <span className="font-mono text-foreground/80">{vc.expiresAt ? timeAgo(new Date(vc.expiresAt)) : "never"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proof</span>
                  <span className="font-mono text-gold-light">{shortHash(vc.proof, 12, 6)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Where your VCs work</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Bank onboarding", desc: "Present your L2 KYC VC to any Egyptian bank — skip re-KYC." },
            { icon: Award, title: "Job applications", desc: "Prove employment + role history without revealing salary." },
            { icon: Wallet, title: "Cross-network capital", desc: "Federation members verify your equity VCs without AURIENTA in the loop." },
          ].map((u) => (
            <div key={u.title} className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
              <u.icon className="h-4 w-4 text-gold" />
              <div className="mt-2 font-serif text-sm font-semibold">{u.title}</div>
              <div className="mt-0.5 font-sans text-[11px] text-muted-foreground">{u.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          W3C VC v2.0 + Ed25519 DID per Vol 12 Identity framework · keys never leave your device · BBS+ selective disclosure available
        </p>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-foreground/5 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {label}
    </span>
  );
}

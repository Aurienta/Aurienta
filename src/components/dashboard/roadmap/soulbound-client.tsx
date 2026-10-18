"use client";

// AURIENTA — Soulbound Credential Dashboard (Phase 4, ROADMAP-13)
// ─────────────────────────────────────────────────────────────────────────
// Renders the user's soulbound constitutional credential (or a "mint yours"
// CTA if none yet), a third-party verification widget, and an educational
// "How it works" section.
//
// Theme: indigo/violet on a light background — distinct from the gold-dominant
// institutional pages so users can immediately recognise this as a personal
// identity artifact (soulbound, non-transferable).

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Fingerprint,
  ShieldCheck,
  Lock,
  KeyRound,
  Award,
  CheckCircle2,
  Copy,
  Loader2,
  AlertTriangle,
  Sparkles,
  Hash,
  Clock,
  Globe,
  FileBadge,
  Search,
  ArrowRight,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { AurientaMark } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { shortHash } from "@/lib/aurienta/format";
import { SoulboundRevokeButton } from "./soulbound-revoke-button";

// ── Types ──
type Credential = {
  id: string;
  userId: string;
  credentialType: string;
  verificationLevel: string;
  sovereignTrustScore: number;
  anchorPublicKey: string;
  tokenUri: string;
  isTransferable: boolean;
  isRevoked: boolean;
  mintedAt: string;
  revokedAt: string | null;
};

type Props = {
  user: {
    id: string;
    legalName: string;
    email: string;
    verificationLevel: string;
    sovereignTrustScore: number;
    tier: string;
    identityAnchor: string | null;
  };
  verificationMet: boolean;
  anchorExists: boolean;
  tierName: string;
  platformPublicKey: string;
  isRep: boolean;
  credential: Credential | null;
};

// ── Verification level presentation ──
const LEVEL_LABEL: Record<string, string> = {
  L0: "Anonymous (L0)",
  L1: "Verified Contact (L1)",
  L2: "Basic KYC (L2)",
  L3: "Enhanced KYC (L3)",
  L4: "Institutional (L4)",
};

const LEVEL_COLOR: Record<string, string> = {
  L0: "bg-slate-100 text-slate-700 border-slate-200",
  L1: "bg-indigo-50 text-indigo-700 border-indigo-200",
  L2: "bg-violet-50 text-violet-700 border-violet-200",
  L3: "bg-purple-50 text-purple-700 border-purple-200",
  L4: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

export function SoulboundClient({
  user,
  verificationMet,
  anchorExists,
  tierName,
  platformPublicKey,
  isRep,
  credential,
}: Props) {
  const router = useRouter();
  const [minting, setMinting] = React.useState(false);
  const [verifyId, setVerifyId] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifyResult, setVerifyResult] = React.useState<
    | { valid: boolean; reason?: string; credentialId?: string; verificationLevel?: string }
    | null
  >(null);

  // ── Mint ──
  async function handleMint() {
    if (!verificationMet) {
      toast.error("Verification required", {
        description: "Reach L1 (verified email + mobile) before minting.",
      });
      return;
    }
    if (!anchorExists) {
      toast.error("Identity anchor required", {
        description: "Generate your Ed25519 anchor in your profile first.",
      });
      return;
    }
    setMinting(true);
    try {
      const res = await csrfFetch("/api/soulbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mint denied");
      toast.success("Soulbound credential minted", {
        description: "Non-transferable. Verifiable by any third party.",
      });
      router.refresh();
    } catch (e) {
      toast.error("Could not mint credential", {
        description: (e as Error).message,
      });
    } finally {
      setMinting(false);
    }
  }

  // ── Verify ──
  async function handleVerify() {
    const id = verifyId.trim();
    if (!id) {
      toast.error("Enter a credential ID", {
        description: "Paste a credentialId you want to verify.",
      });
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await csrfFetch("/api/soulbound/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setVerifyResult({
        valid: !!data.valid,
        reason: data.reason,
        credentialId: data.credential?.id,
        verificationLevel: data.credential?.verificationLevel,
      });
      if (data.valid) {
        toast.success("Credential is valid", {
          description: `L${data.credential?.verificationLevel?.replace("L", "") ?? "?"} · STS ${data.credential?.sovereignTrustScore ?? "?"}`,
        });
      } else {
        toast.error("Credential is not valid", {
          description: data.reason ?? "Revoked or not found.",
        });
      }
    } catch (e) {
      toast.error("Verification failed", {
        description: (e as Error).message,
      });
    } finally {
      setVerifying(false);
    }
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-indigo-50/60 via-white to-violet-50/40">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-1 py-6 sm:py-10">
        {/* ── Header ── */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100">
              <Fingerprint className="h-4 w-4 text-indigo-700" />
            </span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700/80">
              Soulbound Identity
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Soulbound Constitutional Credential
          </h1>
          <p className="font-sans text-sm text-slate-600 sm:text-base">
            Non-transferable identity NFT. Portable, verifiable, revocable.
          </p>
        </header>

        {/* ── Compliance banner (indigo) ── */}
        <section className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="relative flex items-start gap-3.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-300 bg-white shadow-sm">
              <ShieldAlert className="h-4 w-4 text-indigo-700" />
            </span>
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700/80">
                Securities Classification Exclusion
              </p>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-slate-700">
                This credential is <strong>SOULBOUND</strong> — it{" "}
                <strong>CANNOT</strong> be sold, transferred, or traded. This
                prevents securities classification under{" "}
                <strong>Capital Market Law 95/1992</strong>. It represents
                identity verification only and confers no financial rights,
                dividends, or ownership of any kind.
              </p>
            </div>
          </div>
        </section>

        {/* ── Credential card / Mint CTA ── */}
        {credential ? (
          <CredentialCard
            credential={credential}
            user={user}
            tierName={tierName}
            platformPublicKey={platformPublicKey}
            copy={copy}
          />
        ) : (
          <MintCard
            verificationMet={verificationMet}
            anchorExists={anchorExists}
            minting={minting}
            onMint={handleMint}
          />
        )}

        {/* ── Verify section ── */}
        <section className="rounded-2xl border border-violet-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-violet-50">
              <Search className="h-4 w-4 text-violet-700" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Verify a Credential
              </h2>
              <p className="font-sans text-xs text-slate-500">
                Any third party can verify a credential by its ID — no
                authentication required.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              value={verifyId}
              onChange={(e) => setVerifyId(e.target.value)}
              placeholder="Paste credentialId (e.g. ckabcdef…)"
              className="flex-1 border-violet-200 bg-white font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify();
              }}
            />
            <Button
              onClick={handleVerify}
              disabled={verifying || !verifyId.trim()}
              className="bg-indigo-700 text-white hover:bg-indigo-800"
            >
              {verifying ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-1.5 h-4 w-4" />
              )}
              Verify
            </Button>
          </div>

          {verifyResult && (
            <div
              className={`mt-4 rounded-xl border p-4 ${
                verifyResult.valid
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {verifyResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                )}
                <span
                  className={`font-serif text-sm font-semibold ${
                    verifyResult.valid ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  {verifyResult.valid ? "VALID" : "INVALID"}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 font-sans text-xs text-slate-700">
                {verifyResult.credentialId && (
                  <div>
                    <span className="text-slate-500">Credential: </span>
                    <code className="font-mono">{verifyResult.credentialId}</code>
                  </div>
                )}
                {verifyResult.verificationLevel && (
                  <div>
                    <span className="text-slate-500">Level: </span>
                    <span className="font-mono">
                      {LEVEL_LABEL[verifyResult.verificationLevel] ??
                        verifyResult.verificationLevel}
                    </span>
                  </div>
                )}
                {verifyResult.reason && (
                  <div>
                    <span className="text-slate-500">Reason: </span>
                    {verifyResult.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          {isRep && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                    AURIENTA rep — credential revocation
                  </p>
                  <p className="mt-1 font-sans text-[11px] leading-relaxed text-rose-800">
                    Revoke a holder&apos;s soulbound credential. The credential
                    remains in the database (it is NOT deleted) so that external
                    verifiers continue to receive a structured{" "}
                    <code className="font-mono">revoked on …</code> response.
                  </p>
                </div>
                <SoulboundRevokeButton variant="compact" />
              </div>
            </div>
          )}
        </section>

        {/* ── How it works ── */}
        <HowItWorks />
      </div>
    </div>
  );
}

// ── Mint CTA card ──
function MintCard({
  verificationMet,
  anchorExists,
  minting,
  onMint,
}: {
  verificationMet: boolean;
  anchorExists: boolean;
  minting: boolean;
  onMint: () => void;
}) {
  const canMint = verificationMet && anchorExists;
  return (
    <section className="rounded-2xl border border-indigo-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700/80">
          Mint Your Credential
        </span>
      </div>
      <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-900">
        Your sovereign identity, anchored.
      </h2>
      <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
        Minting creates a non-transferable credential that records your
        verification level, Sovereign Trust Score, and Ed25519 identity anchor.
        The credential is content-addressed (IPFS) and signed by the platform
        key — so anyone can verify it without contacting AURIENTA.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <RequirementRow
          icon={ShieldCheck}
          label="L1+ verification"
          met={verificationMet}
          description={
            verificationMet
              ? "Your contact details are verified."
              : "Verify your email + mobile to reach L1."
          }
        />
        <RequirementRow
          icon={KeyRound}
          label="Ed25519 identity anchor"
          met={anchorExists}
          description={
            anchorExists
              ? "Your cryptographic anchor exists."
              : "Generate an Ed25519 keypair in your profile."
          }
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={onMint}
          disabled={minting || !canMint}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
        >
          {minting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-1.5 h-4 w-4" />
          )}
          Mint Credential
        </Button>
        {!canMint && (
          <span className="font-sans text-xs text-slate-500">
            Complete the requirements above to enable minting.
          </span>
        )}
      </div>
    </section>
  );
}

function RequirementRow({
  icon: Icon,
  label,
  met,
  description,
}: {
  icon: React.ElementType;
  label: string;
  met: boolean;
  description: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        met
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          met
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-sm font-semibold text-slate-800">
            {label}
          </span>
          {met ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Required
            </span>
          )}
        </div>
        <p className="mt-0.5 font-sans text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

// ── Credential card ──
function CredentialCard({
  credential,
  user,
  tierName,
  platformPublicKey,
  copy,
}: {
  credential: Credential;
  user: Props["user"];
  tierName: string;
  platformPublicKey: string;
  copy: (text: string, label: string) => void;
}) {
  const mintedAt = new Date(credential.mintedAt);
  const levelLabel =
    LEVEL_LABEL[credential.verificationLevel] ?? credential.verificationLevel;
  const levelColor =
    LEVEL_COLOR[credential.verificationLevel] ?? LEVEL_COLOR.L0;

  return (
    <section className="flex flex-col gap-4">
      {/* ── Revocation banner (if revoked) ── */}
      {credential.isRevoked && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-serif text-base font-semibold text-rose-800">
              CREDENTIAL REVOKED
            </p>
            <p className="mt-0.5 font-sans text-sm text-rose-700">
              Revoked on{" "}
              {credential.revokedAt
                ? new Date(credential.revokedAt).toLocaleString()
                : "unknown date"}
              . This credential is no longer valid for external verification.
            </p>
          </div>
        </div>
      )}

      {/* ── Premium credential card ── */}
      <div className="group relative rounded-3xl p-[1.5px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_20px_70px_-25px_rgba(99,102,241,0.55)]">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-white">
          {/* Decorative top gradient strip */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />
          {/* Soft corner glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            {/* ── Card header: wordmark + non-transferable badge ── */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AurientaMark className="h-8 w-8" animated={false} />
                <div className="leading-tight">
                  <div className="font-serif text-base font-semibold tracking-wide text-slate-900">
                    AURIENTA
                  </div>
                  <div className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                    Constitutional Credential
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                <Lock className="h-3 w-3" />
                Non-Transferable
              </span>
            </div>

            {/* ── Identity block ── */}
            <div className="mt-6">
              <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Holder
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-slate-900">
                {user.legalName}
              </h3>
              <p className="font-sans text-sm text-slate-600">{user.email}</p>
            </div>

            {/* ── Stat row: verification level + STS ── */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Verification Level
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold ${levelColor}`}
                  >
                    {credential.verificationLevel}
                  </span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] text-slate-500">
                  {levelLabel}
                </p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
                <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-violet-700/80">
                  Sovereign Trust Score
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl font-bold text-indigo-700">
                    {credential.sovereignTrustScore}
                  </span>
                  <span className="font-sans text-xs text-slate-500">/ 100</span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] font-medium text-violet-700">
                  {tierName}
                </p>
              </div>
            </div>

            {/* ── Credential type badge ── */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                <FileBadge className="h-3 w-3 text-slate-500" />
                type: {credential.credentialType}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[11px] text-indigo-700">
                <ShieldCheck className="h-3 w-3" />
                CRE-validated · soulbound
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[11px] text-violet-700">
                <Award className="h-3 w-3" />
                {tierName}
              </span>
            </div>

            {/* ── Anchor + tokenUri ── */}
            <div className="mt-5 grid gap-2">
              <FieldRow
                icon={KeyRound}
                label="Anchor Public Key"
                value={credential.anchorPublicKey}
                onCopy={() =>
                  copy(credential.anchorPublicKey, "Anchor public key")
                }
                mono
              />
              <FieldRow
                icon={Hash}
                label="Token URI (IPFS)"
                value={credential.tokenUri}
                onCopy={() => copy(credential.tokenUri, "Token URI")}
                mono
              />
              <FieldRow
                icon={KeyRound}
                label="Platform Public Key"
                value={platformPublicKey}
                onCopy={() =>
                  copy(platformPublicKey, "Platform public key")
                }
                mono
              />
            </div>

            {/* ── Footer ── */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Minted{" "}
                {mintedAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {mintedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <Fingerprint className="h-3 w-3" />
                {shortHash(credential.id, 10, 6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── External verification helper ── */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <div className="min-w-0">
            <p className="font-sans text-sm font-semibold text-slate-800">
              Externally verifiable
            </p>
            <p className="mt-0.5 font-sans text-xs text-slate-600">
              The credential metadata is content-addressed via IPFS
              (<code className="font-mono">{credential.tokenUri}</code>) and the
              platform&apos;s Ed25519 public key is published above. Any third
              party can verify authenticity by recomputing the CID and checking
              the platform signature.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  onCopy,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <div className="min-w-0 flex-1">
        <div className="font-sans text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div
          className={`mt-0.5 truncate text-[11px] text-slate-800 ${
            mono ? "font-mono" : "font-sans"
          }`}
          title={value}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Educational section ──
function HowItWorks() {
  const items: Array<{
    icon: React.ElementType;
    title: string;
    body: string;
  }> = [
    {
      icon: Lock,
      title: "Soulbound Tokens",
      body:
        "A soulbound token (SBT) is a non-transferable NFT. Once minted, it is permanently bound to your identity anchor — you cannot sell, gift, trade, or otherwise alienate it. This is what excludes it from securities regulation: it confers no transferable financial right.",
    },
    {
      icon: KeyRound,
      title: "Ed25519 Verification",
      body:
        "Your credential is anchored to your Ed25519 public key. The platform signs every credential with its own Ed25519 platform key (published above), so any third party can verify authenticity without contacting AURIENTA — they recompute the signature against the public key.",
    },
    {
      icon: Layers,
      title: "IPFS Immutability",
      body:
        "The credential metadata is content-addressed: the IPFS CID is the SHA-256 hash of the metadata JSON. If anyone (including AURIENTA) edits even one byte, the CID changes and verification fails. The metadata is therefore tamper-evident and immutable once pinned.",
    },
    {
      icon: ShieldCheck,
      title: "Revocable by AURIENTA",
      body:
        "If your identity is compromised or your account is suspended, AURIENTA can revoke the credential. Revocation is recorded on the immutable ledger — the credential remains in the database for audit history, but verifyCredential() will return valid: false with the revocation timestamp.",
    },
  ];

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white/70 p-5 backdrop-blur sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50">
          <Sparkles className="h-4 w-4 text-indigo-700" />
        </span>
        <div>
          <h2 className="font-serif text-lg font-semibold text-slate-900">
            How it works
          </h2>
          <p className="font-sans text-xs text-slate-500">
            The four pillars of a soulbound constitutional credential.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div
            key={it.title}
            className="group rounded-xl border border-slate-200 bg-white/80 p-4 transition-colors hover:border-indigo-200"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                <it.icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-serif text-sm font-semibold text-slate-900">
                {it.title}
              </h3>
            </div>
            <p className="mt-2 font-sans text-xs leading-relaxed text-slate-600">
              {it.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5 text-center">
        <ArrowRight className="h-3 w-3 text-indigo-500" />
        <p className="font-mono text-[11px] text-slate-500">
          Phase 4 · Soulbound Credentials · anchored to Vol 12 Identity framework
        </p>
      </div>
    </section>
  );
}

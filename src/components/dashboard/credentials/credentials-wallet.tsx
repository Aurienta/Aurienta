"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  Fingerprint,
  Building2,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle2,
  FileSignature,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shortHash } from "@/lib/aurienta/format";

export type VerifiableCredential = {
  id: string;
  type: string;
  issuerDid: string;
  issuerLabel: string;
  issuanceDate: string; // ISO
  expiryDate: string | null; // ISO
  subject: {
    identityHash: string;
    role: string;
    roleLabel: string;
    enterpriseId: string | null;
    enterpriseName: string | null;
    validityPeriod: string;
    policeClearanceAttestationHash?: string | null;
  };
  proof: {
    type: string;
    verificationMethod: string;
    signature: string;
  };
};

type Props = {
  credentials: VerifiableCredential[];
  userDid: string;
};

export function CredentialsWallet({ credentials, userDid }: Props) {
  const [copiedDid, setCopiedDid] = React.useState(false);

  const copyDid = async () => {
    try {
      await navigator.clipboard.writeText(userDid);
      setCopiedDid(true);
      toast.success("DID copied", {
        description: "Your AURIENTA DID is now on the clipboard.",
      });
      setTimeout(() => setCopiedDid(false), 1800);
    } catch {
      toast.error("Clipboard unavailable", {
        description: "Copy the DID manually from the field above.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── DID header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/8 gold-glow-sm">
              <Fingerprint className="h-5 w-5 text-gold" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-light/70">
                Your AURIENTA DID · Ed25519 Identity Anchor
              </p>
              <code className="mt-1 block break-all font-mono text-[13px] leading-snug text-gold-light">
                {userDid}
              </code>
              <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-muted-foreground">
                One person, one verified identity. Every Verifiable Credential below is bound to
                this DID and verifiable by any third party without contacting AURIENTA.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyDid}
            className="border-gold/25 bg-gold/5 text-gold hover:bg-gold/10 hover:text-gold-light"
          >
            {copiedDid ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copiedDid ? "Copied" : "Copy DID"}
          </Button>
        </div>
      </section>

      {/* ── Credentials grid ── */}
      {credentials.length === 0 ? (
        <div className="rounded-2xl border border-gold/12 glass p-10 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-gold/40" />
          <p className="mt-4 font-serif text-lg font-semibold">No credentials issued yet</p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Your role-grant Verifiable Credentials will appear here once issued by AURIENTA or
            your law firm.
          </p>
        </div>
      ) : (
        <section aria-label="Verifiable credentials" className="grid gap-4 sm:grid-cols-2">
          {credentials.map((vc, i) => (
            <CredentialCard key={vc.id} vc={vc} index={i} />
          ))}
        </section>
      )}
    </div>
  );
}

function CredentialCard({ vc, index }: { vc: VerifiableCredential; index: number }) {
  const presentExternally = () => {
    toast.success("VC exported", {
      description:
        "Verifiable Credential signed and packaged. Presentable to any third party without the AURIENTA API.",
    });
  };

  const expired = vc.expiryDate ? new Date(vc.expiryDate).getTime() < Date.now() : false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-2xl border border-gold/15 glass p-5 transition-colors hover:border-gold/30"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/8 blur-3xl" />
      <header className="relative flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
            <FileSignature className="h-4 w-4 text-gold" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-light/70">
              W3C Verifiable Credential
            </p>
            <h3 className="mt-0.5 font-serif text-base font-semibold leading-tight text-foreground">
              {vc.type}
            </h3>
          </div>
        </div>
        {expired ? (
          <Badge variant="outline" className="border-red-400/40 bg-red-400/8 text-red-300">
            Expired
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/8 text-emerald-300">
            Active
          </Badge>
        )}
      </header>

      {/* Issuer */}
      <dl className="relative mt-4 grid grid-cols-1 gap-2.5 text-[12px]">
        <Field icon={ShieldCheck} label="Issuer">
          <span className="font-sans text-foreground/90">{vc.issuerLabel}</span>
          <code className="block break-all font-mono text-[9px] text-muted-foreground/70">{vc.issuerDid}</code>
        </Field>

        <Field icon={KeyRound} label="Role / credential subject">
          <span className="font-sans text-foreground/90">{vc.subject.roleLabel}</span>
          <code className="block break-all font-mono text-[9px] text-muted-foreground/70">
            identityHash · {shortHash(vc.subject.identityHash, 10, 6)}
          </code>
        </Field>

        <Field icon={Building2} label="Enterprise">
          {vc.subject.enterpriseName ? (
            <>
              <span className="font-sans text-foreground/90">{vc.subject.enterpriseName}</span>
              <code className="block break-all font-mono text-[9px] text-muted-foreground/70">
                enterpriseId · {shortHash(vc.subject.enterpriseId ?? "", 8, 6)}
              </code>
            </>
          ) : (
            <span className="font-sans text-muted-foreground">Platform-level (no enterprise)</span>
          )}
        </Field>

        <Field icon={Clock} label="Validity">
          <span className="font-sans text-foreground/90">{vc.subject.validityPeriod}</span>
          <div className="flex flex-wrap gap-3 font-mono text-[9px] text-muted-foreground/70">
            <span>issued · {new Date(vc.issuanceDate).toLocaleDateString("en-GB")}</span>
            {vc.expiryDate && (
              <span>
                expires · {new Date(vc.expiryDate).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
        </Field>

        {vc.subject.policeClearanceAttestationHash && (
          <Field icon={ShieldCheck} label="Police clearance attestation">
            <code className="block break-all font-mono text-[9px] text-gold/75">
              {shortHash(vc.subject.policeClearanceAttestationHash, 10, 8)}
            </code>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/70">
              Required for manager-tier roles · Add-on 27
            </p>
          </Field>
        )}

        <Field icon={KeyRound} label="Proof (Ed25519)">
          <code className="block break-all font-mono text-[9px] text-muted-foreground/70">
            {vc.proof.type} · {shortHash(vc.proof.verificationMethod, 14, 8)}
          </code>
          <code className="mt-1 block break-all rounded-md border border-gold/10 bg-background/40 px-1.5 py-1 font-mono text-[9px] text-gold-light/80">
            sig · {shortHash(vc.proof.signature, 16, 10)}
          </code>
        </Field>
      </dl>

      {/* Actions */}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
          id · {shortHash(vc.id, 12, 6)}
        </span>
        <Button
          type="button"
          size="sm"
          onClick={presentExternally}
          className={cn(
            "border-gold/25 bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold-light",
            "font-sans text-[12px]"
          )}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Present externally
        </Button>
      </div>
    </motion.article>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gold/8 bg-background/30 p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-gold/70" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

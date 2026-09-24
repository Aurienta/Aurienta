"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  ScrollText,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographic Succession Declaration — client form (Vol 16 §16.1)
//
// Lets a Constitutional Partner (Founding Operator / Manager / Board Member /
// >10% Capital Partner) file their cryptographic succession declaration:
//   - designate a successor (platform userId OR external name + national ID)
//   - list economic beneficiaries with percentage splits summing to 100
//   - set conditions (onDeath, onIncapacitation, thresholdDays — default 90)
//   - appoint an emergency manager (must hold police clearance)
//
// The form posts to /api/succession. Activating the voting proxy (90-day
// threshold) + executing the succession (transfer of Equity Units) are
// separate institutional-reviewer actions triggered from the same page.
// ─────────────────────────────────────────────────────────────────────────────

export type SuccessionDeclarationClientProps = {
  declaration: {
    id: string;
    status: "draft" | "filed" | "activated" | "executed";
    beneficiaryUserId: string | null;
    beneficiaryName: string | null;
    hasBeneficiaryNationalId: boolean;
    conditions: {
      onDeath: boolean;
      onIncapacitation: boolean;
      thresholdDays: number;
    };
    emergencyManagerId: string | null;
    votingProxyActive: boolean;
    votingProxyActivatedAt: string | null;
    declaredAt: string;
    updatedAt: string;
    economicBeneficiaries: Array<{
      id: string;
      name: string;
      relationship: string;
      percentage: number;
      hasNationalIdLast4: boolean;
    }>;
  } | null;
  userId: string;
  legalName: string;
  verificationLevel: string;
  isReviewer: boolean;
};

type DraftBeneficiary = {
  name: string;
  relationship: string;
  percentage: number;
  nationalIdLast4: string;
};

const RELATIONSHIP_OPTIONS = [
  "spouse",
  "child",
  "sibling",
  "parent",
  "other",
] as const;

export function SuccessionDeclarationClient({
  declaration,
  userId,
  legalName,
  verificationLevel,
  isReviewer,
}: SuccessionDeclarationClientProps) {
  const [status, setStatus] = React.useState<"idle" | "saving" | "activating" | "executing">(
    "idle"
  );

  // Existing declaration state (immutable for already-filed declarations).
  const isLocked =
    declaration?.status === "filed" ||
    declaration?.status === "activated" ||
    declaration?.status === "executed";

  // Form state (defaults match the existing declaration or fresh defaults).
  const [beneficiaryUserId, setBeneficiaryUserId] = React.useState(
    declaration?.beneficiaryUserId ?? ""
  );
  const [beneficiaryName, setBeneficiaryName] = React.useState(
    declaration?.beneficiaryName ?? ""
  );
  const [beneficiaryNationalId, setBeneficiaryNationalId] = React.useState("");
  const [emergencyManagerId, setEmergencyManagerId] = React.useState(
    declaration?.emergencyManagerId ?? ""
  );
  const [onDeath, setOnDeath] = React.useState(declaration?.conditions.onDeath ?? true);
  const [onIncapacitation, setOnIncapacitation] = React.useState(
    declaration?.conditions.onIncapacitation ?? false
  );
  const [thresholdDays, setThresholdDays] = React.useState(
    declaration?.conditions.thresholdDays ?? 90
  );
  const [beneficiaries, setBeneficiaries] = React.useState<DraftBeneficiary[]>(
    declaration?.economicBeneficiaries.length
      ? declaration.economicBeneficiaries.map((b) => ({
          name: b.name,
          relationship: b.relationship,
          percentage: b.percentage,
          nationalIdLast4: "",
        }))
      : [{ name: "", relationship: "spouse", percentage: 100, nationalIdLast4: "" }]
  );
  const [fileStatus, setFileStatus] = React.useState<"draft" | "filed">("draft");

  const totalPct = beneficiaries.reduce((s, b) => s + (Number(b.percentage) || 0), 0);
  const pctValid = Math.abs(totalPct - 100) <= 0.01;

  const addBeneficiary = () =>
    setBeneficiaries((arr) => [
      ...arr,
      { name: "", relationship: "other", percentage: 0, nationalIdLast4: "" },
    ]);

  const removeBeneficiary = (idx: number) =>
    setBeneficiaries((arr) => arr.filter((_, i) => i !== idx));

  const updateBeneficiary = (idx: number, patch: Partial<DraftBeneficiary>) =>
    setBeneficiaries((arr) =>
      arr.map((b, i) => (i === idx ? { ...b, ...patch } : b))
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!pctValid) {
      toast.error("Beneficiary percentages must sum to 100", {
        description: `Currently sum to ${totalPct.toFixed(2)}.`,
      });
      return;
    }
    if (!beneficiaryUserId && !beneficiaryName.trim()) {
      toast.error("Designate a beneficiary", {
        description: "Provide either a beneficiary userId or a beneficiary name.",
      });
      return;
    }

    setStatus("saving");
    try {
      const res = await csrfFetch("/api/succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryUserId: beneficiaryUserId.trim() || undefined,
          beneficiaryName: beneficiaryName.trim() || undefined,
          beneficiaryNationalId: beneficiaryNationalId.trim() || undefined,
          conditions: { onDeath, onIncapacitation, thresholdDays },
          economicBeneficiaries: beneficiaries.map((b) => ({
            name: b.name.trim(),
            relationship: b.relationship,
            percentage: Number(b.percentage),
            nationalIdLast4: b.nationalIdLast4.trim() || undefined,
          })),
          emergencyManagerId: emergencyManagerId.trim() || undefined,
          status: fileStatus,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; declaration?: { id: string; status: string } }
        | null;
      if (!res.ok) {
        toast.error("Failed to save declaration", {
          description: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success(
        fileStatus === "filed" ? "Declaration filed" : "Draft saved",
        {
          description:
            fileStatus === "filed"
              ? "Your cryptographic succession declaration is now in force. The CRE will gate capital-deployment actions on this declaration (Vol 16 §16.1)."
              : "Draft saved. File the declaration when ready — it cannot be modified after filing.",
        }
      );
      // Reload so the page reflects the new state.
      window.location.reload();
    } catch (err) {
      console.error("[succession-declaration] save failed", err);
      toast.error("Network error", {
        description: "Could not reach the succession API.",
      });
    } finally {
      setStatus("idle");
    }
  };

  const onActivate = async () => {
    if (!declaration) return;
    setStatus("activating");
    try {
      const res = await csrfFetch(
        `/api/succession/${declaration.id}/activate`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => null)) as
        | { error?: string; declaration?: { status: string } }
        | null;
      if (!res.ok) {
        toast.error("Failed to activate voting proxy", {
          description: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Voting proxy activated", {
        description:
          "The 90-day threshold has been met. The designated successor / emergency manager must now act on the declarant's behalf.",
      });
      window.location.reload();
    } catch (err) {
      console.error("[succession-declaration] activate failed", err);
      toast.error("Network error", {
        description: "Could not reach the activate API.",
      });
    } finally {
      setStatus("idle");
    }
  };

  const onExecute = async () => {
    if (!declaration) return;
    if (
      !window.confirm(
        "Execute this succession? This will transfer all of the declarant's Equity Units to the designated successor. This action is IRREVERSIBLE."
      )
    ) {
      return;
    }
    setStatus("executing");
    try {
      const res = await csrfFetch(
        `/api/succession/${declaration.id}/execute`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => null)) as
        | { error?: string; declaration?: { status: string } }
        | null;
      if (!res.ok) {
        toast.error("Failed to execute succession", {
          description: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success("Succession executed", {
        description:
          "Equity Units transferred to the designated successor. The declaration is now terminal (status = executed).",
      });
      window.location.reload();
    } catch (err) {
      console.error("[succession-declaration] execute failed", err);
      toast.error("Network error", {
        description: "Could not reach the execute API.",
      });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Existing declaration status banner */}
      {declaration && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border p-5",
            declaration.status === "executed"
              ? "border-gold/30 bg-gold/[0.04]"
              : declaration.status === "activated"
                ? "border-amber-500/30 bg-amber-500/[0.04]"
                : declaration.status === "filed"
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-gold/15 bg-background/40"
          )}
        >
          <div className="flex items-start gap-3">
            {declaration.status === "executed" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" />
            ) : declaration.status === "activated" ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            ) : declaration.status === "filed" ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-gold/80" />
            )}
            <div className="flex flex-col gap-1.5">
              <p className="font-sans text-sm font-semibold text-foreground">
                Declaration status:{" "}
                <span className="uppercase tracking-wide text-gold-light">
                  {declaration.status}
                </span>
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                Filed {new Date(declaration.declaredAt).toLocaleString()} ·
                Last updated {new Date(declaration.updatedAt).toLocaleString()}
                {declaration.votingProxyActivatedAt
                  ? ` · Proxy activated ${new Date(declaration.votingProxyActivatedAt).toLocaleString()}`
                  : ""}
              </p>
              {declaration.status === "activated" && (
                <p className="font-sans text-xs text-amber-300">
                  Voting proxy is ACTIVE. The declarant's normal operations are
                  blocked — the designated successor / emergency manager must
                  act on the declarant's behalf.
                </p>
              )}
              {declaration.status === "executed" && (
                <p className="font-sans text-xs text-gold-light">
                  Succession executed. Equity Units have been transferred to
                  the designated successor. This declaration is terminal.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Beneficiary designation */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Designated successor
          </h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            The successor receives your voting rights + economic interest on
            verified death / incapacitation. Provide either a platform user
            ID (internal successor) or an external beneficiary name +
            national ID.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="beneficiaryUserId" className="text-xs uppercase tracking-wide text-muted-foreground">
                Beneficiary User ID (optional)
              </Label>
              <Input
                id="beneficiaryUserId"
                value={beneficiaryUserId}
                onChange={(e) => setBeneficiaryUserId(e.target.value)}
                disabled={isLocked || status === "saving"}
                placeholder="cuid..."
                className="h-10 bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="beneficiaryName" className="text-xs uppercase tracking-wide text-muted-foreground">
                Beneficiary name (external)
              </Label>
              <Input
                id="beneficiaryName"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                disabled={isLocked || status === "saving"}
                placeholder="Full legal name"
                className="h-10 bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="beneficiaryNationalId" className="text-xs uppercase tracking-wide text-muted-foreground">
                Beneficiary national ID (AES-256 encrypted at rest)
              </Label>
              <Input
                id="beneficiaryNationalId"
                value={beneficiaryNationalId}
                onChange={(e) => setBeneficiaryNationalId(e.target.value)}
                disabled={isLocked || status === "saving"}
                placeholder="Leave blank to skip — used only for off-platform verification"
                className="h-10 bg-transparent"
                type="password"
                autoComplete="off"
              />
              {declaration?.hasBeneficiaryNationalId && (
                <p className="font-sans text-[11px] text-muted-foreground">
                  A beneficiary national ID is already on file. Submitting a new
                  value will overwrite it.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">Conditions</h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            When the voting proxy may be activated, and the threshold (in days)
            that must elapse between filing and activation.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 font-sans text-sm text-foreground">
              <Checkbox
                checked={onDeath}
                onCheckedChange={(v) => setOnDeath(!!v)}
                disabled={isLocked || status === "saving"}
              />
              On death
            </label>
            <label className="flex items-center gap-2 font-sans text-sm text-foreground">
              <Checkbox
                checked={onIncapacitation}
                onCheckedChange={(v) => setOnIncapacitation(!!v)}
                disabled={isLocked || status === "saving"}
              />
              On incapacitation
            </label>
            <div className="flex items-center gap-2 font-sans text-sm text-foreground">
              <Label htmlFor="thresholdDays" className="text-xs uppercase tracking-wide text-muted-foreground">
                Threshold (days)
              </Label>
              <Input
                id="thresholdDays"
                type="number"
                min={30}
                max={180}
                value={thresholdDays}
                onChange={(e) => setThresholdDays(Number(e.target.value) || 90)}
                disabled={isLocked || status === "saving"}
                className="h-9 w-24 bg-transparent"
              />
            </div>
          </div>
        </section>

        {/* Economic beneficiaries */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Economic beneficiaries
              </h2>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                Off-platform recipients of the declarant&apos;s economic interest.
                Percentages must sum to 100.
              </p>
            </div>
            {!isLocked && (
              <Button
                type="button"
                variant="outline"
                onClick={addBeneficiary}
                disabled={status === "saving"}
                className="h-9"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {beneficiaries.map((b, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 rounded-xl border border-gold/12 bg-background/40 p-3 sm:grid-cols-12"
              >
                <Input
                  value={b.name}
                  onChange={(e) => updateBeneficiary(idx, { name: e.target.value })}
                  disabled={isLocked || status === "saving"}
                  placeholder="Full legal name"
                  className="h-9 bg-transparent sm:col-span-4"
                />
                <select
                  value={b.relationship}
                  onChange={(e) => updateBeneficiary(idx, { relationship: e.target.value })}
                  disabled={isLocked || status === "saving"}
                  className="h-9 rounded-md border border-gold/20 bg-background px-2 font-sans text-sm text-foreground sm:col-span-3"
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={b.percentage}
                  onChange={(e) =>
                    updateBeneficiary(idx, { percentage: Number(e.target.value) || 0 })
                  }
                  disabled={isLocked || status === "saving"}
                  placeholder="0-100"
                  className="h-9 bg-transparent sm:col-span-2"
                />
                <Input
                  value={b.nationalIdLast4}
                  onChange={(e) =>
                    updateBeneficiary(idx, { nationalIdLast4: e.target.value })
                  }
                  disabled={isLocked || status === "saving"}
                  maxLength={4}
                  placeholder="Last 4"
                  className="h-9 bg-transparent sm:col-span-2"
                />
                <div className="flex items-center justify-end sm:col-span-1">
                  {!isLocked && beneficiaries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeBeneficiary(idx)}
                      disabled={status === "saving"}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 font-sans text-xs">
            <span className={cn(pctValid ? "text-emerald-400" : "text-amber-400")}>
              Total: {totalPct.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">
              {pctValid ? "(sums to 100 — OK)" : "(must sum to 100)"}
            </span>
          </div>
        </section>

        {/* Emergency manager */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Emergency manager (optional)
          </h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            A temporary manager appointed during the succession transition.
            Must hold a valid police clearance certificate (Vol 16 §16.1).
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emergencyManagerId" className="text-xs uppercase tracking-wide text-muted-foreground">
                Emergency manager user ID
              </Label>
              <Input
                id="emergencyManagerId"
                value={emergencyManagerId}
                onChange={(e) => setEmergencyManagerId(e.target.value)}
                disabled={isLocked || status === "saving"}
                placeholder="cuid..."
                className="h-10 bg-transparent"
              />
            </div>
          </div>
        </section>

        {/* File vs save draft */}
        {!isLocked && (
          <section className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                setFileStatus("draft");
                // Submit via form event — set state first then dispatch.
                setTimeout(() => {
                  const form = document.querySelector("form");
                  form?.requestSubmit();
                }, 0);
              }}
              disabled={status === "saving"}
              variant="outline"
              className="h-10"
            >
              {status === "saving" && fileStatus === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save draft
            </Button>
            <Button
              type="submit"
              onClick={() => setFileStatus("filed")}
              disabled={status === "saving"}
              className="h-10 bg-gold-gradient text-black hover:opacity-95"
            >
              {status === "saving" && fileStatus === "filed" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              File declaration
            </Button>
            <p className="font-sans text-[11px] text-muted-foreground">
              Filing is irreversible. The CRE will gate capital-deployment
              actions on this declaration once filed.
            </p>
          </section>
        )}
      </form>

      {/* Reviewer actions: activate / execute */}
      {declaration && (declaration.status === "filed" || declaration.status === "activated") && (
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Institutional reviewer actions
          </h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Available to law_firm_rep / accounting_firm_rep / aurienta_rep
            roles only. The declarant themselves may also activate the voting
            proxy after the 90-day threshold.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {declaration.status === "filed" && (
              <Button
                type="button"
                onClick={onActivate}
                disabled={status !== "idle"}
                className="h-10"
              >
                {status === "activating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCog className="h-4 w-4" />
                )}
                Activate voting proxy
              </Button>
            )}
            {declaration.status === "activated" && isReviewer && (
              <Button
                type="button"
                onClick={onExecute}
                disabled={status !== "idle"}
                className="h-10 bg-gold-gradient text-black hover:opacity-95"
              >
                {status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScrollText className="h-4 w-4" />
                )}
                Execute succession (irreversible)
              </Button>
            )}
            {!isReviewer && declaration.status === "activated" && (
              <p className="font-sans text-xs text-muted-foreground">
                Execution requires an institutional reviewer role
                (law_firm_rep / accounting_firm_rep / aurienta_rep).
              </p>
            )}
          </div>
        </section>
      )}

      {/* Identity context (debug) */}
      <section className="rounded-2xl border border-gold/8 bg-background/20 p-4">
        <p className="font-mono text-[11px] text-muted-foreground">
          declarant: {legalName} ({userId.slice(0, 12)}…) ·
          verification level: {verificationLevel} ·
          reviewer: {isReviewer ? "yes" : "no"}
        </p>
      </section>
    </div>
  );
}

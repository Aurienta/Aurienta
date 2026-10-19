"use client";

// Governance-as-a-Service (GaaS) — client surface.
// ═══════════════════════════════════════════════════════════════════
// External organizations register governance policies (hash-chained rule
// text + structured enforcementLogic). The CRE validates submitted
// decisions against each policy's threshold/quorum and emits a signed
// decision token. Pure technology infrastructure — NO funds, NO
// securities, NO custody. Subscription pricing only.
//
// Theme: indigo + purple on light bg. NO blue, NO emojis.
//
// Layout:
//   1. Header + compliance banner (indigo).
//   2. Stats strip (orgs / policies / decisions / verdict counts).
//   3. Organizations card list + "Register Organization" dialog.
//   4. Policies table for the selected org + "Register Policy" form.
//   5. Decisions table for the selected org + "Evaluate Decision" form
//      with verdict badges (allowed=emerald, denied=rose, pending=amber).
//
// Mutations flow through csrfFetch to the GaaS API routes. After each
// successful mutation the page is router.refresh()'d so the server
// component re-fetches the canonical data.

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  Loader2,
  Plus,
  Scale,
  ShieldAlert,
  Sparkles,
  Webhook,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";

// ── Client-side prop types (mirror the server component's serialization) ──

type User = {
  legalName: string;
  email: string;
  isAurientaRep: boolean;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  subscriptionPlan: string;
  monthlyFeeEgp: number;
  active: boolean;
  createdAt: string;
};

type Policy = {
  id: string;
  organizationId: string;
  name: string;
  ruleText: string;
  ruleHash: string;
  enforcementLogic: string; // JSON: { threshold, quorum }
  active: boolean;
  createdAt: string;
};

type Decision = {
  id: string;
  organizationId: string;
  policyId: string;
  decisionText: string;
  decisionHash: string;
  verdict: string; // "allowed" | "denied" | "pending"
  reason: string | null;
  decisionToken: string | null;
  actorEmail: string;
  createdAt: string;
};

type Stats = {
  organizations: number;
  policies: number;
  decisions: number;
  allowed: number;
  denied: number;
  pending: number;
};

type Props = {
  user: User;
  organizations: Organization[];
  policies: Policy[];
  decisions: Decision[];
  stats: Stats;
  constitutionalHash: string;
};

// ── Verdict badge metadata ──
type VerdictKey = "allowed" | "denied" | "pending";
const VERDICT_META: Record<
  VerdictKey,
  { label: string; cls: string; icon: React.ElementType }
> = {
  allowed: {
    label: "Allowed",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
    icon: CheckCircle2,
  },
  denied: {
    label: "Denied",
    cls: "border-rose-500/40 bg-rose-500/10 text-rose-700",
    icon: XCircle,
  },
  pending: {
    label: "Pending",
    cls: "border-indigo-400/50 bg-indigo-400/10 text-indigo-700",
    icon: Clock,
  },
};

function verdictKey(v: string): VerdictKey {
  if (v === "allowed" || v === "denied" || v === "pending") return v;
  return "pending";
}

// ── Plan metadata ──
const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  enterprise: "Enterprise",
};

const ORG_TYPE_LABEL: Record<string, string> = {
  cooperative: "Cooperative",
  ngo: "NGO",
  family_office: "Family Office",
  dao: "DAO",
  other: "Other",
};

// ── Parse enforcementLogic JSON safely on the client ──
function parseEnforcementLogic(
  raw: string
): { threshold: number; quorum: number } | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.threshold === "number" &&
      typeof parsed.quorum === "number"
    ) {
      return {
        threshold: parsed.threshold,
        quorum: parsed.quorum,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════

export function GaasClient(props: Props) {
  const router = useRouter();
  const { user, organizations, policies, decisions, stats } = props;

  // ── Selected org state ──
  // When the user clicks an org card, policies + decisions sections
  // filter to that org. Default: first org (if any), else null.
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(
    organizations[0]?.id ?? null
  );

  // Re-select first org when the list changes (e.g. after creating one).
  React.useEffect(() => {
    if (
      !selectedOrgId ||
      !organizations.some((o) => o.id === selectedOrgId)
    ) {
      setSelectedOrgId(organizations[0]?.id ?? null);
    }
  }, [organizations, selectedOrgId]);

  const selectedOrg = React.useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  );

  const selectedOrgPolicies = React.useMemo(
    () => policies.filter((p) => p.organizationId === selectedOrgId),
    [policies, selectedOrgId]
  );

  const selectedOrgDecisions = React.useMemo(
    () => decisions.filter((d) => d.organizationId === selectedOrgId),
    [decisions, selectedOrgId]
  );

  // ── Mutations ──
  const [creatingOrg, setCreatingOrg] = React.useState(false);
  const [creatingPolicy, setCreatingPolicy] = React.useState(false);
  const [evaluatingDecision, setEvaluatingDecision] = React.useState(false);

  // ── Register Organization dialog state ──
  const [orgDialogOpen, setOrgDialogOpen] = React.useState(false);
  const [orgName, setOrgName] = React.useState("");
  const [orgType, setOrgType] = React.useState<string>("cooperative");
  const [orgContactEmail, setOrgContactEmail] = React.useState("");
  const [orgPlan, setOrgPlan] = React.useState<string>("standard");

  // ── Register Policy form state ──
  const [policyName, setPolicyName] = React.useState("");
  const [ruleText, setRuleText] = React.useState("");
  const [threshold, setThreshold] = React.useState<number>(50);
  const [quorum, setQuorum] = React.useState<number>(3);

  // ── Evaluate Decision form state ──
  const [decisionPolicyId, setDecisionPolicyId] = React.useState<string>("");
  const [decisionText, setDecisionText] = React.useState("");
  const [approverCount, setApproverCount] = React.useState<number>(0);
  const [actorEmail, setActorEmail] = React.useState("");

  // Default the actor email to the current user's email.
  React.useEffect(() => {
    if (!actorEmail && user.email) setActorEmail(user.email);
  }, [user.email, actorEmail]);

  // Default the policy select to the first policy of the selected org.
  React.useEffect(() => {
    if (
      selectedOrgPolicies.length > 0 &&
      !selectedOrgPolicies.some((p) => p.id === decisionPolicyId)
    ) {
      setDecisionPolicyId(selectedOrgPolicies[0].id);
    } else if (selectedOrgPolicies.length === 0) {
      setDecisionPolicyId("");
    }
  }, [selectedOrgPolicies, decisionPolicyId]);

  // ── Reset form fields on dialog close ──
  function resetOrgForm() {
    setOrgName("");
    setOrgType("cooperative");
    setOrgContactEmail(user.email);
    setOrgPlan("standard");
  }

  function resetPolicyForm() {
    setPolicyName("");
    setRuleText("");
    setThreshold(50);
    setQuorum(3);
  }

  function resetDecisionForm() {
    setDecisionText("");
    setApproverCount(0);
    setDecisionPolicyId(selectedOrgPolicies[0]?.id ?? "");
  }

  // ── Handlers ──
  async function handleRegisterOrg() {
    if (orgName.trim().length < 2) {
      toast.error("Name too short", {
        description: "Organization name must be 2–120 characters.",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgContactEmail)) {
      toast.error("Invalid contact email");
      return;
    }
    setCreatingOrg(true);
    try {
      const res = await csrfFetch("/api/gaas/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          type: orgType,
          contactEmail: orgContactEmail.trim().toLowerCase(),
          subscriptionPlan: orgPlan,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        organization?: Organization;
      };
      if (!res.ok || !data.organization) {
        toast.error("Could not register organization", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      toast.success("Organization registered", {
        description: `${data.organization.name} — ${ORG_TYPE_LABEL[data.organization.type] ?? data.organization.type} · ${PLAN_LABEL[data.organization.subscriptionPlan] ?? data.organization.subscriptionPlan} plan`,
      });
      setOrgDialogOpen(false);
      resetOrgForm();
      router.refresh();
    } catch (e) {
      toast.error("Network error", { description: (e as Error).message });
    } finally {
      setCreatingOrg(false);
    }
  }

  async function handleRegisterPolicy() {
    if (!selectedOrgId) return;
    if (policyName.trim().length < 2) {
      toast.error("Policy name too short", {
        description: "Policy name must be 2–120 characters.",
      });
      return;
    }
    if (ruleText.trim().length < 10) {
      toast.error("Rule text too short", {
        description: "Rule text must be at least 10 characters.",
      });
      return;
    }
    if (threshold < 0 || threshold > 100) {
      toast.error("Threshold must be 0–100");
      return;
    }
    if (quorum < 1) {
      toast.error("Quorum must be at least 1");
      return;
    }
    setCreatingPolicy(true);
    try {
      const res = await csrfFetch(
        `/api/gaas/organizations/${selectedOrgId}/policies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: policyName.trim(),
            ruleText,
            enforcementLogic: {
              threshold: Math.floor(threshold),
              quorum: Math.floor(quorum),
            },
          }),
        }
      );
      const data = (await res.json()) as { error?: string; policy?: Policy };
      if (!res.ok || !data.policy) {
        toast.error("Could not register policy", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      toast.success("Policy registered", {
        description: `${data.policy.name} — rule hash ${shortHash(data.policy.ruleHash, 8, 4)}`,
      });
      resetPolicyForm();
      router.refresh();
    } catch (e) {
      toast.error("Network error", { description: (e as Error).message });
    } finally {
      setCreatingPolicy(false);
    }
  }

  async function handleEvaluateDecision() {
    if (!selectedOrgId) return;
    if (!decisionPolicyId) {
      toast.error("Select a policy first", {
        description: "Decisions are evaluated against a registered policy.",
      });
      return;
    }
    if (decisionText.trim().length < 4) {
      toast.error("Decision text too short", {
        description: "Decision text must be at least 4 characters.",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actorEmail)) {
      toast.error("Invalid actor email");
      return;
    }
    if (approverCount < 0 || !Number.isFinite(approverCount)) {
      toast.error("Approver count must be a non-negative integer");
      return;
    }
    setEvaluatingDecision(true);
    try {
      const res = await csrfFetch(
        `/api/gaas/organizations/${selectedOrgId}/decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: decisionPolicyId,
            decisionText,
            actorEmail: actorEmail.trim().toLowerCase(),
            approverCount: Math.floor(approverCount),
          }),
        }
      );
      const data = (await res.json()) as {
        error?: string;
        decision?: Decision;
        verdict?: string;
        reason?: string | null;
      };
      if (!res.ok || !data.decision) {
        toast.error("CRE evaluation failed", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      const v = verdictKey(data.verdict ?? "pending");
      if (v === "allowed") {
        toast.success("Decision allowed", {
          description: data.reason ?? "Quorum + threshold met.",
        });
      } else if (v === "denied") {
        toast.error("Decision denied", {
          description: data.reason ?? "Quorum or threshold not met.",
        });
      } else {
        toast.warning("Decision pending", {
          description: data.reason ?? "Awaiting further evaluation.",
        });
      }
      resetDecisionForm();
      router.refresh();
    } catch (e) {
      toast.error("Network error", { description: (e as Error).message });
    } finally {
      setEvaluatingDecision(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ── Header ── */}
      <header className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Webhook className="h-5 w-5 text-indigo-600" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700/80">
            Roadmap · Phase 1 · Institutional Services
          </span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">
          Governance-as-a-Service
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-sm text-slate-600">
          Register governance rules; CRE validates decisions. Pure technology infrastructure.
        </p>

        {/* ── Compliance banner (indigo) ── */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-300/60 bg-indigo-100/60 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <p className="font-sans text-sm leading-relaxed text-indigo-900">
            <strong className="font-semibold">GaaS is technology infrastructure.</strong>{" "}
            AURIENTA does not manage funds, securities, or custody. Decisions are
            CRE-enforced and hash-chained.
          </p>
        </div>

        {/* ── Stats strip ── */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatPill label="Organizations" value={stats.organizations} tone="indigo" />
          <StatPill label="Policies" value={stats.policies} tone="purple" />
          <StatPill label="Decisions" value={stats.decisions} tone="indigo" />
          <StatPill label="Allowed" value={stats.allowed} tone="emerald" />
          <StatPill label="Denied" value={stats.denied} tone="rose" />
          <StatPill label="Pending" value={stats.pending} tone="amber" />
        </div>

        {/* ── Constitutional hash footer ── */}
        <p className="mt-4 font-mono text-[10px] text-indigo-900/50">
          constitutional hash · {props.constitutionalHash.slice(0, 24)}…
        </p>
      </header>

      {/* ── Organizations section ── */}
      <section className="rounded-2xl border border-indigo-200/60 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Organizations
            </h2>
            <Badge
              variant="outline"
              className="border-indigo-200 text-indigo-700"
            >
              {organizations.length} total
            </Badge>
          </div>

          <Dialog
            open={orgDialogOpen}
            onOpenChange={(open) => {
              setOrgDialogOpen(open);
              if (!open) resetOrgForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Register Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-serif text-slate-900">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Register Organization
                </DialogTitle>
                <DialogDescription className="font-sans text-xs text-slate-500">
                  External organizations register governance rules. CRE validates decisions.
                  Subscription pricing only — no funds, no securities, no custody.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <Label
                    htmlFor="gaas-org-name"
                    className="text-xs uppercase tracking-wider text-slate-500"
                  >
                    Organization name
                  </Label>
                  <Input
                    id="gaas-org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Cooperative"
                    maxLength={120}
                    className="mt-1.5 border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                  />
                  <p className="mt-1 font-sans text-[10px] text-slate-400">
                    Slug auto-derived: <code className="font-mono">{orgName.trim() ? orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "—"}</code>
                  </p>
                </div>

                {/* Type */}
                <div>
                  <Label
                    htmlFor="gaas-org-type"
                    className="text-xs uppercase tracking-wider text-slate-500"
                  >
                    Type
                  </Label>
                  <select
                    id="gaas-org-type"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 font-sans text-sm text-slate-900 shadow-xs transition-colors hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="cooperative">Cooperative</option>
                    <option value="ngo">NGO</option>
                    <option value="family_office">Family Office</option>
                    <option value="dao">DAO</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Contact email */}
                <div>
                  <Label
                    htmlFor="gaas-org-email"
                    className="text-xs uppercase tracking-wider text-slate-500"
                  >
                    Contact email
                  </Label>
                  <Input
                    id="gaas-org-email"
                    type="email"
                    value={orgContactEmail}
                    onChange={(e) => setOrgContactEmail(e.target.value)}
                    placeholder="admin@acme.coop"
                    className="mt-1.5 border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                  />
                </div>

                {/* Plan */}
                <div>
                  <Label
                    htmlFor="gaas-org-plan"
                    className="text-xs uppercase tracking-wider text-slate-500"
                  >
                    Subscription plan
                  </Label>
                  <select
                    id="gaas-org-plan"
                    value={orgPlan}
                    onChange={(e) => setOrgPlan(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 font-sans text-sm text-slate-900 shadow-xs transition-colors hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="free">Free — 0 EGP / month</option>
                    <option value="standard">Standard — 2,500 EGP / month</option>
                    <option value="enterprise">Enterprise — 10,000 EGP / month</option>
                  </select>
                  <p className="mt-1 font-sans text-[10px] text-slate-400">
                    Uniform fee — flat monthly subscription, no commissions on assets.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrgDialogOpen(false);
                    resetOrgForm();
                  }}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterOrg}
                  disabled={creatingOrg}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {creatingOrg ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Registering…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Register
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Org card list */}
        {organizations.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6 text-indigo-500" />}
            title="No organizations yet"
            description={
              user.isAurientaRep
                ? "Register the first external organization to begin governing decisions via the CRE."
                : "You have no registered organizations. Click \"Register Organization\" to begin."
            }
            tone="indigo"
          />
        ) : (
          <div className="gaas-scroll mt-5 grid max-h-[28rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => {
              const isSelected = org.id === selectedOrgId;
              return (
                <button
                  type="button"
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={cn(
                    "group rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5",
                    isSelected
                      ? "border-indigo-400 ring-2 ring-indigo-500/30 shadow-md"
                      : "border-indigo-200/60 hover:border-indigo-300 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-base font-semibold text-slate-900 truncate">
                        {org.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400 truncate">
                        {org.slug}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        org.active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                          : "border-slate-300 bg-slate-100 text-slate-600"
                      )}
                    >
                      {org.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-indigo-200 text-indigo-700"
                    >
                      {ORG_TYPE_LABEL[org.type] ?? org.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-purple-200 text-purple-700"
                    >
                      {PLAN_LABEL[org.subscriptionPlan] ?? org.subscriptionPlan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-200 text-slate-600"
                    >
                      {egp(org.monthlyFeeEgp)} / mo
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-indigo-100 pt-2">
                    <p className="font-sans text-[10px] text-slate-500 truncate">
                      {org.contactEmail}
                    </p>
                    <span className="font-sans text-[10px] text-slate-400">
                      {timeAgo(new Date(org.createdAt))}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-sans text-[10px] text-slate-500">
                      {policies.filter((p) => p.organizationId === org.id).length} policies ·{" "}
                      {decisions.filter((d) => d.organizationId === org.id).length} decisions
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isSelected
                          ? "text-indigo-600 translate-x-0.5"
                          : "text-slate-300 group-hover:text-indigo-400"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Policies + Decisions section ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Policies ── */}
        <section className="rounded-2xl border border-indigo-200/60 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Policies
              </h2>
              {selectedOrg && (
                <Badge
                  variant="outline"
                  className="border-indigo-200 text-indigo-700"
                >
                  {selectedOrgPolicies.length}
                </Badge>
              )}
            </div>
            {selectedOrg && (
              <span className="font-sans text-[10px] text-slate-400">
                for {selectedOrg.name}
              </span>
            )}
          </div>

          {!selectedOrg ? (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-indigo-500" />}
              title="Select an organization"
              description="Choose an organization above to view its registered governance policies."
              tone="indigo"
            />
          ) : (
            <>
              {/* Policies table */}
              {selectedOrgPolicies.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6 text-indigo-500" />}
                  title="No policies registered"
                  description="Register a governance policy below — the rule text is hash-chained so any later mutation is detectable."
                  tone="indigo"
                  compact
                />
              ) : (
                <div className="gaas-scroll mt-4 max-h-[28rem] overflow-y-auto rounded-md border border-indigo-100">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-indigo-50/95 backdrop-blur">
                      <tr className="border-b border-indigo-200">
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-indigo-700/80">
                          Policy
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-indigo-700/80">
                          Threshold
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-indigo-700/80">
                          Quorum
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-indigo-700/80">
                          Rule hash
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrgPolicies.map((p) => {
                        const el = parseEnforcementLogic(p.enforcementLogic);
                        return (
                          <tr
                            key={p.id}
                            className="border-b border-indigo-50 last:border-0 hover:bg-indigo-50/50"
                          >
                            <td className="px-3 py-2 align-top">
                              <p className="font-sans text-sm font-medium text-slate-900">
                                {p.name}
                              </p>
                              <p className="mt-0.5 font-sans text-[10px] text-slate-400">
                                {timeAgo(new Date(p.createdAt))}
                              </p>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Badge
                                variant="outline"
                                className="border-purple-200 text-purple-700"
                              >
                                {el ? `${el.threshold}%` : "—"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Badge
                                variant="outline"
                                className="border-indigo-200 text-indigo-700"
                              >
                                {el ? `${el.quorum} approvers` : "—"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <code className="font-mono text-[10px] text-slate-500">
                                {shortHash(p.ruleHash, 8, 4)}
                              </code>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Register policy form */}
              <div className="mt-5 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-indigo-700">
                    Register policy
                  </h3>
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <Label
                      htmlFor="gaas-policy-name"
                      className="text-[10px] uppercase tracking-wider text-slate-500"
                    >
                      Policy name
                    </Label>
                    <Input
                      id="gaas-policy-name"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      placeholder="Board approval for capital expenditure > 1M EGP"
                      maxLength={120}
                      className="mt-1 border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="gaas-rule-text"
                      className="text-[10px] uppercase tracking-wider text-slate-500"
                    >
                      Rule text (hash-chained)
                    </Label>
                    <Textarea
                      id="gaas-rule-text"
                      value={ruleText}
                      onChange={(e) => setRuleText(e.target.value)}
                      placeholder="Any capital expenditure exceeding 1,000,000 EGP requires a board resolution passed with at least a 2/3 majority. The resolution must be recorded in the minutes and signed by the chair."
                      maxLength={12_000}
                      className="mt-1 min-h-[6rem] border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                    />
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      rule hash · {ruleText.trim() ? shortHash(
                        // Mirror the lib's hashRule (SHA-256 hex) — shown for
                        // UX preview only, the server recomputes authoritatively.
                        ruleText,
                        8,
                        4
                      ) : "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor="gaas-threshold"
                        className="text-[10px] uppercase tracking-wider text-slate-500"
                      >
                        Threshold (% approval)
                      </Label>
                      <Input
                        id="gaas-threshold"
                        type="number"
                        min={0}
                        max={100}
                        value={threshold}
                        onChange={(e) =>
                          setThreshold(
                            Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          )
                        }
                        className="mt-1 border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="gaas-quorum"
                        className="text-[10px] uppercase tracking-wider text-slate-500"
                      >
                        Quorum (min approvers)
                      </Label>
                      <Input
                        id="gaas-quorum"
                        type="number"
                        min={1}
                        max={1000}
                        value={quorum}
                        onChange={(e) =>
                          setQuorum(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="mt-1 border-indigo-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={resetPolicyForm}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleRegisterPolicy}
                      disabled={creatingPolicy}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {creatingPolicy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Hashing…
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" /> Register Policy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Decisions ── */}
        <section className="rounded-2xl border border-purple-200/60 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-purple-600" />
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Decisions
              </h2>
              {selectedOrg && (
                <Badge
                  variant="outline"
                  className="border-purple-200 text-purple-700"
                >
                  {selectedOrgDecisions.length}
                </Badge>
              )}
            </div>
            {selectedOrg && (
              <span className="font-sans text-[10px] text-slate-400">
                for {selectedOrg.name}
              </span>
            )}
          </div>

          {!selectedOrg ? (
            <EmptyState
              icon={<Gavel className="h-6 w-6 text-purple-500" />}
              title="Select an organization"
              description="Choose an organization above to view its evaluated decisions."
              tone="purple"
            />
          ) : selectedOrgPolicies.length === 0 ? (
            <EmptyState
              icon={<Gavel className="h-6 w-6 text-purple-500" />}
              title="Register a policy first"
              description="Decisions are evaluated against a policy's enforcement logic (threshold + quorum). Register at least one policy on this organization."
              tone="purple"
            />
          ) : (
            <>
              {/* Decisions table */}
              {selectedOrgDecisions.length === 0 ? (
                <EmptyState
                  icon={<Scale className="h-6 w-6 text-purple-500" />}
                  title="No decisions evaluated yet"
                  description="Submit a decision below — the CRE will validate it against the selected policy's threshold + quorum and emit a signed decision token."
                  tone="purple"
                  compact
                />
              ) : (
                <div className="gaas-scroll mt-4 max-h-[28rem] overflow-y-auto rounded-md border border-purple-100">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-purple-50/95 backdrop-blur">
                      <tr className="border-b border-purple-200">
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-purple-700/80">
                          Decision
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-purple-700/80">
                          Verdict
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-purple-700/80">
                          Decision hash
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrgDecisions.map((d) => {
                        const v = verdictKey(d.verdict);
                        const meta = VERDICT_META[v];
                        const VIcon = meta.icon;
                        const policyName = selectedOrgPolicies.find(
                          (p) => p.id === d.policyId
                        )?.name ?? "—";
                        return (
                          <tr
                            key={d.id}
                            className="border-b border-purple-50 last:border-0 hover:bg-purple-50/50"
                          >
                            <td className="px-3 py-2 align-top">
                              <p className="font-sans text-sm font-medium text-slate-900 line-clamp-2 max-w-[14rem]">
                                {d.decisionText}
                              </p>
                              <p className="mt-0.5 font-sans text-[10px] text-slate-400">
                                {policyName} · {timeAgo(new Date(d.createdAt))}
                              </p>
                              {d.reason && (
                                <p className="mt-1 font-sans text-[10px] text-slate-500 italic line-clamp-2 max-w-[14rem]">
                                  {d.reason}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Badge className={cn("border", meta.cls)}>
                                <VIcon className="h-3 w-3" />
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <code className="font-mono text-[10px] text-slate-500">
                                {shortHash(d.decisionHash, 8, 4)}
                              </code>
                              {d.decisionToken && (
                                <p className="mt-0.5 font-mono text-[9px] text-slate-400">
                                  token: {d.decisionToken.slice(0, 16)}…
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Evaluate decision form */}
              <div className="mt-5 rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50/60 to-indigo-50/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-purple-700">
                    Evaluate decision
                  </h3>
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <Label
                      htmlFor="gaas-decision-policy"
                      className="text-[10px] uppercase tracking-wider text-slate-500"
                    >
                      Policy
                    </Label>
                    <select
                      id="gaas-decision-policy"
                      value={decisionPolicyId}
                      onChange={(e) => setDecisionPolicyId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-purple-200 bg-white px-3 py-2 font-sans text-sm text-slate-900 shadow-xs transition-colors hover:border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                      <option value="">Select a policy…</option>
                      {selectedOrgPolicies.map((p) => {
                        const el = parseEnforcementLogic(p.enforcementLogic);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {el ? ` (threshold ${el.threshold}% · quorum ${el.quorum})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <Label
                      htmlFor="gaas-decision-text"
                      className="text-[10px] uppercase tracking-wider text-slate-500"
                    >
                      Decision text
                    </Label>
                    <Textarea
                      id="gaas-decision-text"
                      value={decisionText}
                      onChange={(e) => setDecisionText(e.target.value)}
                      placeholder="Approve the 1.2M EGP warehouse expansion at the Q3 board meeting, seconded by the audit committee."
                      maxLength={12_000}
                      className="mt-1 min-h-[5rem] border-purple-200 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor="gaas-approver-count"
                        className="text-[10px] uppercase tracking-wider text-slate-500"
                      >
                        Approver count
                      </Label>
                      <Input
                        id="gaas-approver-count"
                        type="number"
                        min={0}
                        max={10_000}
                        value={approverCount}
                        onChange={(e) =>
                          setApproverCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="mt-1 border-purple-200 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="gaas-actor-email"
                        className="text-[10px] uppercase tracking-wider text-slate-500"
                      >
                        Actor email
                      </Label>
                      <Input
                        id="gaas-actor-email"
                        type="email"
                        value={actorEmail}
                        onChange={(e) => setActorEmail(e.target.value)}
                        placeholder="actor@org.com"
                        className="mt-1 border-purple-200 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={resetDecisionForm}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleEvaluateDecision}
                      disabled={evaluatingDecision}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {evaluatingDecision ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Evaluating…
                        </>
                      ) : (
                        <>
                          <Gavel className="h-4 w-4" /> Evaluate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Loading skeleton (shown when an async mutation is in flight on
          the page-level — cards maintain their own per-button spinners) ── */}
      {creatingOrg || creatingPolicy || evaluatingDecision ? (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-fit">
          <div className="flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-2 shadow-lg">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            <span className="font-sans text-xs font-medium text-indigo-700">
              {creatingOrg
                ? "Registering organization…"
                : creatingPolicy
                  ? "Hashing rule + registering policy…"
                  : "CRE evaluating decision…"}
            </span>
          </div>
        </div>
      ) : null}

      {/* ── Custom scrollbar styling (indigo + purple accents) ── */}
      <style jsx>{`
        .gaas-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgb(99 102 241 / 0.4) transparent;
        }
        .gaas-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .gaas-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .gaas-scroll::-webkit-scrollbar-thumb {
          background-color: rgb(99 102 241 / 0.35);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .gaas-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgb(79 70 229 / 0.6);
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "purple" | "emerald" | "rose" | "amber";
}) {
  const toneMap: Record<typeof tone, string> = {
    indigo: "border-indigo-200 bg-white/70 text-indigo-700",
    purple: "border-purple-200 bg-white/70 text-purple-700",
    emerald: "border-emerald-200 bg-white/70 text-emerald-700",
    rose: "border-rose-200 bg-white/70 text-rose-700",
    amber: "border-indigo-200 bg-white/70 text-indigo-700",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 backdrop-blur-sm",
        toneMap[tone]
      )}
    >
      <p className="font-sans text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="font-serif text-xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  tone,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "indigo" | "purple";
  compact?: boolean;
}) {
  const toneCls =
    tone === "indigo"
      ? "border-dashed border-indigo-200 bg-indigo-50/40"
      : "border-dashed border-purple-200 bg-purple-50/40";
  return (
    <div
      className={cn(
        "mt-5 rounded-xl border p-8 text-center",
        toneCls,
        compact && "p-6"
      )}
    >
      <div className="mx-auto flex justify-center">{icon}</div>
      <p className="mt-2 font-sans text-sm font-medium text-slate-700">
        {title}
      </p>
      <p className="mt-1 font-sans text-xs text-slate-500 max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
}

// ── Inline skeleton for the loading state (used when orgs list is still
// being fetched by the server, though server-component pre-fetch makes
// this rarely visible) ──
export function GaasClientSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}

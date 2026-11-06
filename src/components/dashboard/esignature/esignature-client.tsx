"use client";

/**
 * ESignatureClient — E-Signature + Document Automation dashboard UI.
 *
 * Renders:
 *   - Stats grid (total / pending / signed / declined / awaiting-my-signature).
 *   - Create-document panel:
 *       • Tab 1: From template (select a template + fill in variables + pick signers).
 *       • Tab 2: From raw text (paste a document + pick signers).
 *       • Tab 3: Save as template (title + body + variable list + signers).
 *   - Documents list with status badges + per-row actions (Sign / Decline /
 *     Void / Verify).
 *   - Document detail dialog: rendered body, document hash, ledger anchor,
 *     per-signer verification status.
 *
 * All state-changing actions hit /api/e-signature[*] via csrfFetch.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSignature,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
  Plus,
  Search,
  X,
  Eye,
  PenLine,
  Ban,
  Ban as BanIcon,
  Hourglass,
  ScrollText,
  KeyRound,
  XCircle,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

// ── Types ──

type DocumentRow = {
  id: string;
  templateId: string | null;
  ownerId: string;
  enterpriseId: string | null;
  title: string;
  filledBody: string;
  variablesUsed: Record<string, string>;
  documentHash: string;
  status:
    | "draft"
    | "pending"
    | "signed"
    | "declined"
    | "expired"
    | "voided";
  ledgerAnchorHash: string | null;
  ledgerSequence: number | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  signers: Array<{
    id: string;
    signerId: string;
    status: "pending" | "signed" | "declined" | "expired";
    signatureB64: string | null;
    signatureHash: string | null;
    signedAt: string | null;
    declinedAt: string | null;
    declinedReason: string | null;
    createdAt: string;
  }>;
};

type TemplateRow = {
  id: string;
  title: string;
  body: string;
  variables: string[];
  requiredSigners: string[];
  ownerId: string;
  enterpriseId: string | null;
  category: string;
  jurisdiction: string;
  createdAt: string;
  updatedAt: string;
};

type EnterpriseRow = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type SignerRow = {
  userId: string;
  legalName: string;
  email: string;
  role: string;
  hasIdentityAnchor: boolean;
  enterpriseName: string | null;
};

type Stats = {
  total: number;
  pending: number;
  signed: number;
  declined: number;
  expired: number;
  draft: number;
  awaitingMySignature: number;
};

type Props = {
  documents: DocumentRow[];
  templates: TemplateRow[];
  enterprises: EnterpriseRow[];
  signerDirectory: SignerRow[];
  currentUserId: string;
  hasIdentityAnchor: boolean;
  stats: Stats;
};

// ── Status meta ──

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    cls: "text-slate-700 border-slate-400/40 bg-slate-50",
    icon: FileText,
  },
  pending: {
    label: "Pending",
    cls: "text-amber-700 border-amber-500/40 bg-amber-50",
    icon: Hourglass,
  },
  signed: {
    label: "Signed",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100",
    icon: Hourglass,
  },
  voided: {
    label: "Voided",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100",
    icon: Ban,
  },
};

const SIGNER_STATUS_META: Record<
  string,
  { label: string; cls: string }
> = {
  pending: {
    label: "Awaiting",
    cls: "text-amber-700 border-amber-500/40 bg-amber-50",
  },
  signed: {
    label: "Signed",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
  declined: {
    label: "Declined",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
  },
  expired: {
    label: "Expired",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100",
  },
};

// ── Component ──

export function ESignatureClient({
  documents: initialDocuments,
  templates,
  enterprises,
  signerDirectory,
  currentUserId,
  hasIdentityAnchor,
  stats,
}: Props) {
  const router = useRouter();
  const [documents, setDocuments] =
    React.useState<DocumentRow[]>(initialDocuments);
  const [submitting, setSubmitting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<
    "all" | "mine" | "awaiting" | "signed" | "declined"
  >("all");
  const [search, setSearch] = React.useState("");

  // Detail dialog state.
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [verification, setVerification] = React.useState<{
    documentId: string;
    allSignaturesValid: boolean;
    signedCount: number;
    signerCount: number;
    verifications: Array<{
      signerId: string;
      valid: boolean;
      reason: string;
      signatureHash: string | null;
      signedAt: string | null;
      signerIdentityAnchor: string | null;
    }>;
  } | null>(null);

  // ── Create-document form state ──
  const [createMode, setCreateMode] = React.useState<
    "template" | "text" | "template_only"
  >("template");
  const [form, setForm] = React.useState({
    templateId: templates[0]?.id ?? "",
    title: "",
    body: "",
    variablesText: "{}",
    requiredSigners: [] as string[],
    enterpriseId: "",
    expiresAtDays: "30",
    // template_only fields:
    newTemplateTitle: "",
    newTemplateBody: "",
    newTemplateVariables: "",
  });

  // Filtered documents.
  const filtered = documents.filter((d) => {
    if (filter === "mine" && d.ownerId !== currentUserId) return false;
    if (filter === "awaiting") {
      const hasMyPending = d.signers.some(
        (s) => s.signerId === currentUserId && s.status === "pending"
      );
      if (!hasMyPending) return false;
    }
    if (filter === "signed" && d.status !== "signed") return false;
    if (filter === "declined" && d.status !== "declined") return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${d.title} ${d.documentHash}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // ── Submit handlers ──

  async function handleCreateFromTemplate() {
    if (!form.templateId) {
      toast.error("Select a template first");
      return;
    }
    let variables: Record<string, string> = {};
    try {
      variables = JSON.parse(form.variablesText || "{}");
    } catch {
      toast.error("Variables JSON is malformed", {
        description: "Use { \"enterpriseName\": \"Acme Co.\" } format",
      });
      return;
    }
    if (form.expiresAtDays) {
      const days = Number.parseInt(form.expiresAtDays, 10);
      if (Number.isFinite(days) && days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        variables.__expiresAt = d.toISOString();
      }
    }
    setSubmitting(true);
    try {
      const expiresAt = variables.__expiresAt;
      const res = await csrfFetch("/api/e-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "template",
          templateId: form.templateId,
          variables,
          title: form.title || undefined,
          enterpriseId: form.enterpriseId || undefined,
          expiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not create document", {
          description: data?.error ?? "Validation failed",
        });
        return;
      }
      toast.success("Document created", {
        description: `Document ${data.document?.id?.slice(0, 8) ?? ""} ready for signing.`,
      });
      setDocuments((prev) => [data.document, ...prev]);
      setForm((f) => ({ ...f, title: "", variablesText: "{}" }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create document", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateFromText() {
    if (!form.body.trim()) {
      toast.error("Document body is required");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Document title is required");
      return;
    }
    setSubmitting(true);
    try {
      const expiresAt = (() => {
        const days = Number.parseInt(form.expiresAtDays, 10);
        if (!Number.isFinite(days) || days <= 0) return undefined;
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString();
      })();
      const res = await csrfFetch("/api/e-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "text",
          title: form.title,
          body: form.body,
          requiredSigners: form.requiredSigners,
          enterpriseId: form.enterpriseId || undefined,
          expiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not create document", {
          description: data?.error ?? "Validation failed",
        });
        return;
      }
      toast.success("Document created from text", {
        description: `${form.requiredSigners.length} signer(s) requested.`,
      });
      setDocuments((prev) => [data.document, ...prev]);
      setForm((f) => ({ ...f, title: "", body: "" }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create document", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateTemplate() {
    if (!form.newTemplateTitle.trim() || !form.newTemplateBody.trim()) {
      toast.error("Template title and body are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/e-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "template_only",
          title: form.newTemplateTitle,
          body: form.newTemplateBody,
          variables: form.newTemplateVariables
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          requiredSigners: form.requiredSigners,
          enterpriseId: form.enterpriseId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not save template", {
          description: data?.error ?? "Validation failed",
        });
        return;
      }
      toast.success("Template saved", {
        description: `Template "${data.template?.title ?? ""}" created.`,
      });
      setForm((f) => ({
        ...f,
        newTemplateTitle: "",
        newTemplateBody: "",
        newTemplateVariables: "",
      }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not save template", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSign(docId: string) {
    setActingId(docId);
    try {
      const res = await csrfFetch(`/api/e-signature/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Sign failed", {
          description: data?.error ?? "Could not apply signature",
        });
        return;
      }
      toast.success("Signed with Ed25519", {
        description: data.fullySigned
          ? "Document is now fully signed by all required signers."
          : "Signature applied. Awaiting remaining signers.",
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? data.document : d))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not sign", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(docId: string) {
    const reason = window.prompt(
      "Why are you declining to sign? (optional)"
    );
    setActingId(docId);
    try {
      const res = await csrfFetch(`/api/e-signature/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          reason: reason ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Decline failed", { description: data?.error });
        return;
      }
      toast.success("Declined", {
        description: "Your decline is recorded on the ledger.",
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? data.document : d))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not decline", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleVoid(docId: string) {
    if (!window.confirm("Void this document? This cannot be undone.")) return;
    setActingId(docId);
    try {
      const res = await csrfFetch(`/api/e-signature/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Void failed", { description: data?.error });
        return;
      }
      toast.success("Document voided");
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? data.document : d))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not void", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleRequestSigner(docId: string, signerId: string) {
    if (!signerId) return;
    setActingId(docId);
    try {
      const res = await csrfFetch(`/api/e-signature/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", signerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Request failed", { description: data?.error });
        return;
      }
      toast.success("Signer added", {
        description: "An additional signer request has been recorded.",
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? data.document : d))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not add signer", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleVerify(docId: string) {
    setVerifyingId(docId);
    setDetailId(docId);
    setVerification(null);
    try {
      const res = await fetch(`/api/e-signature/${docId}/verify`);
      const data = await res.json();
      if (!res.ok) {
        toast.error("Verify failed", { description: data?.error });
        return;
      }
      setVerification(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not verify", { description: msg });
    } finally {
      setVerifyingId(null);
    }
  }

  const detailDoc = detailId
    ? documents.find((d) => d.id === detailId) ?? null
    : null;

  // ── Render ──

  return (
    <div className="flex flex-col gap-6">
      {/* ── Compliance banner ── */}
      <Alert className="border-gold/30 bg-gold/5">
        <ShieldCheck className="h-4 w-4 text-gold" />
        <AlertTitle className="font-sans text-sm font-semibold text-foreground">
          Egyptian Law 15/2004 · Simple Electronic Signature
        </AlertTitle>
        <AlertDescription className="font-sans text-xs text-muted-foreground">
          Each signature is a real Ed25519 detached signature over a SHA3-256
          document hash, anchored on the constitutional ledger. This is a
          <strong> simple e-signature</strong> — admissible as evidence, but
          without the ITIDA-qualified-certificate legal weight. Where a
          qualified signature is required by law, use the separate qualified
          workflow.
        </AlertDescription>
      </Alert>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          icon={<FileText className="h-4 w-4 text-gold" />}
          label="Total Documents"
          value={String(stats.total)}
          hint={`${stats.draft} in draft`}
        />
        <StatCard
          icon={<Hourglass className="h-4 w-4 text-amber-600" />}
          label="Pending"
          value={String(stats.pending)}
          hint="Awaiting signatures"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Fully Signed"
          value={String(stats.signed)}
          hint="Ledger-anchored"
        />
        <StatCard
          icon={<PenLine className="h-4 w-4 text-rose-600" />}
          label="Awaiting My Signature"
          value={String(stats.awaitingMySignature)}
          hint="You are a requested signer"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-slate-500" />}
          label="Declined / Expired"
          value={String(stats.declined + stats.expired)}
          hint={`${stats.declined} declined · ${stats.expired} expired`}
        />
      </div>

      {/* ── Identity anchor notice ── */}
      {!hasIdentityAnchor && (
        <Alert className="border-amber-400/40 bg-amber-50">
          <KeyRound className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-sans text-sm font-semibold text-amber-900">
            No Ed25519 identity anchor on your account
          </AlertTitle>
          <AlertDescription className="font-sans text-xs text-amber-900/80">
            You won&apos;t be able to sign documents until your account has an
            Ed25519 keypair (provisioned at onboarding). Contact a platform
            admin to provision one.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Create-document panel ── */}
      <Card className="border-gold/15 glass-gold">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-gold" />
            <CardTitle className="font-serif text-lg">
              Create / Save Document
            </CardTitle>
          </div>
          <CardDescription className="font-sans text-xs">
            Three modes: instantiate a saved template, draft a one-off
            document, or save a new reusable template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as typeof createMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template">From Template</TabsTrigger>
              <TabsTrigger value="text">From Text</TabsTrigger>
              <TabsTrigger value="template_only">Save Template</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: From Template ── */}
            <TabsContent value="template" className="mt-4">
              {templates.length === 0 ? (
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-center">
                  <p className="font-sans text-sm text-muted-foreground">
                    No saved templates yet. Switch to{" "}
                    <strong>Save Template</strong> to create one.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Template
                    </Label>
                    <Select
                      value={form.templateId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, templateId: v }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title} · {t.variables.length} vars
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Enterprise (optional)
                    </Label>
                    <Select
                      value={form.enterpriseId}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          enterpriseId: v === "__none__" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="No enterprise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No enterprise</SelectItem>
                        {enterprises.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} · Tier {e.tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Title override (optional)
                    </Label>
                    <Input
                      className="mt-1.5"
                      placeholder="Defaults to the template title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Variables (JSON)
                    </Label>
                    <Textarea
                      className="mt-1.5 font-mono text-xs"
                      rows={4}
                      placeholder='{ "enterpriseName": "EcoPack", "founderName": "Ahmed" }'
                      value={form.variablesText}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          variablesText: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      Available variables in this template:{" "}
                      <code className="text-gold">
                        {templates
                          .find((t) => t.id === form.templateId)
                          ?.variables.join(", ") ?? "—"}
                      </code>
                    </p>
                  </div>

                  <div>
                    <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Expiry (days)
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={1}
                      max={365}
                      value={form.expiresAtDays}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, expiresAtDays: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleCreateFromTemplate}
                      disabled={submitting}
                      className="w-full bg-gold text-black hover:bg-gold/90"
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileSignature className="mr-2 h-4 w-4" />
                      )}
                      Create Document
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 2: From Text ── */}
            <TabsContent value="text" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Title
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="One-off NDA"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Enterprise (optional)
                  </Label>
                  <Select
                    value={form.enterpriseId}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        enterpriseId: v === "__none__" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="No enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No enterprise</SelectItem>
                      {enterprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} · Tier {e.tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Document body
                  </Label>
                  <Textarea
                    className="mt-1.5 font-mono text-xs"
                    rows={8}
                    placeholder="Paste the full document text here..."
                    value={form.body}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, body: e.target.value }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Required signers
                  </Label>
                  <SignerPicker
                    directory={signerDirectory}
                    selected={form.requiredSigners}
                    onChange={(ids) =>
                      setForm((f) => ({ ...f, requiredSigners: ids }))
                    }
                    currentUserId={currentUserId}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Expiry (days)
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={365}
                    value={form.expiresAtDays}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAtDays: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateFromText}
                    disabled={submitting}
                    className="w-full bg-gold text-black hover:bg-gold/90"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSignature className="mr-2 h-4 w-4" />
                    )}
                    Create & Send
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Save Template ── */}
            <TabsContent value="template_only" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Template title
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Standard NDA v2"
                    value={form.newTemplateTitle}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        newTemplateTitle: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Variables (comma-separated)
                  </Label>
                  <Input
                    className="mt-1.5 font-mono text-xs"
                    placeholder="enterpriseName, founderName, date"
                    value={form.newTemplateVariables}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        newTemplateVariables: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Template body (use {"{{variable}}"} placeholders)
                  </Label>
                  <Textarea
                    className="mt-1.5 font-mono text-xs"
                    rows={8}
                    placeholder={"This Agreement is between {{enterpriseName}} and {{founderName}}..."}
                    value={form.newTemplateBody}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        newTemplateBody: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Default required signers
                  </Label>
                  <SignerPicker
                    directory={signerDirectory}
                    selected={form.requiredSigners}
                    onChange={(ids) =>
                      setForm((f) => ({ ...f, requiredSigners: ids }))
                    }
                    currentUserId={currentUserId}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={submitting}
                    className="bg-gold text-black hover:bg-gold/90"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Save Template
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Documents list ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-lg">
                Documents
              </CardTitle>
              <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold">
                {filtered.length} of {documents.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 w-48 pl-7 text-xs"
                  placeholder="Search title or hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as typeof filter)}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All documents</SelectItem>
                  <SelectItem value="mine">Owned by me</SelectItem>
                  <SelectItem value="awaiting">Awaiting my signature</SelectItem>
                  <SelectItem value="signed">Fully signed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gold/15 bg-gold/5 px-6 py-12 text-center">
              <FileSignature className="mb-3 h-10 w-10 text-gold/50" />
              <h3 className="font-sans text-base font-semibold">No documents yet</h3>
              <p className="mt-1 max-w-sm font-sans text-sm text-muted-foreground">
                Create a document above to start the signing workflow. Every
                signature is anchored on the constitutional ledger.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signers</TableHead>
                    <TableHead className="font-mono text-xs">Document Hash</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const meta = STATUS_META[d.status] ?? {
                      label: d.status,
                      cls: "text-slate-700 border-slate-400/40 bg-slate-50",
                      icon: FileText,
                    };
                    const signedCount = d.signers.filter(
                      (s) => s.status === "signed"
                    ).length;
                    const mySigner = d.signers.find(
                      (s) => s.signerId === currentUserId
                    );
                    const canSign =
                      d.status === "pending" &&
                      mySigner?.status === "pending" &&
                      hasIdentityAnchor;
                    const canDecline =
                      d.status === "pending" &&
                      mySigner?.status === "pending";
                    const canVoid =
                      d.ownerId === currentUserId &&
                      d.status !== "signed" &&
                      d.status !== "voided";
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <button
                            className="font-sans text-sm font-medium text-foreground hover:underline"
                            onClick={() => setDetailId(d.id)}
                          >
                            {d.title}
                          </button>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {d.templateId ? "from template" : "ad-hoc"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", meta.cls)}>
                            <meta.icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {signedCount}/{d.signers.length} signed
                          {mySigner && (
                            <span
                              className={cn(
                                "ml-1 inline-block rounded px-1 text-[10px]",
                                mySigner.status === "signed"
                                  ? "text-emerald-700"
                                  : mySigner.status === "declined"
                                    ? "text-rose-700"
                                    : "text-amber-700"
                              )}
                            >
                              · you: {mySigner.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {shortHash(d.documentHash, 10, 4)}
                        </TableCell>
                        <TableCell className="font-sans text-xs text-muted-foreground">
                          {timeAgo(new Date(d.createdAt))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setDetailId(d.id)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            {canSign && (
                              <Button
                                size="sm"
                                className="h-7 bg-gold px-2 text-xs text-black hover:bg-gold/90"
                                disabled={actingId === d.id}
                                onClick={() => handleSign(d.id)}
                              >
                                {actingId === d.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <PenLine className="mr-1 h-3 w-3" />
                                )}
                                Sign
                              </Button>
                            )}
                            {canDecline && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-rose-700"
                                disabled={actingId === d.id}
                                onClick={() => handleDecline(d.id)}
                              >
                                <BanIcon className="mr-1 h-3 w-3" />
                                Decline
                              </Button>
                            )}
                            {canVoid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-muted-foreground"
                                disabled={actingId === d.id}
                                onClick={() => handleVoid(d.id)}
                              >
                                <Ban className="mr-1 h-3 w-3" />
                                Void
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Document detail dialog ── */}
      <Dialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setVerification(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detailDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-gold" />
                  <DialogTitle className="font-serif text-xl">
                    {detailDoc.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="font-sans text-xs">
                  Document ID{" "}
                  <code className="font-mono text-gold">
                    {detailDoc.id}
                  </code>
                  {detailDoc.expiresAt && (
                    <>
                      {" · expires "}
                      {timeAgo(new Date(detailDoc.expiresAt))}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Document metadata */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetaItem
                    label="Status"
                    value={
                      <Badge
                        variant="outline"
                        className={cn(
                          STATUS_META[detailDoc.status]?.cls ??
                            "text-slate-700 border-slate-400/40 bg-slate-50"
                        )}
                      >
                        {STATUS_META[detailDoc.status]?.label ?? detailDoc.status}
                      </Badge>
                    }
                  />
                  <MetaItem
                    label="Signers"
                    value={`${
                      detailDoc.signers.filter((s) => s.status === "signed").length
                    } / ${detailDoc.signers.length}`}
                  />
                  <MetaItem
                    label="Ledger Seq"
                    value={
                      detailDoc.ledgerSequence != null
                        ? `#${detailDoc.ledgerSequence}`
                        : "—"
                    }
                  />
                  <MetaItem
                    label="Created"
                    value={timeAgo(new Date(detailDoc.createdAt))}
                  />
                </div>

                {/* Hashes */}
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Document Hash (SHA3-256)
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleVerify(detailDoc.id)}
                      disabled={verifyingId === detailDoc.id}
                    >
                      {verifyingId === detailDoc.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      )}
                      Verify
                    </Button>
                  </div>
                  <p className="mt-1 break-all font-mono text-[10px] text-gold">
                    {detailDoc.documentHash}
                  </p>
                  {detailDoc.ledgerAnchorHash && (
                    <>
                      <span className="mt-2 block font-sans text-xs uppercase tracking-wider text-muted-foreground">
                        Ledger Anchor
                      </span>
                      <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                        {detailDoc.ledgerAnchorHash}
                      </p>
                    </>
                  )}
                </div>

                {/* Verification result */}
                {verification && (
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      verification.allSignaturesValid
                        ? "border-emerald-400/40 bg-emerald-50"
                        : "border-rose-400/40 bg-rose-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {verification.allSignaturesValid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="font-sans text-sm font-semibold">
                        {verification.allSignaturesValid
                          ? "All signatures valid"
                          : "Verification failed"}
                      </span>
                      <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                        {verification.signedCount}/{verification.signerCount} verified
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {verification.verifications.map((v) => {
                        const signer = signerDirectory.find(
                          (s) => s.userId === v.signerId
                        );
                        return (
                          <div
                            key={v.signerId}
                            className="flex items-center justify-between font-sans text-xs"
                          >
                            <span>
                              {signer?.legalName ?? "Unknown signer"}
                              {v.signerId === currentUserId && " (you)"}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                v.valid
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              )}
                            >
                              {v.valid ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {v.status === "signed"
                                ? v.valid
                                  ? "Verified"
                                  : v.reason
                                : v.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Document body */}
                <div>
                  <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Document Body
                  </span>
                  <pre className="mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-gold/15 bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap text-foreground">
                    {detailDoc.filledBody}
                  </pre>
                </div>

                {/* Signers list */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Signers ({detailDoc.signers.length})
                    </span>
                    {detailDoc.ownerId === currentUserId &&
                      detailDoc.status === "pending" && (
                        <AddSignerControl
                          directory={signerDirectory}
                          existingSignerIds={detailDoc.signers.map(
                            (s) => s.signerId
                          )}
                          onAdd={(signerId) =>
                            handleRequestSigner(detailDoc.id, signerId)
                          }
                          disabled={actingId === detailDoc.id}
                        />
                      )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {detailDoc.signers.map((s) => {
                      const signer = signerDirectory.find(
                        (dir) => dir.userId === s.signerId
                      );
                      const meta = SIGNER_STATUS_META[s.status] ?? {
                        label: s.status,
                        cls: "text-slate-700 border-slate-400/40 bg-slate-50",
                      };
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-gold/15 bg-muted/20 px-3 py-2"
                        >
                          <div>
                            <p className="font-sans text-sm font-medium">
                              {signer?.legalName ?? "Unknown signer"}
                              {s.signerId === currentUserId && (
                                <span className="ml-1 text-xs text-gold">(you)</span>
                              )}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {signer?.email ?? s.signerId.slice(0, 12)}
                              {!signer?.hasIdentityAnchor && (
                                <span className="ml-1 text-amber-600">
                                  · no Ed25519 anchor
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", meta.cls)}
                            >
                              {meta.label}
                            </Badge>
                            {s.signedAt && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {new Date(s.signedAt).toLocaleString()}
                              </span>
                            )}
                            {s.signatureHash && (
                              <span className="font-mono text-[9px] text-muted-foreground/70">
                                sig: {shortHash(s.signatureHash, 8, 4)}
                              </span>
                            )}
                            {s.declinedReason && (
                              <span className="font-sans text-[10px] text-rose-700">
                                “{s.declinedReason}”
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailId(null);
                    setVerification(null);
                  }}
                >
                  Close
                </Button>
                {detailDoc.status === "pending" &&
                  detailDoc.signers.some(
                    (s) =>
                      s.signerId === currentUserId && s.status === "pending"
                  ) &&
                  hasIdentityAnchor && (
                    <Button
                      className="bg-gold text-black hover:bg-gold/90"
                      disabled={actingId === detailDoc.id}
                      onClick={() => handleSign(detailDoc.id)}
                    >
                      {actingId === detailDoc.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PenLine className="mr-2 h-4 w-4" />
                      )}
                      Sign with Ed25519
                    </Button>
                  )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gold/15 glass-gold p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-serif text-2xl font-semibold text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-0.5 font-sans text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function SignerPicker({
  directory,
  selected,
  onChange,
  currentUserId,
}: {
  directory: SignerRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
  currentUserId: string;
}) {
  const [open, setOpen] = React.useState(false);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedNames = selected
    .map(
      (id) =>
        directory.find((d) => d.userId === id)?.legalName ?? id.slice(0, 8)
    )
    .join(", ");

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          {selected.length === 0
            ? "Add signers…"
            : `${selected.length} signer(s) selected`}
        </Button>
        {selected.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => onChange([])}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      <p className="mt-1 font-sans text-[11px] text-muted-foreground truncate">
        {selectedNames || "No signers selected yet"}
      </p>
      {open && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gold/15 bg-background p-2">
          {directory.map((s) => {
            const isSelected = selected.includes(s.userId);
            return (
              <button
                key={s.userId}
                type="button"
                onClick={() => toggle(s.userId)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted/40",
                  isSelected && "bg-gold/10"
                )}
              >
                <div>
                  <p className="font-sans text-xs font-medium">
                    {s.legalName}
                    {s.userId === currentUserId && " (you)"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {s.email} · {s.role}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!s.hasIdentityAnchor && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-50 text-[9px] text-amber-700"
                    >
                      no anchor
                    </Badge>
                  )}
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </div>
              </button>
            );
          })}
          {directory.length === 0 && (
            <p className="px-2 py-4 text-center font-sans text-xs text-muted-foreground">
              No potential signers. Join or found an enterprise first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddSignerControl({
  directory,
  existingSignerIds,
  onAdd,
  disabled,
}: {
  directory: SignerRow[];
  existingSignerIds: string[];
  onAdd: (signerId: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState("");
  const available = directory.filter(
    (s) => !existingSignerIds.includes(s.userId)
  );
  if (available.length === 0) return null;
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onAdd(v);
        setValue("");
      }}
    >
      <SelectTrigger className="h-7 w-44 text-xs" disabled={disabled}>
        <SelectValue placeholder="+ Add signer" />
      </SelectTrigger>
      <SelectContent>
        {available.map((s) => (
          <SelectItem key={s.userId} value={s.userId}>
            {s.legalName} ({s.role})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

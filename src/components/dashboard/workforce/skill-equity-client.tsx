"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  ChevronRight,
  XCircle,
  Loader2,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { egp } from "@/lib/aurienta/format";

type Employment = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  position: string;
  department: string;
  hireDate: string;
  tenureMonths: number;
  eligible: boolean;
  monthlySalaryEgp: number;
  equityConversionPct: number;
};

type Claim = {
  id: string;
  enterpriseName: string;
  credentialType: string;
  credentialName: string;
  issuer: string;
  status: string;
  equityGrantPct: number;
  tenureMonths: number;
  documentName: string;
  aiAssessment: string | null;
  submittedAt: string;
};

export function SkillEquityClient({
  user,
  employment,
  claims,
}: {
  user: { legalName: string; sovereignTrustScore: number };
  employment: Employment[];
  claims: Claim[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedEmp, setSelectedEmp] = React.useState<Employment | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    credentialType: "certification",
    credentialName: "",
    issuer: "",
    credentialId: "",
    issueDate: "",
    documentName: "",
  });

  function openClaim(emp: Employment) {
    setSelectedEmp(emp);
    setForm({ credentialType: "certification", credentialName: "", issuer: "", credentialId: "", issueDate: "", documentName: "" });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!selectedEmp) return;
    if (!form.credentialName || !form.issuer || !form.issueDate || !form.documentName) {
      toast.error("Missing fields", { description: "All fields including a document are required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/skill-equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          enterpriseId: selectedEmp.enterpriseId,
          credentialType: form.credentialType,
          credentialName: form.credentialName,
          issuer: form.issuer,
          credentialId: form.credentialId || undefined,
          issueDate: form.issueDate,
          documentName: form.documentName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      toast.success("Skill claim submitted", {
        description: "Pending board review. AI assessment will be generated.",
      });
      setDialogOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("Could not submit", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const eligibleCount = employment.filter((e) => e.eligible).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <Award className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
            Invest in Yourself
          </span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold">Skill-to-Equity Accelerator</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
          Recognize documented skill acquisitions with discretionary equity grants from the board&apos;s 2% discretionary pool.
          <span className="text-gold-light"> Eligibility: 24+ months of continuous employment</span> at the enterprise,
          with verified proof of skill acquisition.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-gold/10 bg-background/40 px-4 py-2.5">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Eligible roles</p>
            <p className="font-serif text-xl font-semibold text-gold-light">{eligibleCount}</p>
          </div>
          <div className="rounded-xl border border-gold/10 bg-background/40 px-4 py-2.5">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Claims submitted</p>
            <p className="font-serif text-xl font-semibold">{claims.length}</p>
          </div>
          <div className="rounded-xl border border-gold/10 bg-background/40 px-4 py-2.5">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Approved equity</p>
            <p className="font-serif text-xl font-semibold text-gold-light">
              {claims.filter((c) => c.status === "approved").reduce((s, c) => s + c.equityGrantPct, 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Employment tenure cards */}
      <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <h2 className="mb-4 font-serif text-lg font-semibold">Your employment tenure</h2>
        {employment.length === 0 ? (
          <p className="py-6 text-center font-sans text-sm text-muted-foreground">
            You are not registered as a workforce partner at any enterprise.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {employment.map((emp) => {
              const progress = Math.min((emp.tenureMonths / 24) * 100, 100);
              return (
                <div
                  key={emp.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    emp.eligible ? "border-emerald-400/25 bg-emerald-400/[0.03]" : "border-gold/10 bg-background/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-base font-semibold">{emp.enterpriseName}</p>
                        <Badge variant="outline" className="border-gold/20 text-xs text-gold/70">
                          T{emp.enterpriseTier}
                        </Badge>
                      </div>
                      <p className="font-sans text-xs text-muted-foreground">
                        {emp.position} · {emp.department} · {egp(emp.monthlySalaryEgp)}/mo
                      </p>
                    </div>
                    {emp.eligible ? (
                      <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Eligible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400/30 text-amber-400">
                        <Clock className="mr-1 h-3 w-3" /> {24 - emp.tenureMonths}mo to go
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between font-sans text-xs text-muted-foreground">
                      <span>Tenure: {emp.tenureMonths} / 24 months</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="mt-1 h-1.5" />
                  </div>
                  {emp.eligible && (
                    <Button
                      onClick={() => openClaim(emp)}
                      size="sm"
                      className="mt-3 h-8 gap-1.5 rounded-full bg-gold-gradient text-xs font-semibold text-black"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Submit skill claim
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing claims */}
      {claims.length > 0 && (
        <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold">Your skill claims</h2>
          <div className="flex flex-col gap-3">
            {claims.map((c) => (
              <div key={c.id} className="rounded-xl border border-gold/10 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-gold/70" />
                      <p className="truncate font-sans text-sm font-medium">{c.credentialName}</p>
                    </div>
                    <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                      {c.enterpriseName} · {c.issuer} · {c.credentialType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                      Tenure at submission: {c.tenureMonths} months · Document: {c.documentName}
                    </p>
                    {c.aiAssessment && (
                      <div className="mt-2 rounded-lg border border-gold/10 bg-gold/[0.03] p-2.5">
                        <p className="flex items-center gap-1.5 font-sans text-xs font-medium text-gold/80">
                          <Sparkles className="h-3 w-3" /> AI Assessment
                        </p>
                        <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
                          {c.aiAssessment}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {c.status === "approved" ? (
                      <Badge className="bg-emerald-400/10 text-emerald-400">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> +{c.equityGrantPct}%
                      </Badge>
                    ) : c.status === "rejected" ? (
                      <Badge variant="outline" className="border-red-400/30 text-red-400">
                        <XCircle className="mr-1 h-3 w-3" /> Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400/30 text-amber-400">
                        <Clock className="mr-1 h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit claim dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-gold/20 bg-popover">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Submit skill claim</DialogTitle>
            <DialogDescription>
              {selectedEmp?.enterpriseName} — tenure {selectedEmp?.tenureMonths} months (eligible).
              Upload proof of skill acquisition for board review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Credential type</Label>
              <Select value={form.credentialType} onValueChange={(v) => setForm({ ...form, credentialType: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                  <SelectItem value="training_course">Training course</SelectItem>
                  <SelectItem value="professional_license">Professional license</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Credential name</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. PMP Certification, AWS Solutions Architect"
                value={form.credentialName}
                onChange={(e) => setForm({ ...form, credentialName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Issuer</Label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. PMI, Amazon Web Services"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Issue date</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Credential ID (optional)</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. PMP-1234567"
                value={form.credentialId}
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Proof document (PDF/JPG/PNG)</Label>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/25 bg-gold/[0.02] py-6 transition-colors hover:border-gold/40 hover:bg-gold/[0.04]">
                <Upload className="h-5 w-5 text-gold/60" />
                <span className="font-sans text-xs text-muted-foreground">
                  {form.documentName || "Click to upload proof document"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm({ ...form, documentName: f.name });
                  }}
                />
              </label>
              <p className="mt-1.5 font-sans text-xs text-muted-foreground/80">
                Uploaded to IPFS (content-addressed, immutable). AI will verify against issuer registries.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gold-gradient font-semibold text-black"
            >
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Submit claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

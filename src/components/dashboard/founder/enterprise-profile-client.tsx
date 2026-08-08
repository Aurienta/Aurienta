"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2, Crown, Globe, Github, Linkedin, Twitter, FileText,
  Video, Users, Wallet, Scale, GraduationCap, ShieldCheck,
  ExternalLink, AlertTriangle, Edit3, Save, X, CheckCircle2,
  ExternalLink as LinkIcon, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoldStar } from "@/components/aurienta-logo";
import { egp, pct, shortHash } from "@/lib/aurienta/format";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  sector: string;
  tier: string;
  stage: string;
  legalForm: string;
  fundraisingGoalEgp: number;
  raisedEgp: number;
  equityUnitPriceEgp: number;
  totalEquityUnits: number;
  founderEquityPct: number;
  lawFirmClientAccountBalanceEgp: number;
  graduationReadiness: number;
  healthScore: number;
  healthRating: string | null;
  nosiCompliantPct: number;
  policeClearanceValid: boolean;
  consultingOptOut: boolean;
  status: string;
  monthlyRevenueEgp: number;
  monthlyBurnEgp: number;
  employeeCount: number;
  website: string | null;
  logoUrl: string | null;
  mission: string | null;
  vision: string | null;
  problem: string | null;
  solution: string | null;
  productService: string | null;
  targetMarket: string | null;
  revenueModel: string | null;
  currentCustomers: string | null;
  pitchDeckUrl: string | null;
  founderVideoUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  founderBio: string | null;
  founderStatement: string | null;
  founderRequest: string | null;
  evidenceLevel: string;
  submissionStatus: string;
  founder: { id: string; legalName: string; sovereignTrustScore: number };
  _count: { ownershipRecords: number; employees: number; proposals: number; ledgerEvents: number; documents: number };
};

const EVIDENCE_LABELS: Record<string, string> = {
  E0: "Founder Assumption",
  E1: "Market Hypothesis",
  E2: "Customer Conversation",
  E3: "Qualified Opportunity",
  E4: "Proposal / Commitment",
  E5: "Signed Agreement",
  E6: "Active Deployment",
  E7: "Measured Outcome",
  E8: "Collected Revenue",
  E9: "Repeatable Outcome",
};

export function EnterpriseProfileClient({
  enterprise,
  tierMeta,
  stageMeta,
  sectorLabel,
  canEdit,
  constitutionalHash,
}: {
  enterprise: Enterprise;
  tierMeta: { name: string; legalForm: string; maxRaise: string; founderEquity: string; fee: string; erp: string; audit: string; trait: string } | null;
  stageMeta: { name: string; role: string; duration: string } | null;
  sectorLabel: string;
  canEdit: boolean;
  constitutionalHash: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    website: enterprise.website ?? "",
    mission: enterprise.mission ?? "",
    vision: enterprise.vision ?? "",
    problem: enterprise.problem ?? "",
    solution: enterprise.solution ?? "",
    productService: enterprise.productService ?? "",
    targetMarket: enterprise.targetMarket ?? "",
    revenueModel: enterprise.revenueModel ?? "",
    currentCustomers: enterprise.currentCustomers ?? "",
    pitchDeckUrl: enterprise.pitchDeckUrl ?? "",
    founderVideoUrl: enterprise.founderVideoUrl ?? "",
    githubUrl: enterprise.githubUrl ?? "",
    linkedinUrl: enterprise.linkedinUrl ?? "",
    twitterUrl: enterprise.twitterUrl ?? "",
    founderBio: enterprise.founderBio ?? "",
    founderStatement: enterprise.founderStatement ?? "",
    founderRequest: enterprise.founderRequest ?? "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/enterprises/${enterprise.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Enterprise profile updated");
      setEditing(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm({
      website: enterprise.website ?? "",
      mission: enterprise.mission ?? "",
      vision: enterprise.vision ?? "",
      problem: enterprise.problem ?? "",
      solution: enterprise.solution ?? "",
      productService: enterprise.productService ?? "",
      targetMarket: enterprise.targetMarket ?? "",
      revenueModel: enterprise.revenueModel ?? "",
      currentCustomers: enterprise.currentCustomers ?? "",
      pitchDeckUrl: enterprise.pitchDeckUrl ?? "",
      founderVideoUrl: enterprise.founderVideoUrl ?? "",
      githubUrl: enterprise.githubUrl ?? "",
      linkedinUrl: enterprise.linkedinUrl ?? "",
      twitterUrl: enterprise.twitterUrl ?? "",
      founderBio: enterprise.founderBio ?? "",
      founderStatement: enterprise.founderStatement ?? "",
      founderRequest: enterprise.founderRequest ?? "",
    });
    setEditing(false);
  };

  const remaining = enterprise.fundraisingGoalEgp - enterprise.raisedEgp;
  const progressPct = enterprise.fundraisingGoalEgp > 0 ? (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
              Institutional Enterprise Profile · Evidence Level {enterprise.evidenceLevel}
            </span>
          </div>
          {canEdit && !editing && (
            <Button size="sm" variant="outline" className="border-gold/20" onClick={() => setEditing(true)}>
              <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit Profile
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancel} disabled={saving}>
                <X className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" className="bg-gold text-black hover:bg-gold/90" onClick={save} disabled={saving}>
                <Save className="mr-1 h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">{enterprise.name}</h1>
        {enterprise.tagline && <p className="font-sans text-sm text-muted-foreground">{enterprise.tagline}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">Tier {enterprise.tier} — {tierMeta?.name}</Badge>
          <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{sectorLabel}</Badge>
          <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{stageMeta?.name ?? enterprise.stage}</Badge>
          <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{enterprise.legalForm}</Badge>
          <Badge variant="outline" className={`font-mono text-[10px] ${enterprise.status === "active" ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}>
            {enterprise.status}
          </Badge>
        </div>
      </header>

      {/* Evidence Warning */}
      <div className="mb-6 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          <p className="font-sans text-[11px] text-amber-300">
            Evidence Level: <strong>{enterprise.evidenceLevel}</strong> — {EVIDENCE_LABELS[enterprise.evidenceLevel] ?? "Unknown"}.
            All claims are evidence-tagged. Unverified information is labeled <strong>FOUNDER-PROVIDED</strong>, not <strong>VERIFIED</strong>.
            No claims of customers, partners, regulatory approval, or revenue are made without evidence.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="founder">Founder</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="constitutional">Constitutional</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="font-serif text-sm">Mission & Vision</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ProfileField label="Mission" value={enterprise.mission} editing={editing} formValue={form.mission} onChange={(v) => update("mission", v)} />
                <ProfileField label="Vision" value={enterprise.vision} editing={editing} formValue={form.vision} onChange={(v) => update("vision", v)} />
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="font-serif text-sm">Problem & Solution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ProfileField label="Problem" value={enterprise.problem} editing={editing} formValue={form.problem} onChange={(v) => update("problem", v)} />
                <ProfileField label="Solution" value={enterprise.solution} editing={editing} formValue={form.solution} onChange={(v) => update("solution", v)} />
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="font-serif text-sm">Product & Market</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ProfileField label="Product / Service" value={enterprise.productService} editing={editing} formValue={form.productService} onChange={(v) => update("productService", v)} />
                <ProfileField label="Target Market" value={enterprise.targetMarket} editing={editing} formValue={form.targetMarket} onChange={(v) => update("targetMarket", v)} />
                <ProfileField label="Revenue Model" value={enterprise.revenueModel} editing={editing} formValue={form.revenueModel} onChange={(v) => update("revenueModel", v)} />
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="font-serif text-sm">Current Status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Monthly Revenue</span><span className="font-mono text-[11px]">{egp(enterprise.monthlyRevenueEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Monthly Burn</span><span className="font-mono text-[11px]">{egp(enterprise.monthlyBurnEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Employees</span><span className="font-mono text-[11px]">{enterprise.employeeCount}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">NOSI Compliance</span><span className="font-mono text-[11px]">{pct(enterprise.nosiCompliantPct)}</span></div>
                <ProfileField label="Current Customers (if any)" value={enterprise.currentCustomers} editing={editing} formValue={form.currentCustomers} onChange={(v) => update("currentCustomers", v)} hint="0 if pre-revenue — do not fabricate" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FOUNDER */}
        <TabsContent value="founder">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Crown className="h-4 w-4 text-gold" /> Founding Operator</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Legal Name</span><span className="font-sans text-[11px] font-medium">{enterprise.founder.legalName}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Sovereign Trust Score</span><span className="font-mono text-[11px] text-gold">{enterprise.founder.sovereignTrustScore}/100</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Founder Equity</span><span className="font-mono text-[11px]">{pct(enterprise.founderEquityPct)}</span></div>
                <ProfileField label="Professional Biography" value={enterprise.founderBio} editing={editing} formValue={form.founderBio} onChange={(v) => update("founderBio", v)} multiline />
                <ProfileField label="Founder Statement" value={enterprise.founderStatement} editing={editing} formValue={form.founderStatement} onChange={(v) => update("founderStatement", v)} multiline />
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="font-serif text-sm">Founder Request</CardTitle></CardHeader>
              <CardContent>
                <ProfileField
                  label="What specifically do you need from the AURIENTA ecosystem?"
                  value={enterprise.founderRequest}
                  editing={editing}
                  formValue={form.founderRequest}
                  onChange={(v) => update("founderRequest", v)}
                  multiline
                  hint="Capital / Workforce / Strategic Partner / Law/Accounting / Governance / Enterprise Formation / Market Access / Technical / Regulatory"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CAPITAL */}
        <TabsContent value="capital">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Wallet className="h-4 w-4 text-gold" /> Capital Formation</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Capital Formation Goal</span><span className="font-mono text-[11px] text-gold">{egp(enterprise.fundraisingGoalEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Capital Participated</span><span className="font-mono text-[11px]">{egp(enterprise.raisedEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Remaining</span><span className="font-mono text-[11px]">{egp(remaining)}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/50">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(progressPct, 100)}%` }} />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{pct(progressPct)} of goal</p>
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><ShieldCheck className="h-4 w-4 text-gold" /> Zero Custody / Constitutional</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Equity Unit Price (CPP)</span><span className="font-mono text-[11px]">{egp(enterprise.equityUnitPriceEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Total Equity Units</span><span className="font-mono text-[11px]">{enterprise.totalEquityUnits.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Law Firm Client Account</span><span className="font-mono text-[11px]">{egp(enterprise.lawFirmClientAccountBalanceEgp)}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Ownership Records</span><span className="font-mono text-[11px]">{enterprise._count.ownershipRecords}</span></div>
                <div className="mt-2 rounded border border-emerald-400/15 bg-emerald-400/5 p-2">
                  <p className="font-sans text-[10px] text-emerald-300">✓ Zero Custody: AURIENTA never holds funds. Capital flows to Law Firm Client Account (Amendment IX).</p>
                </div>
                <div className="rounded border border-gold/10 bg-background/30 p-2">
                  <p className="font-sans text-[10px] text-muted-foreground">Fundamental Pricing: ±5% price band enforced by CRE. No speculation.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WORKFORCE */}
        <TabsContent value="workforce">
          <Card className="border-gold/12 glass">
            <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Users className="h-4 w-4 text-gold" /> Workforce Registry</CardTitle></CardHeader>
            <CardContent>
              <p className="font-sans text-[11px] text-muted-foreground">
                The enterprise has {enterprise.employeeCount} workforce member(s). Detailed workforce registry with positions, departments, compensation bands, NOSI status, and equity conversion is available in the Workforce Registry dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">NOSI: {pct(enterprise.nosiCompliantPct)}</Badge>
                <Badge variant="outline" className={`font-mono text-[10px] ${enterprise.policeClearanceValid ? "border-emerald-400/30 text-emerald-300" : "border-rose-400/30 text-rose-300"}`}>
                  Police Clearance: {enterprise.policeClearanceValid ? "Valid" : "Expired"}
                </Badge>
                <a href="/dashboard/workforce" className="text-gold hover:underline font-sans text-[11px]">View Workforce Registry →</a>
                <a href="/dashboard/skill-equity" className="text-gold hover:underline font-sans text-[11px]">View Skill Equity →</a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOVERNANCE */}
        <TabsContent value="governance">
          <Card className="border-gold/12 glass">
            <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Scale className="h-4 w-4 text-gold" /> Constitutional Governance</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Stage</span><span className="font-sans text-[11px]">{stageMeta?.name ?? enterprise.stage}</span></div>
              <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">CRE Role</span><span className="font-sans text-[11px]">{stageMeta?.role ?? "—"}</span></div>
              <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Proposals</span><span className="font-mono text-[11px]">{enterprise._count.proposals}</span></div>
              <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Ledger Events</span><span className="font-mono text-[11px]">{enterprise._count.ledgerEvents}</span></div>
              <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Consulting Opt-Out</span><span className="font-mono text-[11px]">{enterprise.consultingOptOut ? "Active" : "Not Activated"}</span></div>
              <div className="mt-2 rounded border border-gold/10 bg-background/30 p-2">
                <p className="font-sans text-[10px] text-muted-foreground">Governance: 9 proposal types (budget, manager appointment/removal, dividend, constitutional amendment, graduation, consulting opt-out, law firm replacement, emergency freeze). Quorum, cooling-off, and supermajority enforced by CRE.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card className="border-gold/12 glass">
            <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><FileText className="h-4 w-4 text-gold" /> Document Room ({enterprise._count.documents})</CardTitle></CardHeader>
            <CardContent>
              <p className="font-sans text-[11px] text-muted-foreground">
                Institutional document room for due-diligence. Each document is evidence-tagged (E0-E9), verification-statused, and visibility-classified.
              </p>
              <div className="mt-3">
                <ProfileField label="Pitch Deck URL" value={enterprise.pitchDeckUrl} editing={editing} formValue={form.pitchDeckUrl} onChange={(v) => update("pitchDeckUrl", v)} hint="PDF, PPT, or PPTX URL" />
              </div>
              <div className="mt-3">
                <ProfileField label="Founder Video URL (optional)" value={enterprise.founderVideoUrl} editing={editing} formValue={form.founderVideoUrl} onChange={(v) => update("founderVideoUrl", v)} hint="YouTube, Vimeo, or direct video URL — 2-5 min recommended" />
              </div>
              {enterprise._count.documents > 0 && (
                <p className="mt-3 font-sans text-[11px] text-gold">{enterprise._count.documents} document(s) attached</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINKS */}
        <TabsContent value="links">
          <Card className="border-gold/12 glass">
            <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><LinkIcon className="h-4 w-4 text-gold" /> External Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ProfileField label="Website" value={enterprise.website} editing={editing} formValue={form.website} onChange={(v) => update("website", v)} icon={<Globe className="h-3.5 w-3.5 text-muted-foreground" />} />
              <ProfileField label="GitHub / GitLab" value={enterprise.githubUrl} editing={editing} formValue={form.githubUrl} onChange={(v) => update("githubUrl", v)} icon={<Github className="h-3.5 w-3.5 text-muted-foreground" />} />
              <ProfileField label="LinkedIn" value={enterprise.linkedinUrl} editing={editing} formValue={form.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} icon={<Linkedin className="h-3.5 w-3.5 text-muted-foreground" />} />
              <ProfileField label="X / Twitter" value={enterprise.twitterUrl} editing={editing} formValue={form.twitterUrl} onChange={(v) => update("twitterUrl", v)} icon={<Twitter className="h-3.5 w-3.5 text-muted-foreground" />} />
              <p className="font-sans text-[10px] text-muted-foreground">All external links are labeled "Founder-provided" unless externally verified. No automatic endorsement implied.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONSTITUTIONAL */}
        <TabsContent value="constitutional">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><ShieldCheck className="h-4 w-4 text-gold" /> Constitutional Health</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <HealthRow label="CRE Status" status="active" />
                <HealthRow label="Zero Custody" status="enforced" />
                <HealthRow label="Ownership Ledger" status="active" />
                <HealthRow label="Fundamental Pricing" status="enforced" />
                <HealthRow label="Governance" status={enterprise._count.proposals > 0 ? "active" : "not_yet_established"} />
                <HealthRow label="Workforce Transparency" status={enterprise.employeeCount > 0 ? "active" : "no_workforce"} />
                <HealthRow label="Evidence Level" status={enterprise.evidenceLevel} />
                <HealthRow label="Graduation Readiness" status={`${enterprise.graduationReadiness}/100`} />
              </CardContent>
            </Card>
            <Card className="border-gold/12 glass">
              <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><GraduationCap className="h-4 w-4 text-gold" /> Tier & Graduation</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Current Tier</span><span className="font-mono text-[11px] text-gold">Tier {enterprise.tier} — {tierMeta?.name}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Legal Form</span><span className="font-mono text-[11px]">{enterprise.legalForm}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Max Raise</span><span className="font-mono text-[11px]">{tierMeta?.maxRaise}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Founder Equity</span><span className="font-mono text-[11px]">{tierMeta?.founderEquity}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Fees</span><span className="font-mono text-[11px]">{tierMeta?.fee}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Audit</span><span className="font-mono text-[11px]">{tierMeta?.audit}</span></div>
                <div className="flex justify-between"><span className="font-sans text-[11px] text-muted-foreground">Graduation Readiness</span><span className="font-mono text-[11px] text-gold">{enterprise.graduationReadiness}/100</span></div>
                <div className="mt-2 rounded border border-gold/10 bg-background/30 p-2">
                  <p className="font-sans text-[10px] text-muted-foreground">
                    Graduation: When readiness reaches 100% (9 gates passed), the enterprise can graduate to Sovereign Enterprise status —
                    independent operation without permanent AURIENTA dependency. AURIENTA succeeds when it is no longer needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Constitutional Hash */}
      <div className="mt-6 flex items-center gap-2 border-t border-gold/8 pt-4">
        <GoldStar className="h-3 w-3 text-gold/50" />
        <span className="font-mono text-[10px] text-muted-foreground">
          Constitutional Hash: {shortHash(constitutionalHash)} · Founder: Mohamed Eltonsy — Founder & Sole Owner — 100%
        </span>
      </div>
    </div>
  );
}

function ProfileField({
  label, value, editing, formValue, onChange, multiline, hint, icon,
}: {
  label: string;
  value: string | null;
  editing: boolean;
  formValue: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  if (editing) {
    return (
      <div>
        <Label className="mb-1 flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
          {icon} {label}
        </Label>
        {multiline ? (
          <Textarea
            value={formValue}
            onChange={(e) => onChange(e.target.value)}
            className="border-gold/15 bg-background/60 font-sans text-sm"
            rows={3}
          />
        ) : (
          <Input
            value={formValue}
            onChange={(e) => onChange(e.target.value)}
            className="border-gold/15 bg-background/60 font-sans text-sm"
          />
        )}
        {hint && <p className="mt-0.5 font-sans text-[10px] text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  return (
    <div>
      <Label className="mb-0.5 flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
        {icon} {label}
      </Label>
      <p className="font-sans text-[11px] text-foreground">
        {value || <span className="italic text-muted-foreground">Not provided</span>}
      </p>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  const isGood = ["active", "enforced", "E5", "E6", "E7", "E8", "E9"].includes(status);
  const isNeutral = ["not_yet_established", "no_workforce", "E0", "E1", "E2"].includes(status);

  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[11px] text-muted-foreground">{label}</span>
      <Badge variant="outline" className={`font-mono text-[10px] ${
        isGood ? "border-emerald-400/30 text-emerald-300" :
        isNeutral ? "border-amber-400/30 text-amber-300" :
        "border-muted-foreground/30 text-muted-foreground"
      }`}>
        {status === "not_yet_established" ? "NOT YET ESTABLISHED" : status}
      </Badge>
    </div>
  );
}

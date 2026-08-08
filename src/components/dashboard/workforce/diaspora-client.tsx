"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Globe,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Languages,
  TrendingUp,
  Building2,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { egp } from "@/lib/aurienta/format";

type Profile = {
  countryOfResidence: string;
  remittanceIntentEgp: number;
  fxLockedRate: number | null;
  fxLockedUntil: string | null;
  documentsVerified: boolean;
  preferredLanguage: string;
  sourceOfFundsDeclared: boolean;
};

type Opp = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  equityUnitPriceEgp: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  healthRating: string | null;
};

const COUNTRIES = ["UAE", "UK", "US", "Canada", "Saudi Arabia", "Other"];
const LANGS = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "fr", label: "Français" },
  { value: "sw", label: "Kiswahili" },
];

export function DiasporaClient({
  user,
  profile,
  opportunities,
}: {
  user: { legalName: string; email: string; sovereignTrustScore: number };
  profile: Profile | null;
  opportunities: Opp[];
}) {
  const router = useRouter();
  const [setup, setSetup] = React.useState(!profile);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    countryOfResidence: profile?.countryOfResidence ?? "UAE",
    remittanceIntentEgp: profile?.remittanceIntentEgp?.toString() ?? "",
    preferredLanguage: profile?.preferredLanguage ?? "en",
    sourceOfFundsDeclared: profile?.sourceOfFundsDeclared ?? false,
  });

  async function handleSubmit() {
    if (!form.sourceOfFundsDeclared) {
      toast.error("Source-of-funds declaration required", {
        description: "Enhanced due diligence for cross-border >50,000 EGP.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/diaspora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryOfResidence: form.countryOfResidence,
          remittanceIntentEgp: parseInt(form.remittanceIntentEgp) || 0,
          preferredLanguage: form.preferredLanguage,
          sourceOfFundsDeclared: form.sourceOfFundsDeclared,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Diaspora profile created", {
        description: "FX reference rate held for 48h (CBE reference).",
      });
      setSetup(false);
      router.refresh();
    } catch (e) {
      toast.error("Could not save profile", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  if (setup) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-gold" />
            <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Diaspora Participation Bridge
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold">Welcome home, {user.legalName.split(" ")[0]}.</h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Egyptians abroad can deploy capital into real-economy enterprises back home —
            constitutionally protected, zero custody, FX-locked at the point of reservation.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Country of residence</Label>
              <Select value={form.countryOfResidence} onValueChange={(v) => setForm({ ...form, countryOfResidence: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Remittance intent (EGP)</Label>
              <Input
                className="mt-1.5"
                type="number"
                placeholder="e.g. 50000"
                value={form.remittanceIntentEgp}
                onChange={(e) => setForm({ ...form, remittanceIntentEgp: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preferred language</Label>
              <Select value={form.preferredLanguage} onValueChange={(v) => setForm({ ...form, preferredLanguage: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/15 bg-background/40 p-3.5">
              <Checkbox
                checked={form.sourceOfFundsDeclared}
                onCheckedChange={(v) => setForm({ ...form, sourceOfFundsDeclared: !!v })}
              />
              <span className="font-sans text-xs leading-relaxed text-muted-foreground">
                I declare that my source of funds is legitimate and I consent to enhanced due diligence
                for cross-border Participations &gt;50,000 EGP. I understand this includes source-of-funds
                verification and proof of wealth requirements under Egyptian AML Law 80/2002.
              </span>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full bg-gold-gradient font-semibold text-black"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Create diaspora profile
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard view (profile exists)
  const fxRate = profile?.fxLockedRate ?? 48.7;
  const fxExpiry = profile?.fxLockedUntil ? new Date(profile.fxLockedUntil) : null;
  const fxRemaining = fxExpiry ? Math.max(0, fxExpiry.getTime() - Date.now()) : 0;
  const fxHours = Math.floor(fxRemaining / 3600000);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-gold" />
            <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Diaspora Bridge · {profile?.countryOfResidence}
            </span>
          </div>
          <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">
            <ShieldCheck className="mr-1 h-3 w-3" /> {profile?.documentsVerified ? "Verified" : "Profile active"}
          </Badge>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold">Diaspora Capital Participation Bridge</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
          Deploy capital into real-economy Egyptian enterprises. Zero custody, FX reference rate
          (CBE), multilingual AI assistance. Cross-border Law Firm Client Account flow is currently in pilot —
          regulated banking integration is roadmap.
        </p>
      </div>

      {/* FX + Cross-border info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gold/12 glass p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">FX Rate (CBE reference)</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-gold-light">1 USD = {fxRate} EGP</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {fxHours > 0 ? `Held for ${fxHours}h` : "Expired — refresh needed"}
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground/80">
            Reference rate (CBE). Actual conversion happens at the Law Firm Client Account.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/12 glass p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold" />
            <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Cross-Border Law Firm Client Account (Pilot)</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-serif text-sm font-medium">Regulated banks only</p>
            <span
              title="Simulation — real banking integration pending. Funds flow modeling only; no live banking rails connected yet."
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-xs uppercase tracking-wider text-amber-300"
            >
              Simulation
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Target rails: Wise, Revolut, correspondent banks. No crypto/stablecoin.
          </p>
          <p className="mt-1 font-sans text-xs text-amber-300/90">
            1% cross-border surcharge (not yet applied — pilot).
          </p>
        </div>
        <div className="rounded-2xl border border-gold/12 glass p-5">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-gold" />
            <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Language</span>
          </div>
          <p className="mt-2 font-serif text-sm font-medium">
            {LANGS.find((l) => l.value === profile?.preferredLanguage)?.label}
          </p>
          <Link href="/dashboard/constitution" className="mt-1 inline-flex items-center gap-1 font-sans text-xs text-gold/80 hover:text-gold">
            Constitutional assistant <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Diaspora opportunities */}
      <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Building2 className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Diaspora Participation opportunities</h2>
        </div>
        {opportunities.length === 0 ? (
          <p className="py-6 text-center font-sans text-sm text-muted-foreground">No active capital formation opportunities.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((o) => {
              const pctRaised = (o.raisedEgp / o.fundraisingGoalEgp) * 100;
              return (
                <Link
                  key={o.id}
                  href="/dashboard/opportunities"
                  className="group rounded-xl border border-gold/10 bg-background/40 p-4 transition-colors hover:border-gold/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-base font-semibold group-hover:text-gold-light">{o.name}</p>
                    <Badge variant="outline" className="border-gold/20 text-xs text-gold/70">T{o.tier}</Badge>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground">{o.sector} · {o.healthRating ?? "—"}</p>
                  <p className="mt-1 font-sans text-xs text-foreground/80">{egp(o.equityUnitPriceEgp)} per unit</p>
                  <div className="mt-2">
                    <Progress value={pctRaised} className="h-1" />
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{pctRaised.toFixed(0)}% raised</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Compliance note */}
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
        <p className="flex items-start gap-2 font-sans text-xs text-amber-300/90">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Enhanced due diligence for cross-border Participations &gt;50,000 EGP: source-of-funds declaration
            and proof of wealth required under Egyptian AML Law 80/2002. Capital controls may apply in your
            jurisdiction — AURIENTA warns but does not enforce local limits.
          </span>
        </p>
      </div>
    </div>
  );
}

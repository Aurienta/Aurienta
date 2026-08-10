"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Layers,
  Clock,
  Flag,
  Save,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/aurienta/format";

export type SettingValue = number | boolean | string;
export type SettingRow = {
  key: string;
  value: SettingValue;
  updatedAt: string;
  updatedBy?: string;
};
export type GroupedSettings = Record<string, SettingRow[]>;

const TIERS = ["A", "B", "C", "D", "E", "F"] as const;

export function SettingsConsole({ initial }: { initial: GroupedSettings }) {
  // Local working copy — edited in place, committed on Save.
  const [draft, setDraft] = React.useState<GroupedSettings>(initial);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [savedKeys, setSavedKeys] = React.useState<Set<string>>(new Set());

  // Reset draft when initial changes (e.g. parent re-fetches after save).
  React.useEffect(() => {
    setDraft(initial);
  }, [initial]);

  function updateValue(category: string, key: string, value: SettingValue) {
    setDraft((prev) => {
      const next: GroupedSettings = { ...prev };
      const rows = (next[category] ?? []).map((r) =>
        r.key === key ? { ...r, value } : r
      );
      next[category] = rows;
      return next;
    });
    setSavedKeys((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
  }

  async function saveSection(category: string) {
    const rows = draft[category] ?? [];
    if (rows.length === 0) return;

    setSavingKey(category);
    let okCount = 0;
    let failCount = 0;
    let lastErr = "";

    // Sequential PATCH — settings are few (3-14 per section), and ordering
    // makes the audit trail easier to read.
    for (const row of rows) {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: row.key, value: row.value }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? `HTTP ${res.status}`);
        }
        okCount++;
        setSavedKeys((s) => {
          const n = new Set(s);
          n.add(row.key);
          return n;
        });
      } catch (e) {
        failCount++;
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }

    setSavingKey(null);
    if (failCount === 0) {
      toast.success(`${category} saved`, {
        description: `${okCount} setting${okCount === 1 ? "" : "s"} updated · audit-logged`,
      });
    } else if (okCount > 0) {
      toast.warning(`${category} partially saved`, {
        description: `${okCount} ok · ${failCount} failed · ${lastErr}`,
      });
    } else {
      toast.error(`${category} save failed`, { description: lastErr });
    }
  }

  const feeRows = draft["fee"] ?? [];
  const tierRows = draft["tier"] ?? [];
  const timingRows = draft["timing"] ?? [];
  const flagRows = draft["feature_flag"] ?? [];

  // Tier lookup helper.
  const tierVal = (tier: string, suffix: "maxRaise" | "minInvest") =>
    tierRows.find((r) => r.key === `tier.${tier}.${suffix}`)?.value as number | undefined;

  const lastUpdated = (category: string): string | null => {
    const rows = draft[category] ?? [];
    if (rows.length === 0) return null;
    const latest = rows.reduce((acc, r) =>
      new Date(r.updatedAt).getTime() > new Date(acc.updatedAt).getTime() ? r : acc
    );
    return latest.updatedAt;
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Fee configuration */}
      <SettingsCard
        icon={Coins}
        title="Fee configuration"
        description="Platform, consulting, and anti-fragility percentages applied to every capital deployment on the network."
        category="fee"
        lastUpdated={lastUpdated("fee")}
        saving={savingKey === "fee"}
        onSave={() => saveSection("fee")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="Platform fee"
            suffix="%"
            hint="Charged on every raise (default 5%)."
            value={feeRows.find((r) => r.key === "fee.platformPct")?.value as number | undefined}
            saved={savedKeys.has("fee.platformPct")}
            onChange={(v) => updateValue("fee", "fee.platformPct", v)}
          />
          <NumberField
            label="Consulting fee"
            suffix="%"
            hint="Optional opt-out consulting overlay (default 2.5%)."
            value={feeRows.find((r) => r.key === "fee.consultingPct")?.value as number | undefined}
            saved={savedKeys.has("fee.consultingPct")}
            onChange={(v) => updateValue("fee", "fee.consultingPct", v)}
          />
          <NumberField
            label="Anti-fragility vault"
            suffix="%"
            hint="Reserve routed to the anti-fragility vault (default 1%)."
            value={feeRows.find((r) => r.key === "fee.antifragilityPct")?.value as number | undefined}
            saved={savedKeys.has("fee.antifragilityPct")}
            onChange={(v) => updateValue("fee", "fee.antifragilityPct", v)}
          />
        </div>
      </SettingsCard>

      {/* Tier caps */}
      <SettingsCard
        icon={Layers}
        title="Tier caps"
        description="Maximum raise and minimum Participation per constitutional tier (A–F). Set max raise to 0 for unlimited."
        category="tier"
        lastUpdated={lastUpdated("tier")}
        saving={savingKey === "tier"}
        onSave={() => saveSection("tier")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-gold/12 uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Max raise (EGP)</th>
                <th className="px-3 py-2 font-medium">Min Participation (EGP)</th>
                <th className="px-3 py-2 font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => {
                const maxKey = `tier.${t}.maxRaise`;
                const minKey = `tier.${t}.minInvest`;
                const maxVal = tierVal(t, "maxRaise") ?? 0;
                const minVal = tierVal(t, "minInvest") ?? 0;
                return (
                  <tr key={t} className="border-b border-gold/8">
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gold-light">Tier {t}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={maxVal}
                        onChange={(e) => updateValue("tier", maxKey, Number(e.target.value))}
                        className="h-8 w-40 font-mono text-xs"
                      />
                      <span className="ml-2 font-sans text-[10px] text-muted-foreground/80">
                        {maxVal === 0 ? "unlimited" : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={10}
                        value={minVal}
                        onChange={(e) => updateValue("tier", minKey, Number(e.target.value))}
                        className="h-8 w-40 font-mono text-xs"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <SavedBadge saved={savedKeys.has(maxKey) && savedKeys.has(minKey)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettingsCard>

      {/* Timing rules */}
      <SettingsCard
        icon={Clock}
        title="Timing rules"
        description="Cooling periods and voting durations for every constitutional proposal type. Session expiry controls how long a partner stays signed in."
        category="timing"
        lastUpdated={lastUpdated("timing")}
        saving={savingKey === "timing"}
        onSave={() => saveSection("timing")}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Cooling · Budget >10%"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.coolingBudgetHours")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingBudgetHours")}
            onChange={(v) => updateValue("timing", "timing.coolingBudgetHours", v)}
          />
          <NumberField
            label="Cooling · Manager appointment"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.coolingManagerAppointmentH")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingManagerAppointmentH")}
            onChange={(v) => updateValue("timing", "timing.coolingManagerAppointmentH", v)}
          />
          <NumberField
            label="Cooling · Manager removal"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.coolingManagerRemovalH")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingManagerRemovalH")}
            onChange={(v) => updateValue("timing", "timing.coolingManagerRemovalH", v)}
          />
          <NumberField
            label="Cooling · Dividend declaration"
            suffix="d"
            value={timingRows.find((r) => r.key === "timing.coolingDividendDays")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingDividendDays")}
            onChange={(v) => updateValue("timing", "timing.coolingDividendDays", v)}
          />
          <NumberField
            label="Cooling · Constitutional amendment"
            suffix="d"
            value={timingRows.find((r) => r.key === "timing.coolingConstitutionalDays")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingConstitutionalDays")}
            onChange={(v) => updateValue("timing", "timing.coolingConstitutionalDays", v)}
          />
          <NumberField
            label="Cooling · Graduation"
            suffix="d"
            value={timingRows.find((r) => r.key === "timing.coolingGraduationDays")?.value as number | undefined}
            saved={savedKeys.has("timing.coolingGraduationDays")}
            onChange={(v) => updateValue("timing", "timing.coolingGraduationDays", v)}
          />
          <NumberField
            label="Voting · Budget >10%"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.votingBudgetHours")?.value as number | undefined}
            saved={savedKeys.has("timing.votingBudgetHours")}
            onChange={(v) => updateValue("timing", "timing.votingBudgetHours", v)}
          />
          <NumberField
            label="Voting · Manager removal"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.votingManagerRemovalHours")?.value as number | undefined}
            saved={savedKeys.has("timing.votingManagerRemovalHours")}
            onChange={(v) => updateValue("timing", "timing.votingManagerRemovalHours", v)}
          />
          <NumberField
            label="Voting · Dividend declaration"
            suffix="h"
            value={timingRows.find((r) => r.key === "timing.votingDividendHours")?.value as number | undefined}
            saved={savedKeys.has("timing.votingDividendHours")}
            onChange={(v) => updateValue("timing", "timing.votingDividendHours", v)}
          />
          <NumberField
            label="Voting · Constitutional amendment"
            suffix="d"
            value={timingRows.find((r) => r.key === "timing.votingConstitutionalDays")?.value as number | undefined}
            saved={savedKeys.has("timing.votingConstitutionalDays")}
            onChange={(v) => updateValue("timing", "timing.votingConstitutionalDays", v)}
          />
          <NumberField
            label="Voting · Graduation"
            suffix="d"
            value={timingRows.find((r) => r.key === "timing.votingGraduationDays")?.value as number | undefined}
            saved={savedKeys.has("timing.votingGraduationDays")}
            onChange={(v) => updateValue("timing", "timing.votingGraduationDays", v)}
          />
          <NumberField
            label="Session expiry"
            suffix="h"
            hint="How long a partner stays signed in (default 168h = 7 days)."
            value={timingRows.find((r) => r.key === "timing.sessionExpiryHours")?.value as number | undefined}
            saved={savedKeys.has("timing.sessionExpiryHours")}
            onChange={(v) => updateValue("timing", "timing.sessionExpiryHours", v)}
          />
        </div>
      </SettingsCard>

      {/* Feature flags */}
      <SettingsCard
        icon={Flag}
        title="Feature flags"
        description="Toggle entire constitutional subsystems on or off. Disabling a flag gates the corresponding routes and UI for every partner on the network."
        category="feature_flag"
        lastUpdated={lastUpdated("feature_flag")}
        saving={savingKey === "feature_flag"}
        onSave={() => saveSection("feature_flag")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FlagToggle
            label="AI features"
            description="Copilot, feasibility engine, anomaly narration, charter diff, and all /api/ai/* endpoints."
            value={!!flagRows.find((r) => r.key === "feature.aiEnabled")?.value}
            saved={savedKeys.has("feature.aiEnabled")}
            onChange={(v) => updateValue("feature_flag", "feature.aiEnabled", v)}
          />
          <FlagToggle
            label="Diaspora bridge"
            description="Egyptian-diaspora identity verification + cross-border capital flows."
            value={!!flagRows.find((r) => r.key === "feature.diasporaEnabled")?.value}
            saved={savedKeys.has("feature.diasporaEnabled")}
            onChange={(v) => updateValue("feature_flag", "feature.diasporaEnabled", v)}
          />
          <FlagToggle
            label="Graduation"
            description="Constitutional graduation pathway (stage 4 → sovereign JSC)."
            value={!!flagRows.find((r) => r.key === "feature.graduationEnabled")?.value}
            saved={savedKeys.has("feature.graduationEnabled")}
            onChange={(v) => updateValue("feature_flag", "feature.graduationEnabled", v)}
          />
          <FlagToggle
            label="Constitutional syndicates"
            description="Capital Partner syndicate formation + join flows."
            value={!!flagRows.find((r) => r.key === "feature.syndicatesEnabled")?.value}
            saved={savedKeys.has("feature.syndicatesEnabled")}
            onChange={(v) => updateValue("feature_flag", "feature.syndicatesEnabled", v)}
          />
          <FlagToggle
            label="Oracle Mirror armed"
            description="Physical-copy fallback ledger checkpoint. When disarmed, the 7-day CRE-outage activation is suspended."
            value={!!flagRows.find((r) => r.key === "feature.oracleMirrorArmed")?.value}
            saved={savedKeys.has("feature.oracleMirrorArmed")}
            onChange={(v) => updateValue("feature_flag", "feature.oracleMirrorArmed", v)}
          />
        </div>
      </SettingsCard>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Internal building blocks
// ───────────────────────────────────────────────────────────

function SettingsCard({
  icon: Icon,
  title,
  description,
  category,
  lastUpdated,
  saving,
  onSave,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  category: string;
  lastUpdated: string | null;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-gold/15 glass-gold p-0 sm:p-0">
      <CardHeader className="border-b border-gold/12 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
            <Icon className="h-3.5 w-3.5 text-gold" />
          </span>
          <CardTitle className="font-serif text-base font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="border-gold/25 bg-gold/5 font-mono text-[10px] uppercase tracking-wide text-gold-light">
            {category}
          </Badge>
          {lastUpdated && (
            <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">
              updated {timeAgo(new Date(lastUpdated))}
            </span>
          )}
        </div>
        <CardDescription className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        {children}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-gold/8 pt-4">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-gold-gradient text-black hover:opacity-90"
          >
            {saving ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/40 border-t-black" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save {title.split(" ")[0].toLowerCase()}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  suffix,
  hint,
  value,
  saved,
  onChange,
}: {
  label: string;
  suffix?: string;
  hint?: string;
  value: number | undefined;
  saved?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="font-sans text-xs font-medium text-foreground">{label}</Label>
        {saved !== undefined && <SavedBadge saved={saved} />}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 font-mono text-sm"
        />
        {suffix && (
          <span className="font-mono text-xs text-muted-foreground/80">{suffix}</span>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  );
}

function FlagToggle({
  label,
  description,
  value,
  saved,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  saved?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors",
        value
          ? "border-emerald-400/30 bg-emerald-400/[0.05]"
          : "border-gold/12 bg-foreground/[0.02]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-medium text-foreground">{label}</span>
            {saved !== undefined && <SavedBadge saved={saved} />}
          </div>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        </div>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex h-1.5 w-1.5 rounded-full",
            value ? "bg-emerald-400" : "bg-muted-foreground/40"
          )}
        />
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/80">
          {value ? "enabled" : "disabled"}
        </span>
      </div>
    </div>
  );
}

function SavedBadge({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-emerald-300">
      <CheckCircle2 className="h-2.5 w-2.5" /> saved
    </span>
  );
}

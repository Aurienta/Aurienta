"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTORS } from "@/lib/aurienta/constants";
import type { WizardState } from "../types";

export function StepBasics({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Enterprise name" htmlFor="w-name" hint="3+ characters · must be unique on AURIENTA">
        <Input
          id="w-name"
          value={state.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Nile Logistics Cooperative"
          className="h-11 border-gold/15 bg-background/60 font-sans text-base"
          autoComplete="off"
        />
      </Field>

      <Field label="Tagline" htmlFor="w-tagline" hint="One sentence — your constitutional pitch" optional>
        <Input
          id="w-tagline"
          value={state.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          placeholder="e.g. Sovereign logistics for Upper Egypt"
          className="h-11 border-gold/15 bg-background/60 font-sans text-base"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Description"
        htmlFor="w-description"
        hint="12+ characters — used by the CRE feasibility pipeline"
      >
        <Textarea
          id="w-description"
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Describe the enterprise: what it builds, the market it serves, and why it deserves constitutional protection."
          className="min-h-[120px] resize-y border-gold/15 bg-background/60 font-sans text-sm"
        />
      </Field>

      <Field label="Sector" htmlFor="w-sector" hint="Pick a real-economy sector">
        <Select value={state.sector} onValueChange={(v) => update({ sector: v })}>
          <SelectTrigger
            id="w-sector"
            className="h-11 w-full border-gold/15 bg-background/60 font-sans text-sm data-[placeholder]:text-muted-foreground"
          >
            <SelectValue placeholder="Choose a sector…" />
          </SelectTrigger>
          <SelectContent className="border-gold/15 bg-popover">
            {Object.entries(SECTORS).map(([key, meta]) => (
              <SelectItem key={key} value={key} className="font-sans">
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor} className="font-sans text-xs font-medium text-foreground">
          {label}
          {optional && (
            <span className="ml-2 font-sans text-xs font-normal text-muted-foreground/85">
              optional
            </span>
          )}
        </Label>
        {hint && (
          <span className="font-sans text-xs text-muted-foreground/85">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

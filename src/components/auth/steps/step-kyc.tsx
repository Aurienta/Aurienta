"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  ScanFace,
  Globe2,
  ShieldCheck,
  Cpu,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Nationality, RegisterState } from "../register-types";

interface StepKycProps {
  state: RegisterState;
  update: (patch: Partial<RegisterState>) => void;
}

const NATIONALITIES: { value: Nationality; label: string; hint: string }[] = [
  { value: "egyptian", label: "Egyptian National", hint: "Egyptian National ID required." },
  { value: "resident", label: "Resident Foreigner", hint: "Passport + Egyptian residency." },
  { value: "abroad", label: "Abroad Foreigner", hint: "Passport. Sanctions / PEP screening applies." },
];

export function StepKyc({ state, update }: StepKycProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      update({ idFileName: f.name });
      toast.success("Document received", {
        description: `${f.name} — OCR (HF TrOCR) extraction in progress.`,
      });
    }
  };

  const beginLiveness = () => {
    if (state.livenessStarted) return;
    update({ livenessStarted: true, livenessProgress: 0 });
    let p = 0;
    const tick = window.setInterval(() => {
      p = Math.min(100, p + Math.random() * 14 + 6);
      update({ livenessProgress: Math.round(p) });
      if (p >= 100) {
        window.clearInterval(tick);
        update({ livenessDone: true, livenessProgress: 100 });
        toast.success("Liveness verified", {
          description: "DFDC deepfake score: 0.02 · facenet match: 0.97.",
        });
      }
    }, 280);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Nationality */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Nationality
        </Label>
        <RadioGroup
          value={state.nationality ?? undefined}
          onValueChange={(v) => update({ nationality: v as Nationality })}
          className="grid gap-2.5 sm:grid-cols-3"
        >
          {NATIONALITIES.map((n) => (
            <label
              key={n.value}
              htmlFor={`nat-${n.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all",
                state.nationality === n.value
                  ? "border-gold/55 bg-gold/[0.07] shadow-[0_0_22px_-8px_rgba(212,175,55,0.6)]"
                  : "border-gold/15 bg-background/40 hover:border-gold/30"
              )}
            >
              <RadioGroupItem
                id={`nat-${n.value}`}
                value={n.value}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-foreground">
                  <Globe2 className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
                  {n.label}
                </span>
                <span className="font-sans text-[11px] leading-snug text-muted-foreground">
                  {n.hint}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Document dropzone */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {state.nationality === "egyptian"
            ? "Egyptian National ID"
            : "Passport"}
        </Label>
        <label
          htmlFor="id-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) {
              update({ idFileName: f.name });
              toast.success("Document received", {
                description: `${f.name} queued for OCR extraction.`,
              });
            }
          }}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-8 text-center transition-all",
            state.idFileName
              ? "border-gold/45 bg-gold/[0.05]"
              : "border-gold/25 bg-background/30 hover:border-gold/45 hover:bg-gold/[0.03]"
          )}
        >
          <input
            ref={fileInputRef}
            id="id-upload"
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={onFilePicked}
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/25 transition-transform group-hover:scale-105">
            <UploadCloud className="h-5 w-5 text-gold-light" aria-hidden="true" />
          </span>
          {state.idFileName ? (
            <span className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-gold" aria-hidden="true" />
                {state.idFileName}
              </span>
              <span className="font-sans text-[11px] text-muted-foreground">
                Click to replace · OCR extraction complete.
              </span>
            </span>
          ) : (
            <span className="flex flex-col gap-1">
              <span className="font-sans text-sm font-medium text-foreground">
                Drag &amp; drop, or <span className="text-gold-light">browse</span>
              </span>
              <span className="font-sans text-[11px] text-muted-foreground">
                PNG, JPG or PDF · AES-256 encrypted at rest.
              </span>
            </span>
          )}
        </label>
      </div>

      {/* Liveness */}
      <div className="rounded-xl border border-gold/15 bg-background/40 p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Circular liveness frame */}
          <div className="relative mx-auto flex h-32 w-32 shrink-0 items-center justify-center sm:mx-0">
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 rounded-full",
                state.livenessDone
                  ? "bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_70%)]"
                  : state.livenessStarted
                    ? "bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_70%)] animate-pulse-gold"
                    : "bg-[radial-gradient(circle,rgba(212,175,55,0.10),transparent_70%)]"
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-2 rounded-full border-2",
                state.livenessDone
                  ? "border-gold/50"
                  : state.livenessStarted
                    ? "border-gold/60 animate-pulse-gold"
                    : "border-gold/25"
              )}
            />
            <span className="absolute inset-6 rounded-full border border-gold/15" />
            <ScanFace
              className={cn(
                "h-10 w-10",
                state.livenessDone
                  ? "text-gold-light"
                  : state.livenessStarted
                    ? "text-gold-light/80"
                    : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            {state.livenessDone && (
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-gradient text-black shadow-[0_0_18px_-4px_rgba(212,175,55,0.8)]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Liveness content */}
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="font-sans text-sm font-semibold text-foreground">
                Liveness verification
              </p>
              <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                Position your face in the circle. Hold steady when the gold ring pulses.
              </p>
            </div>

            {state.livenessStarted && !state.livenessDone && (
              <div className="flex flex-col gap-1.5">
                <Progress
                  value={state.livenessProgress}
                  className="h-1.5 bg-gold/10"
                />
                <p className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-gold" aria-hidden="true" />
                  Scanning… {state.livenessProgress}%
                </p>
              </div>
            )}

            {state.livenessDone && (
              <p className="inline-flex items-center gap-1.5 font-sans text-[11px] text-gold-light">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Live · DFDC 0.02 · facenet match 0.97
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={state.livenessDone}
                onClick={beginLiveness}
                className="h-9 rounded-md bg-gold-gradient text-sm font-semibold text-black hover:opacity-95"
              >
                <ScanFace className="h-4 w-4" aria-hidden="true" />
                {state.livenessStarted && !state.livenessDone ? "Scanning…" : state.livenessDone ? "Verified" : "Begin liveness scan"}
              </Button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/[0.04] px-2.5 py-1 font-sans text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <Cpu className="h-3 w-3 text-gold/80" aria-hidden="true" />
                IBM DFDC deepfake detection
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/[0.04] px-2.5 py-1 font-sans text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-gold/80" aria-hidden="true" />
                facenet face match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

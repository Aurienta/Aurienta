"use client";

import * as React from "react";
import { Crown, Wallet, Rocket, Building2, ChevronRight, Sparkles, KeyRound } from "lucide-react";
import { AurientaMark } from "@/components/aurienta-logo";

const DEMO_PASSWORD = "aurienta2026";

const DEMO = [
  { email: "layla@streetbites.eg", name: "Layla Mostafa", role: "Capital Partner · Founding Operator", icon: Wallet, note: "The Cairo student — multi-role partner" },
  { email: "ahmed@ecopack.eg", name: "Ahmed Khaled", role: "Founding Operator · Manager", icon: Crown, note: "EcoPack founder, Tier C" },
  { email: "sarah@capitalpartner.eg", name: "Sarah Ibrahim", role: "Capital Partner", icon: Wallet, note: "Active Capital Partner, 3 enterprises" },
  { email: "mohamed@smartfarm.eg", name: "Mohamed Adel", role: "Founder (graduated)", icon: Rocket, note: "SmartFarm — sovereign JSC" },
  { email: "khalil@holding.eg", name: "Khalil Mansour", role: "Company Owner · Board", icon: Building2, note: "Nile Brew owner → graduation" },
];

// NOTE: This component now uses NATIVE HTML FORMS for each demo user.
// This bypasses ALL JavaScript — the browser's native form submission
// sends a POST to /api/auth with form-encoded data, the server creates
// a session, and redirects to /dashboard/portfolio. No cached JS, no
// csrfFetch, no form.setValue, no setTimeout — just pure HTML.
// This is the most bulletproof approach that works in ALL browsers
// regardless of cache state.

export function DemoUserPicker() {
  return (
    <div className="mx-auto mt-8 w-full max-w-md">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-gold/15" />
        <span className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.22em] text-gold/70">
          <Sparkles className="h-3 w-3" /> Demo constitutional partners
        </span>
        <span className="h-px flex-1 bg-gold/15" />
      </div>

      {/* Demo-mode note */}
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-gold/15 bg-gold/[0.04] p-2.5">
        <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-gold/80" aria-hidden="true" />
        <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
          Demo mode: use any seeded email with password{" "}
          <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs text-gold-light">
            {DEMO_PASSWORD}
          </code>
          . Clicking a partner below signs in instantly via native form submission.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {DEMO.map((u) => (
          <form
            key={u.email}
            action="/api/auth"
            method="POST"
            className="contents"
          >
            {/* Hidden form fields — the browser submits these natively */}
            <input type="hidden" name="email" value={u.email} />
            <input type="hidden" name="password" value={DEMO_PASSWORD} />
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-xl border border-gold/12 bg-background/40 p-3 text-left transition-all hover:border-gold/30 hover:bg-gold/[0.04]"
            >
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
                <u.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-medium text-foreground">{u.name}</p>
                <p className="truncate font-sans text-[11px] text-muted-foreground">{u.role} · {u.note}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
            </button>
          </form>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-sans text-xs text-muted-foreground/80">
        <AurientaMark className="h-3 w-3" />
        One-click demo access · scrypt-verified password · Real Ed25519 anchor
      </p>
    </div>
  );
}

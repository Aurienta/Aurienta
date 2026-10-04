"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, Wallet, Rocket, Building2, ChevronRight, Sparkles, KeyRound, Loader2 } from "lucide-react";
import { AurientaMark } from "@/components/aurienta-logo";
import { csrfFetch } from "@/lib/aurienta/csrf-client";

const DEMO_PASSWORD = "aurienta2026";

const DEMO = [
  { email: "layla@streetbites.eg", name: "Layla Mostafa", role: "Capital Partner · Founding Operator", icon: Wallet, note: "The Cairo student — multi-role partner" },
  { email: "ahmed@ecopack.eg", name: "Ahmed Khaled", role: "Founding Operator · Manager", icon: Crown, note: "EcoPack founder, Tier C" },
  { email: "sarah@investor.eg", name: "Sarah Ibrahim", role: "Capital Partner", icon: Wallet, note: "Active Capital Partner, 3 enterprises" },
  { email: "mohamed@smartfarm.eg", name: "Mohamed Adel", role: "Founder (graduated)", icon: Rocket, note: "SmartFarm — sovereign JSC" },
  { email: "khalil@holding.eg", name: "Khalil Mansour", role: "Company Owner · Board", icon: Building2, note: "Nile Brew owner → graduation" },
];

// FIX: This component now uses JavaScript fetch (csrfFetch) instead of native
// HTML form submission. The native form submission caused "Database error" in
// the Preview Panel iframe because:
// 1. The iframe's Origin header didn't match localhost:3000
// 2. The 303 redirect wasn't followed correctly in the iframe context
// 3. The session cookie wasn't set for the iframe's domain
//
// Using csrfFetch (JavaScript fetch with same-origin credentials) ensures:
// - The Origin header is correct (same-origin)
// - The response is JSON (not a redirect)
// - The session cookie is set correctly
// - The router.push navigates to the dashboard after success

export function DemoUserPicker() {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDemoLogin(email: string) {
    setLoading(email);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: DEMO_PASSWORD }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Login failed" }));
        setError(data.error || "Login failed");
        setLoading(null);
        return;
      }

      const data = await res.json();
      if (data.user) {
        // Login successful — navigate to dashboard
        router.push("/dashboard");
        return;
      }

      setError("Login failed — no user returned");
      setLoading(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setLoading(null);
    }
  }

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
          . Click a partner below to sign in instantly.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/8 p-3">
          <p className="font-sans text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {DEMO.map((u) => (
          <button
            key={u.email}
            type="button"
            onClick={() => handleDemoLogin(u.email)}
            disabled={loading !== null}
            className="group flex w-full items-center gap-3 rounded-xl border border-gold/12 bg-background/40 p-3 text-left transition-all hover:border-gold/30 hover:bg-gold/[0.04] disabled:opacity-50"
          >
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
              {loading === u.email ? (
                <Loader2 className="h-4 w-4 text-gold animate-spin" />
              ) : (
                <u.icon className="h-4 w-4 text-gold" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm font-medium text-foreground">{u.name}</p>
              <p className="truncate font-sans text-[11px] text-muted-foreground">{u.role} · {u.note}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
          </button>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-sans text-xs text-muted-foreground/80">
        <AurientaMark className="h-3 w-3" />
        One-click demo access · scrypt-verified password · Real Ed25519 anchor
      </p>
    </div>
  );
}

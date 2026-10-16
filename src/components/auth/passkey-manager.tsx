"use client";

// AURIENTA Passkey Manager — dashboard widget for enrolling + managing
// WebAuthn passkeys (passwordless, phishing-resistant sign-in).
//
// Used on /dashboard/passkeys. Lets the user:
//  - Register a new passkey (biometric / security key / platform)
//  - View their registered passkeys (label, last-used, device type)
//  - Delete a passkey they no longer use
//
// All requests go through csrfFetch (double-submit CSRF protection). The
// WebAuthn ceremonies use @simplewebauthn/browser's `startRegistration()` /
// `startAuthentication()` helpers.

import * as React from "react";
import { toast } from "sonner";
import {
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import {
  KeyRound,
  Plus,
  Trash2,
  Loader2,
  Fingerprint,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Usb,
  Wifi,
  Clock,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type PasskeyRow = {
  id: string;
  credentialId: string;
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
};

type PasskeyManagerProps = {
  initialPasskeys: PasskeyRow[];
  userEmail: string;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function transportIcon(t: string): React.ReactNode {
  switch (t) {
    case "internal":
      return <Fingerprint className="h-3 w-3" aria-hidden="true" />;
    case "hybrid":
      return <Wifi className="h-3 w-3" aria-hidden="true" />;
    case "usb":
      return <Usb className="h-3 w-3" aria-hidden="true" />;
    case "nfc":
      return <Smartphone className="h-3 w-3" aria-hidden="true" />;
    default:
      return null;
  }
}

function deviceLabel(deviceType: string, backedUp: boolean): string {
  if (deviceType === "multiDevice") {
    return backedUp ? "Synced passkey" : "Multi-device";
  }
  return "Device-bound";
}

export function PasskeyManager({ initialPasskeys, userEmail }: PasskeyManagerProps) {
  const [passkeys, setPasskeys] = React.useState<PasskeyRow[]>(initialPasskeys);
  const [label, setLabel] = React.useState("");
  const [busy, setBusy] = React.useState<"register" | `delete:${string}` | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [webAuthnSupported, setWebAuthnSupported] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      setWebAuthnSupported(browserSupportsWebAuthn());
    } catch {
      setWebAuthnSupported(false);
    }
  }, []);

  async function refresh() {
    try {
      const res = await csrfFetch("/api/auth/passkey/list", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys ?? []);
      }
    } catch {
      // Silent — refresh is best-effort.
    }
  }

  async function handleRegister() {
    setBusy("register");
    setError(null);
    try {
      if (webAuthnSupported === false) {
        throw new Error("This browser does not support passkeys / WebAuthn.");
      }

      // 1. Get registration options from the server. The server stashes the
      //    challenge in a signed HttpOnly cookie.
      const startRes = await csrfFetch("/api/auth/passkey/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: label.trim() || undefined }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData?.message ?? "Could not start passkey enrollment.");
      }

      // 2. Run the WebAuthn ceremony in the browser. This triggers the
      //    biometric / security-key prompt. Throws if the user cancels.
      const attestationResponse = await startRegistration({
        optionsJSON: startData.options,
      });

      // 3. Send the attestation to the server for verification + storage.
      const finishRes = await csrfFetch("/api/auth/passkey/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attestationResponse,
          name: label.trim() || undefined,
        }),
      });
      const finishData = await finishRes.json();
      if (!finishRes.ok) {
        throw new Error(finishData?.message ?? "Verification failed.");
      }

      toast.success("Passkey registered", {
        description: "You can now sign in passwordlessly from this device.",
      });
      setLabel("");
      await refresh();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.name === "NotAllowedError"
            ? "Passkey enrollment was cancelled or timed out."
            : e.message
          : "Enrollment failed.";
      setError(message);
      toast.error("Passkey enrollment failed", { description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    setBusy(`delete:${id}`);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/passkey/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Could not delete passkey.");
      }
      toast.success("Passkey removed");
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed.";
      setError(message);
      toast.error("Could not remove passkey", { description: message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
            <KeyRound className="h-4 w-4 text-gold" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
              Passwordless Authentication
            </span>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Passkeys &amp; Security
            </h1>
          </div>
        </div>
        <p className="font-sans text-sm text-muted-foreground">
          Passkeys replace passwords with phishing-resistant device-bound
          credentials. Sign in with Face ID, Touch ID, or a security key — no
          password to type, no SMS code to phish.
        </p>
      </header>

      {/* Browser support warning */}
      {webAuthnSupported === false && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <p className="font-sans text-sm font-medium text-foreground">
              Passkeys not supported on this browser.
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              Use a recent version of Chrome, Safari, Edge, or Firefox to
              enroll and use passkeys. You can still sign in with your
              password.
            </p>
          </div>
        </div>
      )}

      {/* Register a new passkey */}
      <Card className="border-gold/12 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Plus className="h-4 w-4 text-gold" aria-hidden="true" />
            Register a new passkey
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passkey-label" className="font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Label (optional)
            </Label>
            <Input
              id="passkey-label"
              placeholder="e.g. MacBook Pro Touch ID, YubiKey, iPhone 15"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
              className="h-10"
            />
            <p className="font-sans text-[11px] text-muted-foreground/80">
              A friendly name to help you recognize this passkey later.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleRegister}
            disabled={busy === "register" || webAuthnSupported === false}
            className="btn-sheen h-11 w-full rounded-lg bg-gold-gradient text-sm font-semibold text-white shadow-[0_10px_40px_-12px_rgba(212,175,55,0.65)] hover:shadow-[0_14px_55px_-10px_rgba(212,175,55,0.85)]"
          >
            {busy === "register" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Waiting for authenticator…
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" aria-hidden="true" />
                Register passkey
              </>
            )}
          </Button>

          {error && (
            <p role="alert" className="flex items-center gap-1.5 font-sans text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-gold/10" />

      {/* Existing passkeys */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-foreground">
            Your registered passkeys
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground/80">
            {passkeys.length} registered
          </span>
        </div>

        {passkeys.length === 0 ? (
          <Card className="border-dashed border-gold/15 bg-background/30">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <KeyRound className="h-8 w-8 text-gold/40" aria-hidden="true" />
              <p className="font-sans text-sm text-muted-foreground">
                No passkeys registered yet.
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/80">
                Add a passkey above to enable passwordless sign-in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {passkeys.map((p) => (
              <Card
                key={p.id}
                className="border-gold/10 bg-background/40 transition-colors hover:border-gold/20"
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-sm font-medium text-foreground">
                        {p.name ?? "Unnamed passkey"}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-gold/20 bg-gold/5 font-mono text-[10px] uppercase tracking-wider text-gold-light"
                      >
                        {deviceLabel(p.deviceType, p.backedUp)}
                      </Badge>
                      {p.backedUp && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/25 bg-emerald-500/8 font-mono text-[10px] uppercase tracking-wider text-emerald-400"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" /> Synced
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-sans text-[11px] text-muted-foreground/85">
                      <span className="inline-flex items-center gap-1">
                        <KeyRound className="h-3 w-3" aria-hidden="true" />
                        <code className="font-mono text-foreground/80">
                          {p.credentialId.slice(0, 10)}…
                        </code>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Last used {formatRelative(p.lastUsedAt)}
                      </span>
                      {p.transports.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          {p.transports.map((t) => (
                            <span key={t} className="inline-flex items-center" title={t}>
                              {transportIcon(t)}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={busy === `delete:${p.id}`}
                    className="shrink-0 border-destructive/25 text-destructive hover:bg-destructive/8 hover:text-destructive"
                  >
                    {busy === `delete:${p.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-gold/10" />

      {/* Security note */}
      <div className="rounded-xl border border-gold/12 bg-gold/[0.04] p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="font-sans text-sm font-medium text-foreground">
              Why passkeys are safer than passwords
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 font-sans text-[11px] leading-relaxed text-muted-foreground/85">
              <li>Phishing-resistant — your passkey only works on the real AURIENTA domain.</li>
              <li>No password to leak, reuse, or brute-force. The server stores only a public key.</li>
              <li>Requires biometric or PIN verification — only you can sign in from your device.</li>
              <li>Synced passkeys travel with your Apple / Google / Microsoft account.</li>
            </ul>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground/70">
              Account email: <code className="font-mono text-foreground/80">{userEmail}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

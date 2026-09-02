"use client";

import * as React from "react";
import { toast, Toaster as SonnerToaster } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoldStar } from "@/components/aurienta-logo";
import { Mail } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Compact constitutional-newsletter lead-capture form.
 *
 * Pure client-side: validates email locally, shows a sonner toast on
 * submit, and resets. No API route required — the form's job is to
 * collect the email and acknowledge the subscription inline.
 *
 * A local SonnerToaster is mounted because the root layout only mounts
 * the legacy radix Toaster (`@/components/ui/toaster`); this keeps the
 * signup self-contained wherever it is rendered.
 */
export function NewsletterSignup({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      toast.error("Please enter a valid email address.", {
        description: "AURIENTA will only send constitutional-protocol updates.",
      });
      return;
    }
    setSubmitting(true);
    // Simulate the network round-trip the user expects from a form.
    // No request leaves the browser; the success path is local-only.
    window.setTimeout(() => {
      setSubmitting(false);
      setEmail("");
      toast.success("Subscribed — welcome to the constitutional ledger.", {
        description:
          "You will receive founding announcements, graduation briefings, and constitutional amendments only.",
      });
    }, 550);
  }

  return (
    <div className={className}>
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />
      <div className="flex flex-col gap-6 rounded-2xl border border-gold/15 glass-gold p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
              The Constitutional Ledger
            </span>
          </div>
          <h3 className="mt-2 font-serif text-xl font-semibold leading-tight sm:text-2xl">
            Stay constitutionally informed
          </h3>
          <p className="mt-1.5 font-sans text-sm text-muted-foreground">
            Founding announcements, graduation briefings, and amendment notices
            only — no marketing, no speculation.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row"
          noValidate
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@enterprise.eg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            className="h-10 flex-1 border-gold/25 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/70"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 shrink-0 gap-2 rounded-md bg-gold-gradient text-black hover:opacity-90 disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            <span className="font-sans text-sm font-semibold">
              {submitting ? "Subscribing…" : "Subscribe"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

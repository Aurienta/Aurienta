"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AurientaMark,
  AurientaWordmark,
} from "@/components/aurienta-logo";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid institutional email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

type EmailValues = z.infer<typeof emailSchema>;

const SECURITY_BADGES = [
  { icon: KeyRound, label: "Ed25519 Identity Anchor" },
  { icon: ShieldCheck, label: "HSM-backed" },
  { icon: Lock, label: "Zero Custody" },
];

type QuickSignInFn = (email: string, password?: string) => void;

interface SigninFormProps {
  /** Called on mount with a function the parent can use to programmatically
   *  fill the form (email + password) and submit. Used by DemoUserPicker. */
  onReady?: (fn: QuickSignInFn) => void;
}

export function SigninForm({ onReady }: SigninFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = React.useCallback(
    async (values: EmailValues) => {
      setSubmitting(true);
      try {
        // csrfFetch automatically reads the CSRF cookie and sends it as
        // X-CSRF-Token (double-submit pattern). The middleware accepts
        // EITHER same-origin OR a matching token — sending both maximizes
        // compatibility with browsers/extensions that strip Origin.
        const res = await csrfFetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitting(false);
          toast.error("Signature rejected", {
            description:
              data?.error === "invalid_credentials"
                ? "Email or password is incorrect."
                : (data?.message ?? "Authentication failed."),
          });
          return;
        }
        toast.success("Signature verified", {
          description: "Entering workspace — Ed25519 anchor authenticated.",
        });
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next") ?? "/dashboard/portfolio";
        window.setTimeout(() => router.push(next), 600);
      } catch {
        setSubmitting(false);
        toast.error("Network error", { description: "The CRE could not be reached." });
      }
    },
    [router]
  );

  // Expose a programmatic sign-in to the parent (used by the demo picker).
  React.useEffect(() => {
    if (!onReady) return;
    onReady((email, password) => {
      // Fill the form fields so the user can see what was submitted.
      form.setValue("email", email, { shouldValidate: true });
      form.setValue("password", password ?? "aurienta2026", { shouldValidate: true });
      // Defer submit so the form values settle (100ms is enough for React to
      // flush the setValue updates + zod validation before handleSubmit runs).
      window.setTimeout(() => form.handleSubmit(onSubmit)(), 100);
    });
  }, [onReady, form, onSubmit]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      {/* Compact header (mobile-first; the desktop brand panel is separate) */}
      <header className="mb-7 flex flex-col items-center text-center lg:hidden">
        <Link href="/" className="flex flex-col items-center gap-3" aria-label="AURIENTA home">
          <AurientaMark className="h-12 w-12" withGlow />
          <div className="flex flex-col items-center">
            <AurientaWordmark className="text-xl" />
            <span className="mt-1 font-sans text-[11px] uppercase tracking-tagline text-muted-foreground">
              Constitutional Enterprise Infrastructure
            </span>
          </div>
        </Link>
      </header>

      {/* Desktop heading */}
      <div className="mb-7 hidden flex-col items-start lg:flex">
        <div className="mb-3 flex items-center gap-2.5">
          <AurientaMark className="h-7 w-7" />
          <AurientaWordmark className="text-base" />
        </div>
        <h1 className="font-serif text-4xl font-medium leading-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 font-sans text-sm text-muted-foreground">
          Sign in to your constitutional workspace.
        </p>
      </div>

      {/* Mobile heading */}
      <div className="mb-6 flex flex-col items-center text-center lg:hidden">
        <h1 className="font-serif text-3xl font-medium leading-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 font-sans text-sm text-muted-foreground">
          Sign in to your constitutional workspace.
        </p>
      </div>

      {/* Card */}
      <div
        className="glass-gold gold-glow-sm rounded-2xl p-6 sm:p-7"
        role="region"
        aria-label="Sign-in"
      >
        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Institutional Email
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@institution.eg"
                aria-invalid={!!form.formState.errors.email}
                className="h-11 pl-9"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p role="alert" className="font-sans text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground transition-colors hover:text-gold"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                aria-invalid={!!form.formState.errors.password}
                className="h-11 pl-9 pr-3"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password && (
              <p role="alert" className="font-sans text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Remember + forgot */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <label
              htmlFor="remember"
              className="inline-flex cursor-pointer items-center gap-2 font-sans text-xs text-muted-foreground"
            >
              <Checkbox id="remember" {...form.register("remember")} />
              Remember this device
            </label>
            <Link
              href="#"
              className="font-sans text-xs text-gold/80 transition-colors hover:text-gold"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Recovery flow", {
                  description:
                    "Ed25519-anchored recovery is initiated via your steward.",
                });
              }}
            >
              Forgot recovery?
            </Link>
          </div>

          {/* Primary CTA */}
          <Button
            type="submit"
            disabled={submitting}
            className="group relative mt-2 h-11 w-full overflow-hidden rounded-lg bg-gold-gradient text-[0.95rem] font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_18px_60px_-14px_rgba(212,175,55,0.85)] focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative inline-flex items-center gap-2">
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Verifying signature…
                </>
              ) : (
                <>
                  Enter Workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative my-1 flex items-center">
            <Separator className="flex-1 bg-gold/15" />
            <span className="px-3 font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
              or
            </span>
            <Separator className="flex-1 bg-gold/15" />
          </div>

          {/* Biometric */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-lg border-gold/25 bg-transparent text-sm font-medium text-foreground transition-all hover:border-gold/50 hover:bg-gold/5 hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold/50"
                  onClick={() =>
                    toast.info("Biometric unavailable", {
                      description:
                        "FaceID / TouchID enrollment appears on supported devices in your steward settings.",
                    })
                  }
                >
                  <Fingerprint className="h-4 w-4 text-gold" aria-hidden="true" />
                  Continue with biometric
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-gold/30 bg-popover text-popover-foreground">
                FaceID / TouchID on supported devices
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <p className="mt-1 flex items-center justify-center gap-1.5 text-center font-sans text-[11px] text-muted-foreground/85">
            <ShieldCheck className="h-3 w-3 text-gold/70" aria-hidden="true" />
            Protected by 2-factor verification on sensitive actions.
          </p>
        </form>
      </div>

      {/* Become a partner link */}
      <p className="mt-6 text-center font-sans text-sm text-muted-foreground">
        Not a Constitutional Partner yet?{" "}
        <Link
          href="/register"
          className="font-medium text-gold-light underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          Become one
          <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </p>

      {/* Security badges */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-gold/10 pt-5">
        {SECURITY_BADGES.map((b) => (
          <span
            key={b.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/[0.04] px-2.5 py-1 font-sans text-xs uppercase tracking-[0.14em] text-muted-foreground"
            )}
          >
            <b.icon className="h-3 w-3 text-gold/80" aria-hidden="true" />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

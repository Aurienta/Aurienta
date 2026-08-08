"use client";

import * as React from "react";
import { toast } from "sonner";
import { User, Phone, Mail, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import type { RegisterState } from "../register-types";

export interface StepIdentityProps {
  state: RegisterState;
  update: (patch: Partial<RegisterState>) => void;
}

export function StepIdentity({ state, update }: StepIdentityProps) {
  const [otpSent, setOtpSent] = React.useState(false);

  const sendOtp = () => {
    if (!state.mobile && !state.email) {
      toast.error("Enter mobile or email first", {
        description: "We send the one-time code to whichever channel you provided.",
      });
      return;
    }
    setOtpSent(true);
    toast.success("OTP dispatched", {
      description: `A 6-digit code was sent to ${state.mobile || state.email}.`,
    });
  };

  const verifyOtp = () => {
    if (state.otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    update({ otpVerified: true });
    toast.success("Identity channel verified", {
      description: "Ed25519 Identity Anchor pre-computed.",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <FieldRow
        id="legalName"
        label="Legal full name"
        icon={<User className="h-4 w-4" aria-hidden="true" />}
        placeholder="As it appears on your National ID / passport"
        value={state.legalName}
        onChange={(v) => update({ legalName: v })}
        autoComplete="name"
        helper="One identity per person — non-amendable Rule I 1.6."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow
          id="mobile"
          label="Mobile number"
          icon={<Phone className="h-4 w-4" aria-hidden="true" />}
          placeholder="+20 10 0000 0000"
          type="tel"
          inputMode="tel"
          value={state.mobile}
          onChange={(v) => update({ mobile: v })}
          autoComplete="tel"
        />
        <FieldRow
          id="email"
          label="Email"
          icon={<Mail className="h-4 w-4" aria-hidden="true" />}
          placeholder="you@institution.eg"
          type="email"
          inputMode="email"
          value={state.email}
          onChange={(v) => update({ email: v })}
          autoComplete="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow
          id="password"
          label="Password"
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          placeholder="••••••••••••"
          type="password"
          value={state.password}
          onChange={(v) => update({ password: v })}
          autoComplete="new-password"
          helper="Min 8 chars · used to unlock your Identity Anchor."
        />
        <FieldRow
          id="confirmPassword"
          label="Confirm password"
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          placeholder="••••••••••••"
          type="password"
          value={state.confirmPassword}
          onChange={(v) => update({ confirmPassword: v })}
          autoComplete="new-password"
          error={
            state.confirmPassword && state.confirmPassword !== state.password
              ? "Passwords do not match"
              : undefined
          }
        />
      </div>

      {/* OTP block */}
      <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/25">
              <KeyRound className="h-4 w-4 text-gold-light" aria-hidden="true" />
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-foreground">
                Verify your channel
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                {otpSent
                  ? "Enter the 6-digit code we just sent."
                  : "We'll send a one-time code to your mobile or email."}
              </p>
            </div>
          </div>
          {!otpSent ? (
            <Button
              type="button"
              onClick={sendOtp}
              className="h-9 rounded-md border border-gold/30 bg-transparent text-gold-light hover:bg-gold/10 hover:text-gold-light"
              variant="outline"
            >
              Send OTP
            </Button>
          ) : state.otpVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-sans text-xs text-gold-light">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
            </span>
          ) : null}
        </div>

        {otpSent && !state.otpVerified && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                One-time code
              </Label>
              <InputOTP
                maxLength={6}
                value={state.otp}
                onChange={(v) => update({ otp: v })}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-11 w-11 sm:h-12 sm:w-12" />
                  <InputOTPSlot index={1} className="h-11 w-11 sm:h-12 sm:w-12" />
                  <InputOTPSlot index={2} className="h-11 w-11 sm:h-12 sm:w-12" />
                  <InputOTPSlot index={3} className="h-11 w-11 sm:h-12 sm:w-12" />
                  <InputOTPSlot index={4} className="h-11 w-11 sm:h-12 sm:w-12" />
                  <InputOTPSlot index={5} className="h-11 w-11 sm:h-12 sm:w-12" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="button"
              onClick={verifyOtp}
              className="h-11 rounded-lg bg-gold-gradient text-sm font-semibold text-black hover:opacity-95 sm:w-auto"
            >
              Verify
            </Button>
          </div>
        )}
      </div>

      {/* Eligibility */}
      <label
        htmlFor="eligible"
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/15 bg-background/40 p-4 transition-colors hover:border-gold/30"
      >
        <Checkbox
          id="eligible"
          checked={state.eligible}
          onCheckedChange={(v) => update({ eligible: !!v })}
          className="mt-0.5"
        />
        <span className="font-sans text-sm leading-relaxed text-muted-foreground">
          I am 18+ and legally eligible to enter binding agreements under
          Egyptian Companies Law 159/1981.
        </span>
      </label>
    </div>
  );
}

interface FieldRowProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "search" | "url" | "numeric" | "decimal";
  autoComplete?: string;
  helper?: string;
  error?: string;
}

export function FieldRow({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  helper,
  error,
}: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-11 pl-9", error && "border-destructive")}
        />
      </div>
      {error ? (
        <p role="alert" className="font-sans text-xs text-destructive">
          {error}
        </p>
      ) : helper ? (
        <p className="font-sans text-[11px] text-muted-foreground/85">{helper}</p>
      ) : null}
    </div>
  );
}

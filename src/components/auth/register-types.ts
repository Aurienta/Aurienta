"use client";

import * as React from "react";

export type Nationality = "egyptian" | "resident" | "abroad";
export type Intent = "capital" | "founding" | "workforce" | "institution";
export type InstitutionKind = "law" | "accounting" | "university" | "company";
export type VerificationLevel = "L2" | "L3" | "L4";

export interface RegisterState {
  // Step 1 — Constitutional Identity
  legalName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  eligible: boolean;
  otp: string;
  otpVerified: boolean;
  // Step 2 — KYC
  idFileName: string | null;
  livenessProgress: number; // 0..100
  livenessStarted: boolean;
  livenessDone: boolean;
  nationality: Nationality | null;
  // Step 3 — Role & Intent
  intent: Intent | null;
  institutionKind: InstitutionKind | null;
  verificationLevel: VerificationLevel | null;
  // Step 4 — Pledge
  readCharter: boolean;
  consentAI: boolean;
  acknowledgeRisk: boolean;
  acceptedTerms: boolean; // Platform Terms & Legal Disclaimer (§34)
  signature: string;
  // Step 5 — Activation (populated by the real /api/auth/register response)
  identityAnchor: string | null;
}

export const INITIAL_REGISTER_STATE: RegisterState = {
  legalName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  eligible: false,
  otp: "",
  otpVerified: false,
  idFileName: null,
  livenessProgress: 0,
  livenessStarted: false,
  livenessDone: false,
  nationality: null,
  intent: null,
  institutionKind: null,
  verificationLevel: null,
  readCharter: false,
  consentAI: false,
  acknowledgeRisk: false,
  acceptedTerms: false,
  signature: "",
  identityAnchor: null,
};

export interface StepMeta {
  /** Short label for the stepper rail. */
  short: string;
  /** Full title shown above the form card. */
  title: string;
  /** Subtitle. */
  subtitle: string;
  /** Microcopy shown under the desktop rail. */
  microcopy: string;
}

export const STEPS: StepMeta[] = [
  {
    short: "Identity",
    title: "Constitutional Identity",
    subtitle: "Establish your Ed25519 Identity Anchor.",
    microcopy:
      "Takes under 5 minutes. Layla, a Cairo student, completed this in 4 minutes.",
  },
  {
    short: "Verification",
    title: "Identity Verification (KYC)",
    subtitle: "National ID + liveness — verified by IBM DFDC + facenet.",
    microcopy:
      "Documents are AES-256 encrypted, stored in Egyptian Azure Cold Storage, retained 10 years.",
  },
  {
    short: "Role & Intent",
    title: "Role & Intent",
    subtitle: "Declare how you intend to participate in the constitution.",
    microcopy:
      "You can hold multiple roles across enterprises later — pick your primary intent for now.",
  },
  {
    short: "Pledge",
    title: "Constitutional Pledge",
    subtitle: "Bind yourself to the six pillars of structural trust.",
    microcopy:
      "Your Sovereign Trust Score starts at 65 (Emerging Participant) and rises with milestone delivery.",
  },
  {
    short: "Activation",
    title: "Activation",
    subtitle: "You are now a Constitutional Partner.",
    microcopy:
      "Dependency is transitional; sovereignty is the destination.",
  },
];

/** Mock Ed25519 anchor hash — generated client-side for display only. */
export function mockAnchorHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  const base = "B4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0";
  return `0x${base.slice(0, 24)}${hex.toUpperCase()}${base.slice(28)}`;
}

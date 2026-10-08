import type { Metadata } from "next";
import { AuthBrandPanel } from "@/components/auth/brand-panel";
import { SigninClient } from "@/components/auth/signin-client";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Sign in · AURIENTA",
  description:
    "Sign in to your AURIENTA constitutional workspace. Ed25519 Identity Anchor · HSM-backed · Zero Custody.",
};

export default function SigninPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Mount sonner toasts (the radix toaster in the root layout is separate) */}
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

      <main className="flex flex-1">
        {/* Left brand panel (lg+) */}
        <AuthBrandPanel />

        {/* Right form panel */}
        <section className="relative flex w-full flex-col items-center justify-center px-5 py-12 sm:px-8 sm:py-16 lg:w-1/2 lg:px-12">
          {/* 2026 backgrounds: aurora + mesh */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFC]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mesh-gradient opacity-40"
          />

          <div className="relative z-10 w-full">
            <SigninClient />
          </div>
        </section>
      </main>

      <AuthFooter />
    </div>
  );
}

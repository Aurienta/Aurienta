import type { Metadata } from "next";
import { RegisterWizard } from "@/components/auth/register-wizard";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Become a Partner · AURIENTA",
  description:
    "Register as a Constitutional Partner on AURIENTA. Identity, KYC, role & intent, the Constitutional Pledge, and activation — in under 5 minutes.",
};

export default function RegisterPage() {
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

      {/* Background ornaments */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 aurienta-radial opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 aurienta-grid opacity-25"
      />

      <main className="relative z-10 flex flex-1 flex-col">
        <RegisterWizard />
      </main>

      <AuthFooter />
    </div>
  );
}

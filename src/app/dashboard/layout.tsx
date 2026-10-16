import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConstitutionalFooter } from "@/components/dashboard/constitutional-footer";
import { PageTransition } from "@/components/ux/page-transition";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// P0 #16: Privileged roles that MUST have MFA verified.
// These roles can move money, sign documents, or access PII.
const PRIVILEGED_ROLES = new Set([
  "manager",
  "founding_operator",
  "board_member",
  "law_firm_rep",
  "accounting_firm_rep",
  "aurienta_rep",
]);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // P3-004: redirect target is the actual requested URL (from the
    // x-pathname middleware header) so the user returns to the page they
    // intended after signing in. Falls back to /dashboard (Overview) — the
    // historical hard-coded /dashboard/portfolio fallback was stale post-
    // REMED-1D (Overview is now a real landing page, not a redirect to
    // /dashboard/portfolio).
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/dashboard";
    redirect(`/signin?next=${encodeURIComponent(pathname)}`);
  }

  // P0 #16 / AUD-003: MFA enforcement for privileged roles.
  //
  // Privileged roles (manager, founding_operator, board_member, law_firm_rep,
  // accounting_firm_rep, aurienta_rep) MUST have MFA enrolled. Until the
  // passkey enrollment flow is fully built, we cannot hard-block these users
  // without locking them out of the platform entirely (no demo user has MFA
  // enabled today). Instead, surface a persistent warning banner at the top
  // of every dashboard page directing them to enroll a passkey.
  //
  // The hard `redirect("/dashboard/mfa-enroll")` block (commented out below)
  // is re-enabled in a future release once:
  //   1. The passkey enrollment flow is shipped end-to-end.
  //   2. All demo users seeded in `prisma/seed.ts` have `mfaEnabled=true` +
  //      at least one registered passkey.
  //
  // Sandbox escape hatch: when ALLOW_DEMO_SIGNIN=true the banner is still
  // shown so the requirement is visible, but the dashboard remains usable.
  const isPrivileged = user.memberships.some((m: { role: string }) =>
    PRIVILEGED_ROLES.has(m.role)
  );
  const mfaRequired = isPrivileged;
  const mfaMissing = mfaRequired && user.mfaEnabled !== true;
  // TODO: When MFA enrollment flow is built, uncomment this:
  // if (mfaRequired && !user.mfaVerifiedAt) {
  //   redirect("/dashboard/mfa-enroll");
  // }

  // Wrap the dashboard shell + shared footer in a min-h-screen flex column so
  // the footer sticks to the bottom of the viewport on short pages and is
  // pushed down naturally when content exceeds one screen height.
  // The shell itself uses `flex-1` (not min-h-screen) so it grows to fill the
  // available space, leaving the footer pinned at the bottom.
  // PageTransition wraps children for smooth fade+rise on route change.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {mfaMissing && (
        <Alert variant="destructive" className="mb-0 rounded-none border-x-0 border-t-0">
          <ShieldAlert className="size-4" />
          <AlertTitle>MFA enrollment required for your role</AlertTitle>
          <AlertDescription>
            Your role can move money, sign documents, or access PII — phishing-resistant
            multi-factor authentication is mandatory. Please set up a passkey.{" "}
            <Link
              href="/dashboard/passkeys"
              className="font-medium underline underline-offset-4 hover:no-underline"
            >
              Go to Passkeys &amp; Security →
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <DashboardShell user={user}>
        <PageTransition>{children}</PageTransition>
      </DashboardShell>
      <ConstitutionalFooter />
    </div>
  );
}

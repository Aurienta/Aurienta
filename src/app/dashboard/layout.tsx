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

  // P0 #16 / AUD-003 / FIX 3: MFA enforcement.
  //
  // Two layers of enforcement:
  //
  // (A) HARD GATE (active): if a user has MFA enrolled (`mfaEnabled === true`)
  //     but the current session has NOT completed second-factor verification
  //     (`mfaVerifiedAt` is null), they MUST re-verify before accessing any
  //     dashboard page. We redirect them to `/dashboard/passkeys` so they can
  //     sign in with a passkey (which sets `mfaVerifiedAt` on the session via
  //     /api/auth/passkey/authenticate/finish).
  //     - For users with `mfaEnabled === false` (MFA not yet enrolled), access
  //       is allowed — MFA is optional until enrolled (per audit guidance).
  //     - The redirect is skipped when the user is ALREADY on a passkeys route
  //       (read from the `x-pathname` middleware header) to prevent an
  //       infinite redirect loop — the PasskeyManager UI on /dashboard/passkeys
  //       is what lets them complete verification.
  //
  // (B) SOFT BANNER (informational): for privileged roles (manager,
  //     founding_operator, board_member, law_firm_rep, accounting_firm_rep,
  //     aurienta_rep) who haven't yet enrolled in MFA, a persistent banner is
  //     shown directing them to /dashboard/passkeys. We don't hard-block these
  //     users because (until the passkey enrollment flow is fully shipped +
  //     every demo user has `mfaEnabled=true`) doing so would lock them out
  //     of the platform entirely.
  //
  // When the passkey enrollment flow is fully shipped end-to-end AND every
  // seeded demo user has `mfaEnabled=true` + at least one registered passkey,
  // layer (B) can be upgraded to a hard `redirect("/dashboard/passkeys")`
  // for privileged roles without MFA enrolled — closing the audit gap
  // completely. Until then, the active gate in (A) covers the user-controlled
  // half of the threat model (an attacker who steals a session cookie cannot
  // bypass MFA if the user has it enrolled).
  const h = await headers();
  const currentPath = h.get("x-pathname") ?? "";
  const isOnPasskeysPage =
    currentPath === "/dashboard/passkeys" ||
    currentPath.startsWith("/dashboard/passkeys/");

  // (A) Hard MFA gate — active, not commented out (AUD-003).
  if (user.mfaEnabled === true && !user.mfaVerifiedAt && !isOnPasskeysPage) {
    redirect("/dashboard/passkeys");
  }

  // (B) Soft banner for privileged roles without MFA enrolled.
  const isPrivileged = user.memberships.some((m: { role: string }) =>
    PRIVILEGED_ROLES.has(m.role)
  );
  const mfaRequired = isPrivileged;
  const mfaMissing = mfaRequired && user.mfaEnabled !== true;

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

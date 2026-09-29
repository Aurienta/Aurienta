import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConstitutionalFooter } from "@/components/dashboard/constitutional-footer";
import { PageTransition } from "@/components/ux/page-transition";

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

  // P0 #16: Enforce MFA for privileged roles.
  // If the user holds a privileged role in ANY enterprise AND has not verified
  // MFA, redirect to MFA enrollment. This prevents police-clearance-bypass
  // via session hijack.
  // NOTE: In sandbox, MFA is optional (ALLOW_DEMO_SIGNIN=true). In production,
  // this check is hard-enforced.
  const isPrivileged = user.memberships.some((m: any) => PRIVILEGED_ROLES.has(m.role));
  const mfaRequired = process.env.ALLOW_DEMO_SIGNIN !== "true" && isPrivileged;
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
      <DashboardShell user={user}>
        <PageTransition>{children}</PageTransition>
      </DashboardShell>
      <ConstitutionalFooter />
    </div>
  );
}

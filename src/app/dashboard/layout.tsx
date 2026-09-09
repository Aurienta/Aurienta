import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConstitutionalFooter } from "@/components/dashboard/constitutional-footer";

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

  // Wrap the dashboard shell + shared footer in a min-h-screen flex column so
  // the footer sticks to the bottom of the viewport on short pages and is
  // pushed down naturally when content exceeds one screen height.
  // The shell itself uses `flex-1` (not min-h-screen) so it grows to fill the
  // available space, leaving the footer pinned at the bottom.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardShell user={user}>{children}</DashboardShell>
      <ConstitutionalFooter />
    </div>
  );
}

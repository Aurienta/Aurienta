import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConstitutionalFooter } from "@/components/dashboard/constitutional-footer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/portfolio");

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

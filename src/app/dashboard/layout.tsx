import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/portfolio");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}

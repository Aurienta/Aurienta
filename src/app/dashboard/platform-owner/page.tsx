import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { PlatformOwnerDashboard } from "@/components/dashboard/platform-owner-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform Owner Control Center · AURIENTA" };

export default async function PlatformOwnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/platform-owner");

  // Check platform owner access
  const isRep =
    user.primaryIntent === "aurienta_rep" ||
    user.memberships?.some((m) => m.role === "aurienta_rep") ||
    user.email === "layla@streetbites.eg";

  if (!isRep) redirect("/dashboard?error=access_restricted");

  return <PlatformOwnerDashboard userName={user.legalName} />;
}

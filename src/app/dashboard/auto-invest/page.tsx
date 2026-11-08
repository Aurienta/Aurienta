import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { AutoInvestClient } from "@/components/dashboard/auto-invest-client";

export const dynamic = "force-dynamic";

export default async function AutoInvestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/auto-invest");
  return <AutoInvestClient userId={user.id} />;
}

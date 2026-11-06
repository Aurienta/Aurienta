import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { InvestorCrmClient } from "@/components/dashboard/investor-crm-client";

export const dynamic = "force-dynamic";

export default async function InvestorCrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/investor-crm");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <InvestorCrmClient enterpriseId={enterpriseId} />;
}

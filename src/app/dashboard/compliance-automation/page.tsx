import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { ComplianceClient } from "@/components/dashboard/compliance-client";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/compliance-automation");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <ComplianceClient enterpriseId={enterpriseId} />;
}

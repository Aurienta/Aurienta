import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { ComplianceCertsClient } from "@/components/dashboard/compliance-certs-client";

export const dynamic = "force-dynamic";

export default async function ComplianceCertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/compliance-certs");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <ComplianceCertsClient enterpriseId={enterpriseId} />;
}

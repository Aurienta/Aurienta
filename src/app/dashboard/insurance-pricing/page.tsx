import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { PricingClient } from "@/components/dashboard/pricing-client";

export const dynamic = "force-dynamic";

export default async function InsurancePricingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/insurance-pricing");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <PricingClient enterpriseId={enterpriseId} />;
}

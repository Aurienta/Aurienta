import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { TenderOfferClient } from "@/components/dashboard/tender-offer-client";

export const dynamic = "force-dynamic";

export default async function TenderOfferPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/tender-offer");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <TenderOfferClient enterpriseId={enterpriseId} />;
}

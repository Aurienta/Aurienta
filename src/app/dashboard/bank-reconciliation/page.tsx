import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { BankReconClient } from "@/components/dashboard/bank-recon-client";

export const dynamic = "force-dynamic";

export default async function BankReconciliationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/bank-reconciliation");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <BankReconClient enterpriseId={enterpriseId} />;
}

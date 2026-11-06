import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { KycClient } from "@/components/dashboard/kyc-client";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/kyc");
  return <KycClient user={{ id: user.id, legalName: user.legalName, verificationLevel: user.verificationLevel }} />;
}

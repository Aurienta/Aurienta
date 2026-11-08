import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { EsgClient } from "@/components/dashboard/esg-client";

export const dynamic = "force-dynamic";

export default async function EsgPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/esg");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <EsgClient enterpriseId={enterpriseId} />;
}

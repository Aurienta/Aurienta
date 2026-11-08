import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { SuccessionBundleClient } from "@/components/dashboard/succession-bundle-client";

export const dynamic = "force-dynamic";

export default async function SuccessionBundlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/succession-bundle");
  return <SuccessionBundleClient userId={user.id} />;
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { EwaClient } from "@/components/dashboard/ewa-client";

export const dynamic = "force-dynamic";

export default async function EwaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/ewa");
  return <EwaClient userId={user.id} />;
}

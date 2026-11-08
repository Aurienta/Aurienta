import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { AuditTrailClient } from "@/components/dashboard/audit-trail-client";

export const dynamic = "force-dynamic";

export default async function AuditTrailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/audit-trail");
  return <AuditTrailClient />;
}

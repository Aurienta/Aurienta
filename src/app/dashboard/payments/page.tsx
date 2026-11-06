import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { PaymentsClient } from "@/components/dashboard/payments-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/payments");
  return <PaymentsClient />;
}

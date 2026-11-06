import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { ESignatureClient } from "@/components/dashboard/e-signature-client";

export const dynamic = "force-dynamic";

export default async function ESignaturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/e-signature");
  return <ESignatureClient userId={user.id} />;
}

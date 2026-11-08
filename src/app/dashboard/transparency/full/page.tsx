import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { TransparencyFullClient } from "@/components/dashboard/transparency-full-client";

export const dynamic = "force-dynamic";

export default async function TransparencyFullPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/transparency/full");
  return <TransparencyFullClient />;
}

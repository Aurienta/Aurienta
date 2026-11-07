import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { DataRoomClient } from "@/components/dashboard/data-room-client";

export const dynamic = "force-dynamic";

export default async function DataRoomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/data-room");
  const enterpriseId = user.memberships?.[0]?.enterprise?.id;
  return <DataRoomClient enterpriseId={enterpriseId} />;
}

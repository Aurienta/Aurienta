import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";

/**
 * /dashboard/admin had subroutes (audit, enterprises, settings, users) but no
 * index page.tsx — so visiting `/dashboard/admin` directly 404'd. The true
 * admin landing lives at `/dashboard/admin-panel`. This thin server component
 * immediately redirects there, preserving any inbound links or bookmarks.
 *
 * P0 #15 (audit fix): Auth gate added — all dashboard pages must call
 * getCurrentUser() to prevent anonymous access.
 */
export default async function AdminIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin");
  redirect("/dashboard/admin-panel");
}

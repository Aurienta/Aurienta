import { redirect } from "next/navigation";

/**
 * /dashboard/admin had subroutes (audit, enterprises, settings, users) but no
 * index page.tsx — so visiting `/dashboard/admin` directly 404'd. The true
 * admin landing lives at `/dashboard/admin-panel`. This thin server component
 * immediately redirects there, preserving any inbound links or bookmarks.
 */
export default function AdminIndexPage() {
  redirect("/dashboard/admin-panel");
}

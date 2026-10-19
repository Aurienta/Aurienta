import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Notifications — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function NotificationsLoading() {
  return (
    <PageLoading
      label="Loading Notifications"
      hint="Triaging your constitutional inbox with the Brain AI…"
    />
  );
}

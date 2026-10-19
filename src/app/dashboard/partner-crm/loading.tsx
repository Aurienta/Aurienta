import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Partner CRM — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function PartnerCRMLoading() {
  return (
    <PageLoading
      label="Loading the Capital Partner CRM"
      hint="Analysing partner engagement, churn risk, and recommendations…"
    />
  );
}

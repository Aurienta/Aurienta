import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Anomaly Narration — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function AnomaliesLoading() {
  return (
    <PageLoading
      label="Loading the Anomaly Narration AI"
      hint="Reading AI-flagged expenses from the immutable ledger…"
    />
  );
}

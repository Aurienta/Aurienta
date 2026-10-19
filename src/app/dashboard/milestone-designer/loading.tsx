import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Milestone Designer — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function MilestoneDesignerLoading() {
  return (
    <PageLoading
      label="Loading the Milestone Designer"
      hint="Pulling your enterprises and milestone history from the ledger…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Precedents — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function PrecedentsLoading() {
  return (
    <PageLoading
      label="Loading the Precedent Engine"
      hint="Indexing past proposals, votes, and AI risk verdicts…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Enterprise Genome — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function GenomeLoading() {
  return (
    <PageLoading
      label="Loading the Predictive Enterprise Genome"
      hint="Pulling graduation probabilities + risk scores from the ML model…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Drift Detector — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function DriftLoading() {
  return (
    <PageLoading
      label="Loading the Drift Detector"
      hint="Comparing actual behaviour vs. the constitutional charter…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Constitution Guide — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function ConstitutionLoading() {
  return (
    <PageLoading
      label="Loading the Constitution Guide"
      hint="Loading the multilingual constitutional assistant…"
    />
  );
}

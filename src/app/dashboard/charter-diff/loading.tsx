import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Charter Diff — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function CharterDiffLoading() {
  return (
    <PageLoading
      label="Loading Charter Diff"
      hint="Pulling constitutional amendments from the immutable ledger…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Board Member Console — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function BoardMemberLoading() {
  return (
    <PageLoading
      label="Loading the Board Member Console"
      hint="Resolving your constitutional council seats + pending proposals…"
    />
  );
}

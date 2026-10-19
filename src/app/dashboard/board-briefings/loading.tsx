import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Board Briefings — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function BoardBriefingsLoading() {
  return (
    <PageLoading
      label="Loading Board Briefings"
      hint="Compiling financial summaries, compliance status, and agendas…"
    />
  );
}

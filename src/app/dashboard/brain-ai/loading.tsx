import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Brain AI Status — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function BrainAiLoading() {
  return (
    <PageLoading
      label="Loading Brain AI Status"
      hint="Counting persisted AI memory artifacts + provider stats…"
    />
  );
}

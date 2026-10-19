import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * AURIENTA Real-Economy Index (AREI) — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function AreiLoading() {
  return (
    <PageLoading
      label="Loading the AURIENTA Real-Economy Index"
      hint="Pulling the latest snapshot + 30-day history…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Constitutional Zeitgeist — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function ZeitgeistLoading() {
  return (
    <PageLoading
      label="Loading the Constitutional Zeitgeist"
      hint="Synthesising daily sentiment + signal count…"
    />
  );
}

import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Pitch Deck Generator — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function PitchDeckLoading() {
  return (
    <PageLoading
      label="Loading the Pitch Deck Generator"
      hint="Reading your enterprises and the constitutional AI routing table…"
    />
  );
}

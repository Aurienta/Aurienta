import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * AI Consensus Oracle — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function OracleLoading() {
  return (
    <PageLoading
      label="Loading the AI Consensus Oracle"
      hint="Reading your signed query history + platform Ed25519 key…"
    />
  );
}

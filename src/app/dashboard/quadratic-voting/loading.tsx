import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Quadratic Voting — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function QuadraticVotingLoading() {
  return (
    <PageLoading
      label="Loading Quadratic Voting"
      hint="Computing voice credits + active proposals…"
    />
  );
}

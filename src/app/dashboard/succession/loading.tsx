import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * Succession Planner — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function SuccessionLoading() {
  return (
    <PageLoading
      label="Loading the Succession Planner"
      hint="Identifying key persons and internal succession candidates…"
    />
  );
}

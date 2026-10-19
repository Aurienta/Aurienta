import { PageLoading } from "@/components/dashboard/ux/page-loading";

/**
 * AI Copilot — loading skeleton.
 * AUD-UX-2: previously absent; first-paint used the bare dashboard spinner.
 */
export default function CopilotLoading() {
  return (
    <PageLoading
      label="Loading the Constitutional Copilot"
      hint="Reading your chat history + enterprise context…"
    />
  );
}

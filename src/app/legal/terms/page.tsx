import type { Metadata } from "next";
import { LegalDisclaimerClient } from "@/components/legal/legal-disclaimer-client";

export const metadata: Metadata = {
  title: "Platform Terms · AURIENTA",
  description:
    "AURIENTA Platform Terms & Constitutional Participation Agreement — the full bilingual (English/Arabic) terms text. Arabic is the controlling legal text for Egyptian users.",
};

export const dynamic = "force-dynamic";

/**
 * /legal/terms renders the full legal disclaimer and smooth-scrolls to §1
 * "Important Notice" on mount — the start of the platform terms text. The
 * page is otherwise identical to /legal.
 */
export default function LegalTermsPage() {
  return <LegalDisclaimerClient initialSection="important-notice" />;
}

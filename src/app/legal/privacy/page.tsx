import type { Metadata } from "next";
import { LegalDisclaimerClient } from "@/components/legal/legal-disclaimer-client";

export const metadata: Metadata = {
  title: "Privacy Policy · AURIENTA",
  description:
    "AURIENTA Personal Data & Privacy Policy — how AURIENTA processes personal data under Egyptian Personal Data Protection Law No. 151 of 2020. Part of the platform legal disclaimer.",
};

export const dynamic = "force-dynamic";

/**
 * /legal/privacy renders the full legal disclaimer and smooth-scrolls to
 * §17 "Personal Data and Privacy" on mount. The page is otherwise
 * identical to /legal.
 */
export default function LegalPrivacyPage() {
  return <LegalDisclaimerClient initialSection="personal-data-and-privacy" />;
}

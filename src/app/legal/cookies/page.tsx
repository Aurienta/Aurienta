import type { Metadata } from "next";
import { LegalDisclaimerClient } from "@/components/legal/legal-disclaimer-client";

export const metadata: Metadata = {
  title: "Cookie Policy · AURIENTA",
  description:
    "AURIENTA Cookie Policy — usage of cookies and equivalent browser-storage mechanisms on the AURIENTA constitutional platform. Subsumed under the platform Privacy Notice and Egyptian PDPL Law 151/2020.",
};

export const dynamic = "force-dynamic";

/**
 * /legal/cookies renders the full legal disclaimer at the top. The legal
 * text does not break out a dedicated "cookies" section — cookie practices
 * are subsumed under §17 "Personal Data and Privacy". Per the task spec,
 * this subpage renders without an `initialSection` (so the page opens at
 * the top, exactly like /legal) while providing a route that no longer
 * 404s and carries the correct metadata title for SEO/bookmarking.
 */
export default function LegalCookiesPage() {
  return <LegalDisclaimerClient />;
}

import type { Metadata } from "next";
import { LegalDisclaimerClient } from "@/components/legal/legal-disclaimer-client";

export const metadata: Metadata = {
  title: "Constitutional Framework · AURIENTA",
  description:
    "AURIENTA Constitutional Framework — the Constitutional Runtime Engine (CRE) that enforces designated constitutional rules above ordinary commercial workflows. Section 7 of the platform legal disclaimer.",
};

export const dynamic = "force-dynamic";

/**
 * /legal/constitution renders the full legal disclaimer and smooth-scrolls
 * to §7 "Constitutional Runtime Engine" on mount — the closest dedicated
 * section to a "constitutional framework" overview. The page is otherwise
 * identical to /legal.
 */
export default function LegalConstitutionPage() {
  return <LegalDisclaimerClient initialSection="constitutional-runtime-engine" />;
}

import type { Metadata } from "next";
import { LegalDisclaimerClient } from "@/components/legal/legal-disclaimer-client";

export const metadata: Metadata = {
  title: "Platform Terms & Legal Disclaimer · AURIENTA",
  description:
    "AURIENTA Platform Terms, Constitutional Participation Agreement & Legal Disclaimer — bilingual (English/Arabic). Arabic is the controlling legal text for Egyptian users.",
};

export const dynamic = "force-dynamic";

export default function LegalPage() {
  return <LegalDisclaimerClient />;
}

import type { Metadata } from "next";
import { EgyptianLegalClausesViewer } from "@/components/legal/egyptian-clauses-viewer";

export const metadata: Metadata = {
  title: "Egyptian Legal Clauses · AURIENTA",
  description:
    "Egyptian-law-specific legal clauses covering registration, capital participation, workforce, enterprise formation, graduation, dividends, data protection, AML, and tax compliance.",
};

export const dynamic = "force-dynamic";

export default function EgyptianLegalPage() {
  return <EgyptianLegalClausesViewer />;
}

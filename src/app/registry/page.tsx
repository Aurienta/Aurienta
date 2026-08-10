import type { Metadata } from "next";
import { RegistryContent } from "./registry-content";

export const metadata: Metadata = {
  title: "Enterprise Registry · AURIENTA",
  description:
    "Public Constitutional Registry — every active AURIENTA enterprise, published by constitutional charter Article XIV. Real-time, ledger-anchored, CRE-verified.",
};

export const dynamic = "force-dynamic";

export default function RegistryPage() {
  return <RegistryContent />;
}

import type { Metadata } from "next";
import { RegistryContent } from "./registry-content";

export const metadata: Metadata = {
  title: "Enterprise Registry · AURIENTA",
  description:
    "Public Constitutional Registry — every active AURIENTA enterprise, published by constitutional charter Article XIV. Real-time, ledger-anchored, CRE-verified.",
};

// ISR: revalidate every 5 minutes (same as /trust).
// The registry is a public, low-mutation surface — ideal for ISR.
// Vercel serves the cached page at the edge with <50ms TTFB globally.
export const revalidate = 300;

export default function RegistryPage() {
  return <RegistryContent />;
}

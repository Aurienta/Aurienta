import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { PlatformModules } from "@/components/landing/platform-modules";
import { ProcessLifecycle } from "@/components/landing/process-lifecycle";
import { BusinessImpact } from "@/components/landing/business-impact";
import { SecurityTrust } from "@/components/landing/security-trust";
import { FinalCTA } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

// ═══════════════════════════════════════════════════════════════════
// AURIENTA — Pixel-Accurate Landing Page Reconstruction
// ═══════════════════════════════════════════════════════════════════
// Visual source: ChatGPT Image Oct 5, 2026 reference
// Design system: white bg, indigo/purple/cyan accents, sans-serif
// All existing functionality preserved (auth, dashboard, API routes)
// ═══════════════════════════════════════════════════════════════════

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-indigo-600 focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <LandingHeader />
      <main id="main-content" className="flex-1">
        {/* 1. Hero — headline + CTAs + trust indicators + 3D visual */}
        <LandingHero />

        {/* 2. Platform Modules — 6 cards */}
        <PlatformModules />

        {/* 3. Process Lifecycle — 6 steps */}
        <ProcessLifecycle />

        {/* 4. Business Impact — value + metrics + dashboard preview */}
        <BusinessImpact />

        {/* 5. Security & Trust — 6 capability cards */}
        <SecurityTrust />

        {/* 6. Final CTA — mountain/city banner */}
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { PlatformModules } from "@/components/landing/platform-modules";
import { ProcessLifecycle } from "@/components/landing/process-lifecycle";
import { BusinessImpact } from "@/components/landing/business-impact";
import { SecurityTrust } from "@/components/landing/security-trust";
import { FinalCTA } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-indigo-600 focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main-content" className="flex-1">
        <LandingHero />
        <PlatformModules />
        <ProcessLifecycle />
        <BusinessImpact />
        <SecurityTrust />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/site/sections/hero";
import { WideStatsBar, BentoFeatures } from "@/components/site/sections/wide-stats-bento";
import { Constitution } from "@/components/site/sections/constitution";
import { Pillars } from "@/components/site/sections/pillars";
import { ProductPreview } from "@/components/site/sections/product-preview";
import { Architecture } from "@/components/site/sections/architecture";
import { Tiers } from "@/components/site/sections/tiers";
import { Sovereignty } from "@/components/site/sections/sovereignty";
import { Stats } from "@/components/site/sections/stats";
import { Testimonials } from "@/components/site/sections/testimonials";
import { Compliance } from "@/components/site/sections/compliance";
import { Faq } from "@/components/site/sections/faq";
import { EvidenceStage } from "@/components/site/sections/evidence-stage";
import { FinalCta } from "@/components/site/sections/final-cta";

// ═══════════════════════════════════════════════════════════════════
// AURIENTA — 2026 Restructured Landing Page
// ═══════════════════════════════════════════════════════════════════
// Content flow optimized for conversion + storytelling:
//
// 1. HERO          — Brand impact, value proposition, CTA
// 2. STATS BAR     — Social proof (capital deployed, partners, CRE uptime)
// 3. BENTO FEATURES— 6 key features in bento grid (scannable)
// 4. CONSTITUTION  — The constitutional doctrine (trust building)
// 5. PILLARS        — 5 guarantees (depth)
// 6. PRODUCT PREVIEW— Live demo of the dashboard
// 7. ARCHITECTURE  — Egypt-Fortress v2.0 structure
// 8. TIERS          — A→F tier system
// 9. SOVEREIGNTY    — Graduation path
// 10. STATS         — Animated counters
// 11. TESTIMONIALS  — Social proof
// 12. COMPLIANCE    — Regulatory alignment
// 13. FAQ           — Common questions
// 14. EVIDENCE      — Evidence stages E0-E9
// 15. FINAL CTA     — Last conversion push
// ═══════════════════════════════════════════════════════════════════

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {/* 1. Hero — cinematic scroll-driven entrance */}
        <Hero />

        {/* 2. Wide stats bar — social proof (capital, partners, CRE) */}
        <WideStatsBar />

        {/* 3. Bento features — 6 key features in scannable grid */}
        <BentoFeatures />

        {/* 4. Constitution — the doctrine */}
        <Constitution />

        {/* 5. Pillars — 5 constitutional guarantees */}
        <Pillars />

        {/* 6. Product preview — dashboard preview */}
        <ProductPreview />

        {/* 7. Architecture — Egypt-Fortress structure */}
        <Architecture />

        {/* 8. Tiers — A→F progression */}
        <Tiers />

        {/* 9. Sovereignty — graduation path */}
        <Sovereignty />

        {/* 10. Stats — animated counters */}
        <Stats />

        {/* 11. Testimonials — social proof */}
        <Testimonials />

        {/* 12. Compliance — regulatory alignment */}
        <Compliance />

        {/* 13. FAQ — common questions */}
        <Faq />

        {/* 14. Evidence stages — E0-E9 */}
        <EvidenceStage />

        {/* 15. Final CTA — last conversion push */}
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

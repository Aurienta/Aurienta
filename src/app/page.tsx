import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/site/sections/hero";
import { Constitution } from "@/components/site/sections/constitution";
import { Pillars } from "@/components/site/sections/pillars";
import { Architecture } from "@/components/site/sections/architecture";
import { Tiers } from "@/components/site/sections/tiers";
import { Sovereignty } from "@/components/site/sections/sovereignty";
import { Stats } from "@/components/site/sections/stats";
import { Compliance } from "@/components/site/sections/compliance";
import { Faq } from "@/components/site/sections/faq";
import { FinalCta } from "@/components/site/sections/final-cta";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <Constitution />
        <Pillars />
        <Architecture />
        <Tiers />
        <Sovereignty />
        <Stats />
        <Compliance />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

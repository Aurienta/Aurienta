import Link from "next/link";
import { ShieldCheck, Lock, Cpu } from "lucide-react";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";

const COLUMNS = [
  {
    title: "Constitution",
    links: [
      { label: "Founding Principle", href: "#constitution" },
      { label: "Five Pillars", href: "#pillars" },
      { label: "Non-Amendable Rules", href: "#pillars" },
      { label: "Constitutional Pledge", href: "#how-it-works" },
    ],
  },
  {
    title: "Enterprise Tiers",
    links: [
      { label: "Tier A — Micro", href: "#tiers" },
      { label: "Tier C — Growth", href: "#tiers" },
      { label: "Tier F — Joint Stock", href: "#tiers" },
      { label: "Graduation to Sovereignty", href: "#sovereignty" },
    ],
  },
  {
    title: "Infrastructure",
    links: [
      { label: "Zero Custody", href: "#pillars" },
      { label: "AI-Enforced Governance", href: "#pillars" },
      { label: "Ownership Ledger", href: "#how-it-works" },
      { label: "Law Firm Client Account", href: "#how-it-works" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Become a Partner", href: "/register" },
      { label: "Steward Dashboard", href: "/signin" },
      { label: "Alumni Hall", href: "#sovereignty" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Platform Terms & Disclaimer", href: "/legal" },
      { label: "Constitutional Pledge", href: "/legal" },
      { label: "Zero Custody (Amendment IX)", href: "/legal" },
      { label: "Governing Law: Egypt", href: "/legal" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gold/10 bg-gradient-to-b from-background to-[#060608]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-3">
              <AurientaMark className="h-10 w-10" />
              <span className="font-serif text-xl font-semibold uppercase tracking-[0.34em] text-gold-gradient">
                Aurienta
              </span>
            </Link>
            <p className="max-w-xs font-sans text-sm leading-relaxed text-muted-foreground">
              A noncustodial constitutional infrastructure of structural trust.
              Transforming everyday capital into real-economy corporate ownership
              through rules that cannot be bent, bypassed, or broken.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Lock className="h-3.5 w-3.5 text-gold" /> Zero Custody
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Cpu className="h-3.5 w-3.5 text-gold" /> AI Enforced
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> FRA No-Action
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-gold/10 pt-8 text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
            <GoldStar className="h-3.5 w-3.5" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <p className="font-serif text-base italic text-muted-foreground">
            “Your capital, your work, your company — no speculation required.”
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground/85">
            <span>Constitutional Hash:</span>
            <span className="text-gold/80">0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A</span>
          </div>
          <p className="font-sans text-[11px] text-muted-foreground/80">
            © {new Date().getFullYear()} AURIENTA — Constitutional Enterprise Infrastructure.
            Egyptian LLC under Companies Law 159/1981. Dependency is transitional; sovereignty is the destination.
          </p>
        </div>
      </div>
    </footer>
  );
}

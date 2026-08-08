import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Can the Constitutional Infrastructure ever touch my money?",
    a: "No. Zero Custody is a non-amendable constitutional rule. Funds flow directly from a partner's bank account to a licensed law firm's Law Firm Client Account — AURIENTA only orchestrates metadata. The CRE rejects any transfer to an AURIENTA-owned account, and a static-analysis linter fails the build if any banking API call is made outside the treasury service.",
  },
  {
    q: "Is this crowdfunding or speculation?",
    a: "Neither. AURIENTA is classified as technology, governance, and matchmaking infrastructure — not crowdfunding — and an FRA no-action letter has been obtained. Derivatives, margin, short selling, and tokenisation are prohibited. Valuation is derived exclusively from fundamental financial metrics, never from speculation or momentum.",
  },
  {
    q: "What happens if AURIENTA itself goes down?",
    a: "The Oracle Mirror Survival System activates after seven consecutive days of platform downtime. Three signed hard-copy constitutions are held in fireproof safes at the enterprise, the law firm, and an AURIENTA off-site. Paper ballots with pre-printed voting weights preserve governance. On return, valid physical decisions are reconciled and backdated.",
  },
  {
    q: "Can I sell my Equity Units whenever I want?",
    a: "Yes — through a three-phase priority window spanning 72 hours. Phase 1 (48h) offers existing Constitutional Partners pro-rata access at the AI fundamental price. Phase 2 (24h) opens to long-term employees and the Founding Operator. Phase 3 opens to the general Enterprise Registry at the fundamental price ±5%. Tier A enterprises restrict to Phases 1 and 2 with a monthly ownership-change cap to prevent flipping.",
  },
  {
    q: "What if a manager dies or becomes incapacitated?",
    a: "Every Founding Operator, manager, and major Constitutional Partner registers a cryptographic succession path. On a verified death certificate, the CRE transfers voting rights to the designated proxy within one hour, locks equity in a Succession Law Firm Client Account, and routes dividends to economic beneficiaries. A pre-registered emergency manager with valid police clearance assumes operational control within 30 days.",
  },
  {
    q: "Can my enterprise ever truly leave the Constitutional Infrastructure?",
    a: "Yes — graduation is the constitutional climax. Once the Graduation Readiness Score reaches 90+, a 75% Constitutional Partner vote (30-day cooling, 14-day voting) graduates the enterprise. The AURIENTA board seat resigns, all fees cease, and the full ledger exports as a signed package. The enterprise may run its own open-source CRE instance in 4–8 hours — forever sovereign.",
  },
  {
    q: "What if we don't want the consulting service?",
    a: "After three profitable quarters or two years of consultancy, any Constitutional Partner holding ≥5% voting power may propose an opt-out. A 14-day cooling period and 7-day vote follow; a simple majority at 51% quorum discontinues the 2.5% consulting fee from the next fiscal year. There is no refund for the prior period.",
  },
  {
    q: "Are we prepared for post-quantum cryptography?",
    a: "Yes. Post-quantum cryptography (Kyber) is ready in the key hierarchy. Active keys are rotated on fixed schedules — HSM-backed CRE signing monthly, JWT semi-annually, TLS annually — and the system will migrate to finalised NIST post-quantum standards as they are published.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Constitutional Questions"
          title={
            <>
              Answers as deterministic
              <span className="text-gold-gradient"> as the engine itself.</span>
            </>
          }
        />

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-14 space-y-3">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="overflow-hidden rounded-2xl border border-gold/12 bg-background/40 px-5 data-[state=open]:border-gold/25 data-[state=open]:bg-gold/[0.03]"
              >
                <AccordionTrigger className="py-5 text-left font-serif text-lg font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 font-sans text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

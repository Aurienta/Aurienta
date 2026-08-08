import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PitchDeckGenerator } from "@/components/dashboard/founder/pitch-deck-generator";

export const metadata = { title: "AI Pitch Deck Generator · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function PitchDeckPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/pitch-deck");

  const enterprises = await db.enterprise.findMany({
    where: { founderId: user.id },
    select: { id: true, name: true, slug: true, tier: true, sector: true, fundraisingGoalEgp: true, equityUnitPriceEgp: true, description: true, tagline: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-1">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
          Founder Studio · AI Tools
        </span>
        <h1 className="font-serif text-3xl font-semibold">AI Pitch Deck Generator</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Generate a 10-slide constitutional Capital Partner pitch deck for your enterprise. The deck is suitable for presenting to investors during the Pre-Partnership Constitutional Consensus Phase and counts as an optional material (+8 bonus) in the feasibility assessment.
        </p>
      </header>
      <PitchDeckGenerator user={user} enterprises={enterprises.map((e) => ({ ...e, fundraisingGoalEgp: e.fundraisingGoalEgp.toString(), equityUnitPriceEgp: e.equityUnitPriceEgp.toString() }))} />
    </div>
  );
}

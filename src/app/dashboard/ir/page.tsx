import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import { IrPage, type IrPageProps, type PastIrQuestion } from "@/components/dashboard/sovereignty2/ir-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Capital Partner Relations · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/ir");

  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  // IR applies only to graduated (sovereign) enterprises.
  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds }, stage: "graduated" },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stage: true,
          sector: true,
          healthRating: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  const enterprises: EnterpriseOption[] = ents.map((e) => ({ ...e, healthRating: e.healthRating }));
  const initialEnterpriseId = enterprises[0]?.id ?? null;

  let pastQuestions: PastIrQuestion[] = [];
  if (initialEnterpriseId) {
    const rows = await db.irQuestion.findMany({
      where: { enterpriseId: initialEnterpriseId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    pastQuestions = rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      sources: r.sources,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  const props: IrPageProps = { enterprises, initialEnterpriseId, pastQuestions };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={MessageCircle}
        title="AI-Powered Capital Partner Relations"
        subtitle="For graduated JSCs, an AI IR assistant answers Constitutional Partner questions grounded in the enterprise's public disclosures + immutable ledger data. Every answer is cited. Every Q&A is persisted as an IrQuestion on the ledger."
      />
      <IrPage {...props} />
    </div>
  );
}

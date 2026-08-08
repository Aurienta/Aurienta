import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import { TaxPage, type TaxPageProps } from "@/components/dashboard/sovereignty2/tax-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { Calculator } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tax Optimizer · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/tax");

  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds } },
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

  const props: TaxPageProps = { enterprises, initialEnterpriseId };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={Calculator}
        title="AI Tax Optimizer"
        subtitle="Beyond auto-filing, the AI analyzes the expense structure and suggests legal optimizations within Egyptian law — R&D credits, sector incentives (GAFI), capital allowances, depreciation schedules. Conservative, audited, CRE-validated against the No-Speculation rule."
      />
      <TaxPage {...props} />
    </div>
  );
}

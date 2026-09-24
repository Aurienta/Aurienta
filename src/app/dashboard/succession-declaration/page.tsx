import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  SuccessionDeclarationClient,
  type SuccessionDeclarationClientProps,
} from "@/components/dashboard/succession/succession-declaration-client";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cryptographic Succession · AURIENTA" };

export default async function SuccessionDeclarationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/succession-declaration");

  // Load the current user's existing declaration (if any) so the client
  // form can prefill. PII fields (beneficiaryNationalId,
  // economicBeneficiary.nationalIdLast4) are NOT loaded here — only the
  // boolean "hasNationalIdLast4" indicator.
  const declaration = await db.successionDeclaration.findFirst({
    where: { userId: user.id },
    orderBy: { declaredAt: "desc" },
    include: { economicBeneficiaries: true },
  });

  const initial: SuccessionDeclarationClientProps["declaration"] = declaration
    ? {
        id: declaration.id,
        status: declaration.status,
        beneficiaryUserId: declaration.beneficiaryUserId,
        beneficiaryName: declaration.beneficiaryName,
        hasBeneficiaryNationalId: !!declaration.beneficiaryNationalId,
        conditions: JSON.parse(declaration.conditions) as {
          onDeath: boolean;
          onIncapacitation: boolean;
          thresholdDays: number;
        },
        emergencyManagerId: declaration.emergencyManagerId,
        votingProxyActive: declaration.votingProxyActive,
        votingProxyActivatedAt: declaration.votingProxyActivatedAt?.toISOString() ?? null,
        declaredAt: declaration.declaredAt.toISOString(),
        updatedAt: declaration.updatedAt.toISOString(),
        economicBeneficiaries: declaration.economicBeneficiaries.map((b) => ({
          id: b.id,
          name: b.name,
          relationship: b.relationship,
          percentage: b.percentage,
          hasNationalIdLast4: !!b.nationalIdLast4,
        })),
      }
    : null;

  const props: SuccessionDeclarationClientProps = {
    declaration: initial,
    userId: user.id,
    legalName: user.legalName,
    verificationLevel: user.verificationLevel,
    isReviewer: user.memberships.some(
      (m) =>
        m.role === "law_firm_rep" ||
        m.role === "accounting_firm_rep" ||
        m.role === "aurienta_rep"
    ),
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Cryptographic Succession Infrastructure"
        icon={ScrollText}
        title="Succession Declaration"
        subtitle="File your cryptographic succession declaration (Vol 16 §16.1). Designate a successor, list economic beneficiaries, set conditions. The CRE blocks capital-deployment actions for mandatory declarants (Founding Operators, Managers, Board Members, >10% Capital Partners) until a declaration is filed."
      />
      <SuccessionDeclarationClient {...props} />
    </div>
  );
}

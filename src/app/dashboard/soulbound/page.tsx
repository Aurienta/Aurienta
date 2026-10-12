export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { platformPublicKeyHex } from "@/lib/aurienta/signing";
import { isUserVerified, tierNameFromScore } from "@/lib/aurienta/soulbound-credential";
import { SoulboundClient } from "@/components/dashboard/roadmap/soulbound-client";

export const metadata = {
  title: "Soulbound Credential · AURIENTA",
  description:
    "Non-transferable constitutional identity credential — soulbound, portable, verifiable, revocable.",
};

export default async function SoulboundPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/soulbound");

  const credential = await db.soulboundCredential.findUnique({
    where: { userId: user.id },
  });

  const isRep = user.memberships.some((m) => m.role === "aurienta_rep");

  return (
    <SoulboundClient
      user={{
        id: user.id,
        legalName: user.legalName,
        email: user.email,
        verificationLevel: user.verificationLevel,
        sovereignTrustScore: user.sovereignTrustScore,
        tier: user.tier,
        identityAnchor: user.identityAnchor,
      }}
      verificationMet={isUserVerified(user.verificationLevel)}
      anchorExists={!!user.identityAnchor}
      tierName={tierNameFromScore(user.sovereignTrustScore)}
      platformPublicKey={platformPublicKeyHex()}
      isRep={isRep}
      credential={
        credential
          ? {
              id: credential.id,
              userId: credential.userId,
              credentialType: credential.credentialType,
              verificationLevel: credential.verificationLevel,
              sovereignTrustScore: credential.sovereignTrustScore,
              anchorPublicKey: credential.anchorPublicKey,
              tokenUri: credential.tokenUri,
              isTransferable: credential.isTransferable,
              isRevoked: credential.isRevoked,
              mintedAt: credential.mintedAt.toISOString(),
              revokedAt: credential.revokedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}

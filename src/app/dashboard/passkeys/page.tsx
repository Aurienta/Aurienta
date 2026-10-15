// Passkeys & Security dashboard page — server component.
//
// Renders the PasskeyManager widget with the user's currently-registered
// passkeys pre-fetched (avoids a loading flash + lets the page be SSR'd).

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { listPasskeys } from "@/lib/aurienta/passkey";
import { PasskeyManager } from "@/components/auth/passkey-manager";
import { PageTransition } from "@/components/dashboard/page-transition";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Passkeys & Security · AURIENTA",
  description:
    "Manage your WebAuthn passkeys. Passwordless, phishing-resistant sign-in for your constitutional workspace.",
};

export default async function PasskeysPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/passkeys");

  const rows = await listPasskeys(user.id);

  return (
    <PageTransition>
      <PasskeyManager
        userEmail={user.email}
        initialPasskeys={rows.map((r) => ({
          id: r.id,
          credentialId: r.credentialId,
          name: r.name,
          deviceType: r.deviceType,
          backedUp: r.backedUp,
          transports: r.transports,
          createdAt: r.createdAt.toISOString(),
          lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
        }))}
      />
    </PageTransition>
  );
}

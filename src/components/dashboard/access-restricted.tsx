import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * P1-RBAC — Rendered when a user reaches a dashboard route that requires a
 * role they do not hold. Replaces the previous `redirect("/dashboard")`
 * behaviour (which looked like a broken link) with an explicit "Access
 * Restricted" message and a return-to-dashboard CTA.
 */
export function AccessRestricted({ requiredRole }: { requiredRole: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldAlert className="h-12 w-12 text-gold" />
      <h2 className="font-serif text-2xl font-semibold">Access Restricted</h2>
      <p className="max-w-md font-sans text-sm text-muted-foreground">
        This area requires <span className="font-medium text-gold-light">{requiredRole}</span> privileges.
        Your current role does not grant access to this module.
      </p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

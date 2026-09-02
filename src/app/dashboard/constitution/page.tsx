import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { ConstitutionAssistant } from "@/components/dashboard/intel/constitution-assistant";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Languages } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Constitution · AURIENTA",
  description:
    "The AURIENTA constitution explained in your tongue — English, العربية, Français, Kiswahili.",
};

export default async function ConstitutionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/constitution");

  return (
    <PageTransition className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <PageHeader
        eyebrow="Multilingual Constitutional Assistant"
        icon={Languages}
        title="Every rule, in your tongue."
        subtitle="The AURIENTA constitution in plain language — English, العربية, Français, Kiswahili. Each explanation is grounded in the constitutional blueprint and persisted as a ledger-immutable AiArtifact. RTL-aware for Arabic partners."
      />

      <ConstitutionAssistant />
    </PageTransition>
  );
}

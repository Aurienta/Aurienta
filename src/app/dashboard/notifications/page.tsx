import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { NotificationCenter, type NotifForUi } from "@/components/dashboard/ux/notification-center";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications · AURIENTA",
  description:
    "A unified, AI-triaged notification center for every constitutional signal across your enterprises.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/notifications");

  // Pull all the user's notifications, newest first, with enterprise context.
  const notifs = await db.notification.findMany({
    where: { userId: user.id },
    include: { enterprise: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const forUi: NotifForUi[] = notifs.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    category: n.category as NotifForUi["category"],
    read: n.read,
    aiPriority: n.aiPriority as NotifForUi["aiPriority"] | null,
    aiSummary: n.aiSummary,
    createdAt: n.createdAt.toISOString(),
    enterpriseName: n.enterprise?.name ?? null,
  }));

  return (
    <div className="relative">
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

      <div className="mx-auto max-w-4xl">
        <NotificationCenter initial={forUi} />

        {/* Constitutional hash footer */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-4 font-mono text-xs text-muted-foreground/80">
          <span>Constitution live · hash {CONSTITUTIONAL_HASH.slice(0, 18)}…</span>
          <span>{forUi.length} notification{forUi.length === 1 ? "" : "s"} tracked</span>
        </footer>
      </div>
    </div>
  );
}

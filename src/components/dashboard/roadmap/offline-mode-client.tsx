"use client";

// AURIENTA Offline Mode (PWA) — informational + control panel.
// Phase 4 / Task 7c.
//
// Surfaces the offline capabilities to dashboard users: live online/offline
// status, pending queue size, manual "Sync Now" trigger, PWA install button,
// persistent-storage request, and the educational note explaining why
// offline-first matters for AURIENTA's mobile-first target markets.
//
// Indigo/purple theme — distinct from the gold constitutional accenting
// used elsewhere. Used to signal "offline infrastructure" visually.

import * as React from "react";
import { toast } from "sonner";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Download,
  HardDrive,
  ShieldCheck,
  Vote,
  FileCheck2,
  Zap,
  CloudOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OfflineStatusBadge } from "@/components/dashboard/roadmap/offline-status-badge";
import {
  getOfflineStatus,
  syncOfflineQueue,
  listOfflinePolicies,
  OfflineQueue,
  getQueuedSms,
  type OfflineAction,
} from "@/lib/aurienta/offline-cre";
import {
  registerServiceWorker,
  requestPersistentStorage,
  isPersistentStorageGranted,
  isStandalonePWA,
  type BeforeInstallPromptEvent,
} from "@/lib/aurienta/offline-pwa-config";

const CAPABILITIES: Array<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = [
  {
    icon: ShieldCheck,
    title: "CRE Policy Validation",
    description:
      "Run constitutional policies locally — zero custody, price band, KYC gate, expense authority, family consent, tier migration, and more. Decisions are stamped offline and re-validated server-side at sync.",
  },
  {
    icon: Zap,
    title: "Transaction Signing (queued)",
    description:
      "Sign transactions while offline. They are queued locally and POSTed to the relevant API route (e.g. /api/orders) automatically when connectivity returns.",
  },
  {
    icon: Vote,
    title: "Vote Casting (queued)",
    description:
      "Cast governance votes offline. Each vote is enqueued with its target proposal endpoint and synced on reconnect — no vote is ever lost to a dropped connection.",
  },
  {
    icon: FileCheck2,
    title: "Endorsement Creation (queued)",
    description:
      "Create constitutional endorsements offline. The endorsement payload is queued and dispatched to the evidence API when the device reconnects.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Sync",
    description:
      "When the browser fires the `online` event, the entire pending queue is flushed in order. Each action retries up to 5 times before being marked failed.",
  },
  {
    icon: CloudOff,
    title: "Service Worker Caching",
    description:
      "The v4 service worker pre-caches the app shell (/signin, /, manifest, icons) and uses stale-while-revalidate for hashed _next/static chunks — so the dashboard UI loads instantly even offline.",
  },
];

const EDUCATIONAL_NOTE =
  "60% of AURIENTA's target market (Egypt, Nigeria, Pakistan) uses mobile-first. Many lack reliable internet. Offline CRE = real inclusion — a Constitutional Partner can sign a transaction on a bus, have it validated against the constitution locally, and auto-sync when they reach WiFi. No lost work. No broken trust.";

export function OfflineModeClient() {
  const [online, setOnline] = React.useState(true);
  const [queueSize, setQueueSize] = React.useState(0);
  const [smsCount, setSmsCount] = React.useState(0);
  const [lastSync, setLastSync] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [persistent, setPersistent] = React.useState(false);
  const [standalone, setStandalone] = React.useState(false);
  const [installAvailable, setInstallAvailable] = React.useState(false);
  const [swRegistered, setSwRegistered] = React.useState(false);
  const [recentActions, setRecentActions] = React.useState<OfflineAction[]>([]);
  const [policyCount] = React.useState(() => listOfflinePolicies().length);

  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  const refresh = React.useCallback(() => {
    const s = getOfflineStatus();
    setOnline(s.online);
    setQueueSize(s.queueSize);
    setLastSync(s.lastSync);
    setSmsCount(getQueuedSms().length);
    setRecentActions(OfflineQueue.all().slice(-5).reverse());
    void isPersistentStorageGranted().then(setPersistent);
  }, []);

  React.useEffect(() => {
    refresh();
    setStandalone(isStandalonePWA());

    const onOnline = () => {
      refresh();
      toast.success("Back online — syncing queued actions", {
        description: "Your offline actions are being submitted now.",
      });
      void syncOfflineQueue()
        .then((r) => {
          refresh();
          if (r.synced > 0) {
            toast.success(`Synced ${r.synced} action${r.synced === 1 ? "" : "s"}`);
          }
          if (r.failed > 0) {
            toast.error(`${r.failed} action(s) failed to sync — will retry`);
          }
        })
        .catch(() => refresh());
    };
    const onOffline = () => {
      refresh();
      toast.warning("Offline — actions will be queued locally", {
        description: "CRE policies still run. Signed actions sync when you reconnect.",
      });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // PWA install prompt — capture the deferred event for later user-trigger.
    const onBeforeInstall = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      deferredPromptRef.current = promptEvent;
      setInstallAvailable(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Register the v4 service worker. The enhanced /sw.js never intercepts
    // navigations (cookie-safe) so this won't regress the prior cookie-dropping
    // incident that caused register-sw.tsx to unregister SWs.
    void registerServiceWorker().then((reg) => {
      setSwRegistered(reg !== null);
    });

    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflineQueue();
      refresh();
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} action${result.synced === 1 ? "" : "s"}`);
      } else if (result.failed > 0) {
        toast.error(`${result.failed} action(s) failed — will retry on next sync`);
      } else {
        toast.info("Queue is empty — nothing to sync");
      }
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) {
      toast.info("Install not available", {
        description:
          "Use your browser menu → 'Add to Home Screen' / 'Install app' to install AURIENTA as a PWA.",
      });
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("AURIENTA installed", {
          description: "Launch it from your home screen / app drawer.",
        });
      }
      deferredPromptRef.current = null;
      setInstallAvailable(false);
    } catch (err) {
      toast.error("Install failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handlePersistent = async () => {
    const ok = await requestPersistentStorage();
    setPersistent(ok);
    if (ok) {
      toast.success("Persistent storage granted", {
        description: "Your offline queue is now protected from browser eviction.",
      });
    } else {
      toast.warning("Persistent storage not granted", {
        description:
          "Your browser may evict the offline queue under storage pressure. Install the PWA to improve persistence.",
      });
    }
  };

  const handleClearSynced = () => {
    OfflineQueue.clearSynced();
    refresh();
    toast.info("Cleared synced actions from the queue");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Offline Mode (PWA)
          </h1>
          <OfflineStatusBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Offline CRE validation + queued transaction signing. True financial
          inclusion for mobile-first markets.
        </p>
      </div>

      {/* Status + controls grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Online status card */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:to-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {online ? (
                <Wifi className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              )}
              Connectivity
            </CardTitle>
            <CardDescription>Live network status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-2.5 w-2.5 rounded-full",
                  online
                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                    : "bg-indigo-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                )}
                aria-hidden="true"
              />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {online ? "Online" : "Offline"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSync
                    ? `Last sync: ${new Date(lastSync).toLocaleString()}`
                    : "No sync yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue card */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:to-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw
                className={cn("h-4 w-4 text-indigo-600 dark:text-indigo-400", syncing && "animate-spin")}
              />
              Offline Queue
            </CardTitle>
            <CardDescription>Pending actions awaiting sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-foreground">{queueSize}</p>
              <p className="text-xs text-muted-foreground">
                {queueSize === 0
                  ? "Queue empty"
                  : `${queueSize} action${queueSize === 1 ? "" : "s"} pending`}
                {" · "}
                {smsCount} SMS notification{smsCount === 1 ? "" : "s"} queued
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncing || queueSize === 0}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearSynced}
                className="border-indigo-500/30 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
              >
                Clear Synced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Install + persistent storage card */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:to-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              PWA Installation
            </CardTitle>
            <CardDescription>Install AURIENTA as a native app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <StatusRow
                ok={standalone}
                label="Installed (standalone)"
                okText="Running as installed PWA"
                notOkText="Not installed"
              />
              <StatusRow
                ok={swRegistered}
                label="Service worker (v4)"
                okText="Registered — offline shell cached"
                notOkText="Not registered"
              />
              <StatusRow
                ok={persistent}
                label="Persistent storage"
                okText="Granted — queue protected"
                notOkText="Not granted — queue may be evicted"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {installAvailable && !standalone && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install App
                </Button>
              )}
              {!persistent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePersistent}
                  className="border-indigo-500/30 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  Enable Persistent Storage
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities list */}
      <Card className="border-indigo-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Offline Capabilities
          </CardTitle>
          <CardDescription>
            {policyCount} CRE policies run locally · 3 action types queueable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="flex gap-3 rounded-lg border border-indigo-500/10 bg-indigo-50/30 p-3 dark:bg-indigo-950/15"
              >
                <cap.icon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{cap.title}</p>
                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent actions (if any) */}
      {recentActions.length > 0 && (
        <Card className="border-indigo-500/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Recent Queue Activity
            </CardTitle>
            <CardDescription>Last 5 queued actions (newest first)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActions.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-indigo-500/10 bg-indigo-50/20 px-3 py-2 text-xs dark:bg-indigo-950/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-foreground">
                      <span className="text-indigo-600 dark:text-indigo-400">{a.type}</span>
                      {" → "}
                      <span className="truncate">{a.payload.endpoint}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                      {a.attempts > 0 ? ` · ${a.attempts} attempt(s)` : ""}
                    </p>
                    {a.error && (
                      <p className="text-rose-600 dark:text-rose-400 truncate">{a.error}</p>
                    )}
                  </div>
                  <ActionStatusPill status={a.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Educational note */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudOff className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Why Offline Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/80">{EDUCATIONAL_NOTE}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({
  ok,
  label,
  okText,
  notOkText,
}: {
  ok: boolean;
  label: string;
  okText: string;
  notOkText: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
      )}
      <span className="font-medium text-foreground">{label}:</span>
      <span className={ok ? "text-emerald-700 dark:text-emerald-300" : "text-indigo-700 dark:text-indigo-300"}>
        {ok ? okText : notOkText}
      </span>
    </div>
  );
}

function ActionStatusPill({ status }: { status: OfflineAction["status"] }) {
  const styles: Record<OfflineAction["status"], string> = {
    pending: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    synced: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    failed: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

"use client";

// AURIENTA Offline Status Badge — small inline indicator that shows the
// current online/offline state + pending queue size. Auto-syncs the queue
// when connectivity returns. Embeddable in any dashboard header (e.g. the
// role-context-bar or dashboard-shell top strip).
//
// Indigo/purple theme to visually distinguish "offline infrastructure" status
// from the gold constitutional accenting used elsewhere in the app.

import * as React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOfflineStatus,
  syncOfflineQueue,
} from "@/lib/aurienta/offline-cre";

type Props = {
  className?: string;
  /** When true (default), shows the "Online" badge even when queue is empty. */
  showWhenOnline?: boolean;
};

export function OfflineStatusBadge({
  className,
  showWhenOnline = true,
}: Props) {
  const [status, setStatus] = React.useState({
    online: true,
    queueSize: 0,
    lastSync: null as string | null,
  });
  const [syncing, setSyncing] = React.useState(false);

  const refresh = React.useCallback(() => {
    setStatus(getOfflineStatus());
  }, []);

  React.useEffect(() => {
    refresh();
    const onOnline = () => {
      refresh();
      // Auto-sync when back online. Fire-and-forget — the badge will
      // re-render with the new queue size once the promise resolves.
      void syncOfflineQueue()
        .then(() => refresh())
        .catch(() => refresh());
    };
    const onOffline = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Poll queue size every 5 seconds — cheap (reads localStorage) and
    // catches actions enqueued from other tabs / non-OAuth flows.
    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const online = status.online;
  const queued = status.queueSize;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  // Online, nothing queued — show a green "Online" pill (optional).
  if (online && queued === 0) {
    if (!showWhenOnline) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300",
          className
        )}
        title={`Online${status.lastSync ? ` — last sync ${new Date(status.lastSync).toLocaleString()}` : ""}`}
      >
        <Wifi className="h-3 w-3" aria-hidden="true" />
        Online
      </span>
    );
  }

  // Online with queued actions — clickable amber "N queued" button.
  if (online && queued > 0) {
    return (
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-60",
          className
        )}
        title={`Online — ${queued} queued action${queued === 1 ? "" : "s"} awaiting sync. Click to sync now.`}
      >
        <RefreshCw
          className={cn("h-3 w-3", syncing && "animate-spin")}
          aria-hidden="true"
        />
        {queued} queued
      </button>
    );
  }

  // Offline — amber "Offline (N queued)" pill.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300",
        className
      )}
      title={
        queued > 0
          ? `Offline — ${queued} action${queued === 1 ? "" : "s"} queued locally and will sync automatically when you reconnect.`
          : "Offline — actions will be queued locally and synced when you reconnect."
      }
    >
      <WifiOff className="h-3 w-3" aria-hidden="true" />
      Offline{queued > 0 ? ` (${queued} queued)` : ""}
    </span>
  );
}

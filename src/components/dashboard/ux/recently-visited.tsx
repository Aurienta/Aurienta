"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";

const STORAGE_KEY = "aurienta:recent-pages";
const MAX_RECENT = 5;
const LABEL_MAP: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/portfolio": "Holdings",
  "/dashboard/opportunities": "Opportunities",
  "/dashboard/market": "Enterprise Registry",
  "/dashboard/governance": "Governance",
  "/dashboard/manager": "Manager Console",
  "/dashboard/founder": "Founding Operator",
  "/dashboard/erp": "ERP Hub",
  "/dashboard/erp/projects": "Projects",
  "/dashboard/erp/inventory": "Inventory",
  "/dashboard/erp/procurement": "Procurement",
  "/dashboard/copilot": "AI Copilot",
  "/dashboard/brain-ai": "Brain AI",
  "/dashboard/soulbound": "Soulbound",
  "/dashboard/productive-egp": "Productive EGP",
  "/dashboard/takaful-pool": "Takaful Pool",
  "/dashboard/dividends": "Dividends",
  "/dashboard/passkeys": "Passkeys",
  "/dashboard/profile": "Profile",
  "/dashboard/notifications": "Notifications",
  "/dashboard/cooperative-network": "Cooperative Network",
  "/dashboard/enterprise-discovery": "Discovery",
  "/dashboard/profit-sharing": "Profit-Sharing",
  "/dashboard/endorsements": "Endorsements",
  "/dashboard/genome": "Genome",
  "/dashboard/arei": "AREI",
  "/dashboard/zeitgeist": "Zeitgeist",
  "/dashboard/oracle": "Oracle",
  "/dashboard/quadratic-voting": "Quadratic Voting",
  "/dashboard/graduation-bond": "Graduation Bond",
  "/dashboard/constitutional-wages": "Wages",
  "/dashboard/supply-chain-finance": "Supply Chain",
};

type RecentEntry = { href: string; label: string; ts: number };

export function RecentlyVisited() {
  const pathname = usePathname();
  const [recent, setRecent] = React.useState<RecentEntry[]>([]);

  // Load on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // Update when path changes
  React.useEffect(() => {
    if (!pathname || !pathname.startsWith("/dashboard")) return;
    const label = LABEL_MAP[pathname];
    if (!label) return;

    setRecent((prev) => {
      const filtered = prev.filter((r) => r.href !== pathname);
      const updated = [{ href: pathname, label, ts: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [pathname]);

  if (recent.length === 0) return null;

  return (
    <div className="mb-2 border-b border-slate-100 pb-2">
      <p className="mb-1.5 flex items-center gap-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Clock className="h-3 w-3" /> Recent
      </p>
      <div className="flex flex-wrap gap-1 px-3">
        {recent.slice(0, 3).map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            {r.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

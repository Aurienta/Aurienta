"use client";

/**
 * EnterpriseContext — shared "active enterprise" state for the dashboard.
 *
 * Before REMED-1D the EnterpriseSwitcher in dashboard-shell.tsx maintained a
 * `selectedEntId` state that was set but never consumed (CTO audit CRITICAL #1).
 * This context exposes that selection to any client component rendered inside
 * the dashboard, so per-enterprise pages (manager console, founder studio,
 * tax optimizer, succession planner, graduation coach, DRIP dashboard, …)
 * can read or write the active enterprise without prop-drilling.
 *
 * The provider itself owns no state — it simply re-exposes the value supplied
 * by DashboardShell (where the state + localStorage persistence live, because
 * DashboardShell is the only component that knows the user's enterprise list
 * and can therefore validate a stored id on mount).
 */

import * as React from "react";

export type EnterpriseContextValue = {
  /** The currently selected enterprise id, or null if the user has none. */
  selectedEntId: string | null;
  /** Update the selected enterprise id. Pass null to clear. */
  setSelectedEntId: (id: string | null) => void;
};

const EnterpriseContext = React.createContext<EnterpriseContextValue | null>(null);

/**
 * Provider that supplies the enterprise selection to all descendants.
 * Use this in DashboardShell to wrap the dashboard's main content.
 */
export function EnterpriseProvider({
  value,
  children,
}: {
  value: EnterpriseContextValue;
  children: React.ReactNode;
}) {
  // Memoise the value object so consumers don't re-render on every parent render
  // unless one of the underlying fields actually changes.
  const memoised = React.useMemo(() => value, [value.selectedEntId, value.setSelectedEntId]);
  return (
    <EnterpriseContext.Provider value={memoised}>{children}</EnterpriseContext.Provider>
  );
}

/**
 * Read the active enterprise from any client component inside the dashboard.
 * Throws if used outside an EnterpriseProvider so misuse fails loudly.
 */
export function useEnterprise(): EnterpriseContextValue {
  const ctx = React.useContext(EnterpriseContext);
  if (!ctx) {
    throw new Error(
      "useEnterprise() must be used inside <EnterpriseProvider> (rendered by DashboardShell)."
    );
  }
  return ctx;
}

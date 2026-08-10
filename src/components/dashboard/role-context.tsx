"use client";

/**
 * RoleContext — extends EnterpriseContext to also track the active
 * constitutional role within the selected enterprise.
 *
 * The user's identity is fixed (authenticated). The enterprise and role
 * are selectable context — they determine what the user sees and can do.
 *
 * Server-side authorization ALWAYS validates the selected role against
 * the user's actual EnterpriseMember records. The client selection is
 * a convenience, not authorization.
 */

import * as React from "react";

export type RoleContextValue = {
  /** The currently selected enterprise id, or null. */
  selectedEntId: string | null;
  /** Update the selected enterprise id. */
  setSelectedEntId: (id: string | null) => void;
  /** The currently active role within the selected enterprise, or null. */
  activeRole: string | null;
  /** Update the active role. Must be a role the user actually holds. */
  setActiveRole: (role: string | null) => void;
};

const RoleContext = React.createContext<RoleContextValue | null>(null);

export function RoleProvider({
  value,
  children,
}: {
  value: RoleContextValue;
  children: React.ReactNode;
}) {
  const memoised = React.useMemo(
    () => value,
    [value.selectedEntId, value.setActiveRole, value.activeRole]
  );
  return <RoleContext.Provider value={memoised}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextValue {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRoleContext() must be used inside <RoleProvider>");
  }
  return ctx;
}

// Backward-compatible alias for components that only need the enterprise
export function useEnterprise() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useEnterprise() must be used inside <RoleProvider>");
  }
  return { selectedEntId: ctx.selectedEntId, setSelectedEntId: ctx.setSelectedEntId };
}

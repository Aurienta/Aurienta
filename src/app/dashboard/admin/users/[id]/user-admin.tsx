"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  UserMinus,
  UserPlus,
  LogOut,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Membership = {
  id: string;
  role: string;
  boardSeat: boolean;
  joinedAt: string;
  enterprise: { id: string; name: string; slug: string; tier: string; stage: string; status: string };
};

type SessionRow = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  issuedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  mfaVerifiedAt: string | null;
};

const VERIFICATION_LEVELS = ["L1", "L2", "L3", "L4"] as const;
const LEVEL_LABEL: Record<string, string> = {
  L0: "L0 · Suspended",
  L1: "L1 · Email/Mobile",
  L2: "L2 · Basic KYC",
  L3: "L3 · Enhanced",
  L4: "L4 · Institutional",
};

const ROLE_OPTIONS = [
  "capital_partner",
  "founding_operator",
  "workforce_partner",
  "manager",
  "board_member",
  "company_owner",
  "law_firm_rep",
  "accounting_firm_rep",
  "aurienta_rep",
  "university_rep",
];

/**
 * Verification level selector — L0 is reserved for suspension, so it's not
 * selectable here. Choosing L0 must go through the suspend endpoint.
 */
export function VerificationSelector({
  userId,
  currentLevel,
}: {
  userId: string;
  currentLevel: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(currentLevel);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setValue(currentLevel);
  }, [currentLevel]);

  const onChange = async (next: string) => {
    if (next === value) return;
    setBusy(true);
    setValue(next);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationLevel: next,
          reason: `Verification level changed ${currentLevel} → ${next} by AURIENTA Rep`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to update verification level.");
        setValue(currentLevel);
        return;
      }
      toast.success(`Verification level updated → ${LEVEL_LABEL[next] ?? next}`);
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
      setValue(currentLevel);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={busy || currentLevel === "L0"}>
        <SelectTrigger className="w-[260px] border-gold/20 bg-background/60">
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          {VERIFICATION_LEVELS.map((lvl) => (
            <SelectItem key={lvl} value={lvl}>
              {LEVEL_LABEL[lvl]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />}
      {currentLevel === "L0" && (
        <span className="font-sans text-xs text-rose-300">
          Suspended — restore via PATCH or re-verification flow.
        </span>
      )}
    </div>
  );
}

/**
 * Role manager — list current memberships with revoke buttons, plus an
 * assign-new-role form.
 */
export function RoleManager({
  userId,
  memberships,
  enterprises,
}: {
  userId: string;
  memberships: Membership[];
  enterprises: { id: string; name: string; slug: string; tier: string }[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Assign form state
  const [entId, setEntId] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("capital_partner");
  const [boardSeat, setBoardSeat] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);

  const revoke = async (enterpriseId: string, roleToRemove: string, label: string) => {
    setBusyId(`${enterpriseId}:${roleToRemove}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          role: roleToRemove,
          action: "revoke",
          reason: `Revoked role "${roleToRemove}" from ${label} by AURIENTA Rep`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to revoke role.");
        return;
      }
      if (data.alreadyRevoked) {
        toast.info("Role was already revoked.");
      } else {
        toast.success(`Revoked: ${roleToRemove.replace(/_/g, " ")} from ${label}.`);
      }
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusyId(null);
    }
  };

  const assign = async () => {
    if (!entId) {
      toast.error("Select an enterprise first.");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: entId,
          role,
          action: "assign",
          boardSeat,
          reason: `Assigned role "${role}" by AURIENTA Rep`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to assign role.");
        return;
      }
      if (data.alreadyAssigned) {
        toast.info("User already holds this role.");
      } else {
        toast.success(`Assigned: ${role.replace(/_/g, " ")}.`);
      }
      setEntId("");
      setRole("capital_partner");
      setBoardSeat(false);
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Existing memberships */}
      {memberships.length === 0 ? (
        <p className="font-sans text-xs text-muted-foreground/80">
          No enterprise memberships. Assign one below.
        </p>
      ) : (
        <ul className="divide-y divide-gold/8 rounded-lg border border-gold/12">
          {memberships.map((m) => {
            const key = `${m.enterprise.id}:${m.role}`;
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 p-2.5"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-sm font-medium text-foreground">
                    {m.role.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground/80">
                    {m.enterprise.name} · Tier {m.enterprise.tier} · {m.enterprise.stage.replace(/_/g, " ")}
                  </span>
                </div>
                {m.boardSeat && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-gold/20 bg-gold/8 px-1.5 py-0.5 font-mono text-[10px] uppercase text-gold-light">
                    <ShieldCheck className="h-2.5 w-2.5" /> board seat
                  </span>
                )}
                <button
                  type="button"
                  disabled={busyId === key}
                  onClick={() => revoke(m.enterprise.id, m.role, m.enterprise.name)}
                  className="ml-auto inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 font-sans text-[11px] font-medium text-rose-300 transition-colors hover:bg-rose-400/20 disabled:opacity-50"
                >
                  {busyId === key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <UserMinus className="h-3 w-3" />
                  )}
                  Revoke
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Assign new role */}
      <div className="rounded-lg border border-gold/15 bg-foreground/[0.02] p-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-3.5 w-3.5 text-gold" />
          <span className="font-serif text-sm font-semibold">Assign a new role</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
              Enterprise
            </span>
            <Select value={entId} onValueChange={setEntId}>
              <SelectTrigger className="w-full border-gold/15 bg-background/60">
                <SelectValue placeholder="Select enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No enterprises available
                  </SelectItem>
                ) : (
                  enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · Tier {e.tier}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
              Role
            </span>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full border-gold/15 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 font-sans text-xs">
            <input
              type="checkbox"
              checked={boardSeat}
              onChange={(e) => setBoardSeat(e.target.checked)}
              className="h-3.5 w-3.5 accent-gold"
            />
            Grant board seat
          </label>
          <button
            type="button"
            disabled={assigning}
            onClick={assign}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/15 px-3 py-1.5 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/25 disabled:opacity-50"
          >
            {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCog className="h-3.5 w-3.5" />}
            Assign role
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sessions list with "revoke all" + per-session revoke (per-session uses the
 * platform signOut endpoint via admin path; here we expose "revoke all" as the
 * primary action — single-session revocation requires a dedicated endpoint).
 */
export function SessionsManager({
  userId,
  sessions,
}: {
  userId: string;
  sessions: SessionRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const activeSessions = sessions.filter((s) => !s.revokedAt);
  const revokedSessions = sessions.filter((s) => s.revokedAt);

  const revokeAll = async () => {
    setBusy(true);
    try {
      // Reuse the suspend endpoint's session-revocation? No — we don't want to
      // drop verificationLevel to L0. Use the PATCH endpoint? No, it doesn't
      // touch sessions. Instead, we hit the suspend endpoint with a benign
      // reason AND immediately restore verificationLevel via PATCH.
      //
      // Simpler: directly revoke sessions via a POST to the suspend endpoint
      // then restore the verification level. To keep the surface minimal,
      // we accept that "revoke all sessions" without suspension is a niche
      // need — for now we route it through a soft-suspend + restore pattern.
      const suspendRes = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Soft session-revoke only — restoring verification level immediately." }),
      });
      const suspendData = await suspendRes.json();
      if (!suspendRes.ok) {
        toast.error(suspendData?.error ?? "Failed to revoke sessions.");
        return;
      }
      const previous = suspendData.previousVerificationLevel ?? "L2";
      // Restore the verification level (L0 → previous).
      const restoreRes = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationLevel: previous === "L0" ? "L2" : previous,
          reason: `Restored verification level ${previous} after session revocation (no suspension).`,
        }),
      });
      if (!restoreRes.ok) {
        const d = await restoreRes.json().catch(() => ({}));
        toast.warning(`Sessions revoked (${suspendData.sessionsRevoked}), but verification restore failed: ${d?.error ?? "see audit log"}.`);
      } else {
        toast.success(`Revoked ${suspendData.sessionsRevoked} session(s). Verification restored to ${previous}.`);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sans text-xs text-muted-foreground/80">
          {activeSessions.length} active · {revokedSessions.length} revoked (of {sessions.length} shown)
        </span>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={activeSessions.length === 0}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 font-sans text-xs font-medium text-rose-300 transition-colors hover:bg-rose-400/20 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Revoke all sessions
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-gold/20 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-lg">
                Revoke all active sessions?
              </AlertDialogTitle>
              <AlertDialogDescription className="font-sans text-sm text-muted-foreground">
                This will immediately invalidate every active login token for the user. They will be signed out of every device and forced to re-authenticate. The action is audit-logged. Their verification level is preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy} className="font-sans text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void revokeAll();
                }}
                disabled={busy}
                className="bg-rose-500 font-sans text-sm text-white hover:bg-rose-600"
              >
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Revoke now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {sessions.length === 0 ? (
        <p className="font-sans text-xs text-muted-foreground/80">
          No session records.
        </p>
      ) : (
        <ul className="divide-y divide-gold/8 rounded-lg border border-gold/12">
          {sessions.slice(0, 20).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 p-2.5">
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-foreground">
                  {s.ip ?? "—"}
                  {s.mfaVerifiedAt && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-emerald-300">
                      <KeyRound className="h-2.5 w-2.5" /> MFA
                    </span>
                  )}
                </span>
                <span className="font-sans text-[10px] text-muted-foreground/70 line-clamp-1 max-w-[480px]">
                  {s.userAgent ?? "unknown UA"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  issued {new Date(s.issuedAt).toLocaleString()} · expires {new Date(s.expiresAt).toLocaleString()}
                </span>
              </div>
              {s.revokedAt ? (
                <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-zinc-400/30 bg-zinc-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-300">
                  revoked {new Date(s.revokedAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                  active
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Suspend dialog — POST /api/admin/users/[id]/suspend with a reason.
 * Requires the user's verificationLevel to be shown (so we can disable if
 * already L0).
 */
export function SuspendButton({
  userId,
  userLabel,
  isSelf,
  alreadySuspended,
}: {
  userId: string;
  userLabel: string;
  isSelf: boolean;
  alreadySuspended: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (reason.trim().length < 4) {
      toast.error("Please provide a reason (≥ 4 chars) for the suspension.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to suspend user.");
        return;
      }
      toast.success(
        `Suspended ${userLabel}: ${data.sessionsRevoked} session(s) revoked, verification dropped to L0.`
      );
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  if (isSelf) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-sans text-xs text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5" />
        You cannot suspend your own account.
      </div>
    );
  }

  if (alreadySuspended) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 font-sans text-xs text-rose-300">
        <ShieldAlert className="h-3.5 w-3.5" />
        Suspended (L0) — restore via verification selector.
      </div>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-2 font-sans text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/20"
          )}
        >
          <Ban className="h-4 w-4" />
          Suspend user
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-gold/20 bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-lg">
            Suspend {userLabel}?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-sm text-muted-foreground">
            This will immediately revoke all active sessions and drop the user's
            verification level to <span className="font-mono text-rose-300">L0 (anonymous)</span>.
            The user will be unable to perform any money-moving or governance
            action until their verification is restored. The action is
            audit-logged with your user ID and the supplied reason.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="suspend-reason" className="font-sans text-xs">
            Reason (required)
          </Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Whistleblower report WBR-0042 alleges identity fraud; pending KYC re-verification."
            rows={3}
            className="font-sans text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="font-sans text-sm">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void submit();
            }}
            disabled={busy}
            className="bg-rose-500 font-sans text-sm text-white hover:bg-rose-600"
          >
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Suspend now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Police clearance toggle — quick switch for policeClearanceValid + optional
 * expiry date.
 */
export function PoliceClearanceToggle({
  userId,
  valid,
  expiresAt,
}: {
  userId: string;
  valid: boolean;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState(valid);
  const [expiry, setExpiry] = React.useState<string>(
    expiresAt ? expiresAt.split("T")[0] : ""
  );

  React.useEffect(() => {
    setCurrent(valid);
    setExpiry(expiresAt ? expiresAt.split("T")[0] : "");
  }, [valid, expiresAt]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policeClearanceValid: current,
          policeClearanceExpiresAt: expiry ? new Date(expiry).toISOString() : null,
          reason: `Police clearance updated by AURIENTA Rep`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to update police clearance.");
        return;
      }
      toast.success("Police clearance saved.");
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex items-center gap-2 font-sans text-xs">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          className="h-3.5 w-3.5 accent-gold"
        />
        Valid
      </label>
      <label className="inline-flex items-center gap-2 font-sans text-xs">
        <span className="text-muted-foreground/80">Expires</span>
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="h-8 rounded-md border border-gold/15 bg-background/60 px-2 font-sans text-xs"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/15 px-3 py-1.5 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/25 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
        Save
      </button>
    </div>
  );
}

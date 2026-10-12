// AURIENTA Offline CRE — Browser-safe offline-first CRE validation + queue.
//
// This module is the heart of the Offline PWA experience (Task 7c). It runs
// ENTIRELY client-side: no Node `crypto`, no `db`, no `@/lib/db` imports.
// It mirrors a subset of the deterministic CRE policies from
// `src/lib/aurienta/cre.ts` (which uses Node `createHash` for Ed25519 decision
// tokens — not browser-safe). For the offline path, decision tokens use a
// non-cryptographic FNV-1a hash that's adequate for queue ordering and for
// re-validation server-side at sync time.
//
// Three offline capabilities:
//   1. offlineValidate() — local CRE policy execution (no network).
//   2. OfflineQueue — durable localStorage-backed queue of deferred actions
//      (transaction signing, vote casting, endorsement creation) that get
//      POSTed to their target API routes when connectivity returns.
//   3. SMS notification stubs — queued locally for future SMS gateway dispatch.
//
// Mobile-first markets (Egypt, Nigeria, Pakistan): ~60% of AURIENTA's target
// users are mobile-first with intermittent connectivity. Offline CRE means a
// Constitutional Partner can sign a transaction on a bus, have it validated
// locally against the constitution, queue it, and auto-sync when they reach
// WiFi — never losing their work.

// ── Types ────────────────────────────────────────────────────────────────

export type OfflineVerdict = {
  allowed: boolean;
  reason?: string;
  policy: string;
  /** Deterministic, non-cryptographic token: `offline.<policy>.<allowed>.<hash>.<iso>` */
  decisionToken: string;
  /** ISO 8601 timestamp of when the offline decision was rendered. */
  timestamp: string;
  /** Always `true` for offline verdicts — distinguishes from server CRE tokens. */
  offline: true;
};

export type OfflineActionType =
  | "sign_transaction"
  | "cast_vote"
  | "create_endorsement";

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  payload: {
    /** API route to POST/PUT/PATCH when sync runs, e.g. "/api/orders". */
    endpoint: string;
    /** Request body to send (JSON-serializable). */
    body: unknown;
    /** HTTP method — defaults to POST. */
    method?: "POST" | "PUT" | "PATCH";
  };
  createdAt: string;
  status: "pending" | "synced" | "failed";
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
};

export type SmsNotification = {
  id: string;
  to: string;
  message: string;
  createdAt: string;
  dispatchedAt?: string;
  status: "queued" | "sent" | "failed";
};

export type OfflineStatus = {
  online: boolean;
  queueSize: number;
  lastSync: string | null;
};

// ── Browser-safe hashing (FNV-1a 32-bit) ──────────────────────────────────
//
// NOT cryptographic. Adequate for:
//   - decision token uniqueness within the offline queue
//   - server-side re-validation of the offline verdict at sync time
//
// For real tamper-evidence, the server re-runs the canonical CRE policy
// (signed with the platform Ed25519 key) when the queued action is synced.

function offlineHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // unsigned 32-bit, base36
  return (h >>> 0).toString(36);
}

function buildDecisionToken(
  policy: string,
  allowed: boolean,
  payload: unknown,
  ts: string
): string {
  const payloadHash = offlineHash(`${policy}|${JSON.stringify(payload)}`);
  return `offline.${policy}.${allowed ? "1" : "0"}.${payloadHash}.${ts}`;
}

// ── Browser-safe CRE policy subset ───────────────────────────────────────
//
// Mirrors the deterministic logic of `src/lib/aurienta/cre.ts` without any
// Node dependencies. Each function returns { allowed, reason } — the offline
// verdict wrapper stamps the rest (policy, decisionToken, timestamp, offline).
//
// Implemented (14 core policies):
//   zero_custody, price_band, kyc_gate, expense_authority, police_clearance,
//   family_consent, founder_equity_cap, tier_migration, dividend_lock,
//   not_frozen, quorum_check, equity_lockup, salary_constitutionality,
//   quadratic_vote
//
// Unknown policy names return a fail-safe `allowed: false` verdict with a
// descriptive reason — the offline queue then defers the decision to the
// server at sync time. This is the fail-secure behavior mandated by the
// blueprint's "Constitutional Runtime Engine" section.

type PolicyFn = (
  params: Record<string, unknown>
) => { allowed: boolean; reason?: string };

const POLICIES: Record<string, PolicyFn> = {
  // Non-amendable Rule I 1.1 — Zero Custody.
  zero_custody: (p) => {
    const beneficiary = String(p.beneficiary ?? "");
    const blocked = /aurienta/i.test(beneficiary);
    return {
      allowed: !blocked,
      reason: blocked
        ? "Zero Custody: transfer to AURIENTA-owned account denied"
        : undefined,
    };
  },

  // Fundamental pricing — phase 1/2 must equal fundamental; phase 3 ±5%.
  price_band: (p) => {
    const orderPrice = Number(p.orderPrice ?? 0);
    const fundamentalPrice = Number(p.fundamentalPrice ?? 0);
    const phase = String(p.phase ?? "");
    if (fundamentalPrice <= 0) {
      return {
        allowed: false,
        reason: "Price band: fundamental price is zero or unknown — cannot validate",
      };
    }
    if (phase === "phase_1" || phase === "phase_2") {
      const ok = Math.abs(orderPrice - fundamentalPrice) < 0.01;
      return {
        allowed: ok,
        reason: ok
          ? undefined
          : "Phase 1/2 orders must equal the AI fundamental price exactly",
      };
    }
    const band = (orderPrice - fundamentalPrice) / fundamentalPrice;
    const ok = band >= -0.05 && band <= 0.05;
    return {
      allowed: ok,
      reason: ok
        ? undefined
        : "Phase 3 orders must be within ±5% of the fundamental price",
    };
  },

  // KYC level gating — L0/L1 blocked, L2 capped 10k EGP, L4 for Tier F.
  kyc_gate: (p) => {
    const level = String(p.verificationLevel ?? "L0");
    const action = String(p.action ?? "");
    const amountEgp = p.amountEgp !== undefined ? Number(p.amountEgp) : undefined;
    if (level === "L0") {
      return {
        allowed: false,
        reason:
          "L0 (anonymous) Constitutional Partners cannot perform any transactional action",
      };
    }
    if (level === "L1") {
      return {
        allowed: false,
        reason:
          "L1 (email/mobile only) Constitutional Partners must complete KYC before transacting",
      };
    }
    if (level === "L2" && amountEgp !== undefined && amountEgp > 10_000) {
      return {
        allowed: false,
        reason:
          "L2 Constitutional Partners are capped at 10,000 EGP per transaction; complete enhanced KYC (L3) for higher amounts",
      };
    }
    if (action === "found_enterprise_tier_f" && level !== "L4") {
      return {
        allowed: false,
        reason: "Tier F (Joint Stock) founding requires L4 institutional verification",
      };
    }
    return { allowed: true };
  },

  // Expense authority — <1% manager/founding_operator, 1-10% dual sig, >10% board.
  expense_authority: (p) => {
    const amountEgp = Number(p.amountEgp ?? 0);
    const capitalEgp = Number(p.capitalEgp ?? 0);
    const role = String(p.role ?? "");
    if (capitalEgp <= 0) {
      return { allowed: false, reason: "Expense authority: capital base is zero" };
    }
    const pct = (amountEgp / capitalEgp) * 100;
    if (pct < 1) {
      const ok = role === "manager" || role === "founding_operator";
      return {
        allowed: ok,
        reason: ok
          ? undefined
          : "Expenses <1% require manager or founding_operator role",
      };
    }
    if (pct <= 10) {
      return {
        allowed: false,
        reason:
          "Expenses 1–10% require dual signature (manager + accounting_firm_rep) — cannot be approved offline by a single role",
      };
    }
    const ok = role === "board_member";
    return {
      allowed: ok,
      reason: ok ? undefined : "Expenses >10% require board approval",
    };
  },

  // Police clearance — required roles need valid, unexpired clearance.
  police_clearance: (p) => {
    const role = String(p.role ?? "");
    const clearanceValid = Boolean(p.clearanceValid);
    const clearanceExpiresAt = p.clearanceExpiresAt
      ? String(p.clearanceExpiresAt)
      : null;
    const requiresClearance = [
      "manager",
      "founding_operator",
      "board_member",
      "law_firm_rep",
      "accounting_firm_rep",
    ].includes(role);
    if (!requiresClearance) return { allowed: true };
    const expired = clearanceExpiresAt
      ? new Date(clearanceExpiresAt).getTime() < Date.now()
      : !clearanceValid;
    if (expired) {
      return {
        allowed: false,
        reason: `${role} appointment blocked: police clearance invalid, missing, or expired`,
      };
    }
    return { allowed: true };
  },

  // Family consent — family members >50k EGP need consent.
  family_consent: (p) => {
    const isFamilyMember = Boolean(p.isFamilyMember);
    const familyConsent = Boolean(p.familyConsent);
    const amountEgp = Number(p.amountEgp ?? 0);
    if (isFamilyMember && amountEgp > 50_000 && !familyConsent) {
      return {
        allowed: false,
        reason:
          "Family-member capital partners must obtain family consent for Capital Participation above 50,000 EGP",
      };
    }
    return { allowed: true };
  },

  // Founder equity cap — tier-based floor.
  founder_equity_cap: (p) => {
    const tier = String(p.tier ?? "");
    const proposedPct = Number(p.proposedFounderEquityPct ?? 0);
    const floor: Record<string, number> = {
      A: 5, B: 5, C: 10, D: 51, E: 0, F: 0,
    };
    const required = floor[tier] ?? 5;
    if (proposedPct < required) {
      return {
        allowed: false,
        reason: `Founding Operator equity dilution blocked: tier ${tier} requires Founding Operator / owner ≥ ${required}%`,
      };
    }
    return { allowed: true };
  },

  // Tier migration — no skipping A→B→C→D→F.
  tier_migration: (p) => {
    const cur = String(p.currentTier ?? "");
    const next = String(p.proposedTier ?? "");
    const order = ["A", "B", "C", "D", "F"];
    const ci = order.indexOf(cur);
    const ni = order.indexOf(next);
    if (cur === "E" || next === "E") return { allowed: true };
    if (ci === -1 || ni === -1) {
      return { allowed: false, reason: `Tier migration: unknown tier in ${cur}→${next}` };
    }
    const ok = ni === ci || ni === ci + 1;
    return {
      allowed: ok,
      reason: ok
        ? undefined
        : `Tier migration blocked: cannot skip from ${cur} to ${next}`,
    };
  },

  // Dividend lock — amount ≤ realized profits, 30-day cooldown.
  dividend_lock: (p) => {
    const dividendAmount = Number(p.dividendAmount ?? 0);
    const realizedProfits = Number(p.realizedProfits ?? 0);
    const lastDividendAt = p.lastDividendAt ? String(p.lastDividendAt) : null;
    if (dividendAmount > realizedProfits) {
      return {
        allowed: false,
        reason:
          "Dividend blocked: amount exceeds realized profits (capital held in the Law Firm Client Account is not distributable)",
      };
    }
    if (
      lastDividendAt &&
      Date.now() - new Date(lastDividendAt).getTime() < 30 * 24 * 60 * 60 * 1000
    ) {
      return {
        allowed: false,
        reason:
          "Dividend blocked: 30-day cooling-off period since last dividend has not elapsed",
      };
    }
    return { allowed: true };
  },

  // Not frozen — enterprise must not be in frozen status.
  not_frozen: (p) => {
    const status = String(p.status ?? "");
    const ok = status !== "frozen";
    return {
      allowed: ok,
      reason: ok
        ? undefined
        : "Enterprise is frozen — all transactions blocked by emergency freeze",
    };
  },

  // Quorum check — votes cast must meet quorum percentage.
  quorum_check: (p) => {
    const votesCast = Number(p.votesCast ?? 0);
    const totalVotingPower = Number(p.totalVotingPower ?? 0);
    const quorumPct = Number(p.quorumPct ?? 0);
    if (totalVotingPower <= 0) {
      return { allowed: false, reason: "Quorum: total voting power is zero" };
    }
    const ok = (votesCast / totalVotingPower) * 100 >= quorumPct;
    return {
      allowed: ok,
      reason: ok
        ? undefined
        : `Quorum not met: ${votesCast}/${totalVotingPower} (< ${quorumPct}%)`,
    };
  },

  // Equity lock-up — restricted-until date must be in the past.
  equity_lockup: (p) => {
    const restrictedUntil = p.restrictedUntil
      ? String(p.restrictedUntil)
      : null;
    if (!restrictedUntil) return { allowed: true };
    const until = new Date(restrictedUntil).getTime();
    if (Date.now() < until) {
      const daysRemaining = Math.ceil(
        (until - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return {
        allowed: false,
        reason: `Equity lock-up: transfer blocked — ${daysRemaining} day(s) remaining until lock-up expires`,
      };
    }
    return { allowed: true };
  },

  // Salary constitutionality — minimum wage floor + override ratio check.
  salary_constitutionality: (p) => {
    const proposedSalaryEgp = Number(p.proposedSalaryEgp ?? 0);
    const aiCalculatedSalaryEgp = p.aiCalculatedSalaryEgp
      ? Number(p.aiCalculatedSalaryEgp)
      : undefined;
    const isBoardOverride = Boolean(p.isBoardOverride);
    const boardVotePct = p.boardVotePct !== undefined ? Number(p.boardVotePct) : 0;
    // AURIENTA constitutional floor: 4,000 EGP/month.
    const MIN_WAGE = 4000;
    if (proposedSalaryEgp < MIN_WAGE) {
      return {
        allowed: false,
        reason: `Salary blocked: ${proposedSalaryEgp} EGP/month is below the AURIENTA constitutional floor of ${MIN_WAGE} EGP/month`,
      };
    }
    if (
      isBoardOverride &&
      aiCalculatedSalaryEgp &&
      aiCalculatedSalaryEgp > 0 &&
      proposedSalaryEgp / aiCalculatedSalaryEgp > 2 &&
      boardVotePct < 75
    ) {
      return {
        allowed: false,
        reason:
          "Salary override >2x AI-calculated requires ≥75% board vote (or shareholder notification)",
      };
    }
    return { allowed: true };
  },

  // Quadratic vote — vote power = sqrt(tokens). Validates the allocation.
  quadratic_vote: (p) => {
    const tokens = Number(p.tokens ?? 0);
    const spent = Number(p.spent ?? 0);
    if (tokens < 0 || spent < 0) {
      return { allowed: false, reason: "Quadratic vote: negative input rejected" };
    }
    if (spent > tokens) {
      return {
        allowed: false,
        reason: `Quadratic vote: spent (${spent}) exceeds tokens (${tokens})`,
      };
    }
    // vote power = floor(sqrt(spent)); client just confirms the math is valid.
    return { allowed: true };
  },
};

// ── offlineValidate — run a CRE policy locally ───────────────────────────

/**
 * Run a CRE policy entirely client-side. Returns a verdict stamped with
 * `offline: true` and an ISO timestamp. The decision token is non-cryptographic
 * (FNV-1a hash) — the server re-validates against the canonical Ed25519-signed
 * policy at sync time.
 *
 * For unknown policy names, returns `allowed: false` with a descriptive reason
 * (fail-secure behavior mandated by the blueprint).
 */
export function offlineValidate(
  policyName: string,
  params: Record<string, unknown>
): OfflineVerdict {
  const ts = new Date().toISOString();
  const fn = POLICIES[policyName];
  if (!fn) {
    return {
      allowed: false,
      reason: `Offline CRE: unknown policy '${policyName}' — action deferred to sync`,
      policy: policyName,
      decisionToken: buildDecisionToken(
        policyName,
        false,
        { error: "unknown_policy", params },
        ts
      ),
      timestamp: ts,
      offline: true,
    };
  }
  const result = fn(params);
  return {
    allowed: result.allowed,
    reason: result.reason,
    policy: policyName,
    decisionToken: buildDecisionToken(policyName, result.allowed, params, ts),
    timestamp: ts,
    offline: true,
  };
}

/** List of policy names implemented in the offline registry. */
export function listOfflinePolicies(): string[] {
  return Object.keys(POLICIES).sort();
}

// ── OfflineQueue — durable localStorage-backed action queue ──────────────

const QUEUE_KEY = "aurienta:offline-queue";
const LAST_SYNC_KEY = "aurienta:offline-last-sync";
const SMS_KEY = "aurienta:offline-sms";
const MAX_ATTEMPTS = 5;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

class OfflineQueueStore {
  private read(): OfflineAction[] {
    if (!isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as OfflineAction[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: OfflineAction[]): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    } catch {
      // Quota exceeded — drop the oldest pending item and retry once.
      try {
        const trimmed = items.slice(-50);
        window.localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
      } catch {
        // Give up silently — offline queue is best-effort.
      }
    }
  }

  /**
   * Add an action to the offline queue. Returns the persisted action with
   * generated id + createdAt + status='pending'.
   */
  enqueue(
    action: Omit<OfflineAction, "id" | "createdAt" | "status" | "attempts">
  ): OfflineAction {
    const item: OfflineAction = {
      ...action,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: "pending",
      attempts: 0,
    };
    const items = this.read();
    items.push(item);
    this.write(items);
    return item;
  }

  /** Return the next pending action without removing it. */
  dequeue(): OfflineAction | undefined {
    return this.read().find((i) => i.status === "pending");
  }

  /** Peek at the next pending action (alias for dequeue). */
  peek(): OfflineAction | undefined {
    return this.read().find((i) => i.status === "pending");
  }

  /** Count of pending actions awaiting sync. */
  size(): number {
    return this.read().filter((i) => i.status === "pending").length;
  }

  /** Total count of all actions (pending + synced + failed). */
  total(): number {
    return this.read().length;
  }

  /** All actions in the queue (any status). */
  all(): OfflineAction[] {
    return this.read();
  }

  /** Clear the entire queue (including pending items). */
  clear(): void {
    this.write([]);
  }

  /** Remove only synced actions, keeping pending + failed for retry. */
  clearSynced(): void {
    this.write(this.read().filter((i) => i.status !== "synced"));
  }

  markSynced(id: string): void {
    const items = this.read();
    const item = items.find((i) => i.id === id);
    if (item) {
      item.status = "synced";
      item.lastAttemptAt = new Date().toISOString();
      this.write(items);
    }
  }

  markFailed(id: string, error: string): void {
    const items = this.read();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.attempts += 1;
    item.lastAttemptAt = new Date().toISOString();
    item.error = error;
    // Re-queue for retry unless we've exceeded MAX_ATTEMPTS.
    item.status = item.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
    this.write(items);
  }
}

/**
 * The singleton OfflineQueue instance. Use this to enqueue actions and
 * inspect queue state. All operations are synchronous (localStorage-backed).
 */
export const OfflineQueue = new OfflineQueueStore();

// ── syncOfflineQueue — flush pending actions when online ─────────────────

/**
 * Iterate all pending actions in the offline queue, POST/PUT/PATCH each to
 * its target API endpoint, and mark synced/failed. Safe to call when offline
 * (returns { synced: 0, failed: 0 } immediately).
 *
 * On success, updates the last-sync timestamp in localStorage.
 */
export async function syncOfflineQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  if (!isBrowser() || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  const pending = OfflineQueue.all().filter((i) => i.status === "pending");
  let synced = 0;
  let failed = 0;
  for (const item of pending) {
    const method = item.payload.method ?? "POST";
    try {
      const res = await fetch(item.payload.endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload.body),
        credentials: "same-origin",
      });
      if (res.ok) {
        OfflineQueue.markSynced(item.id);
        synced += 1;
      } else {
        const text = await res.text().catch(() => "");
        OfflineQueue.markFailed(
          item.id,
          `HTTP ${res.status}: ${text.slice(0, 200)}`
        );
        failed += 1;
      }
    } catch (err) {
      OfflineQueue.markFailed(
        item.id,
        err instanceof Error ? err.message : String(err)
      );
      failed += 1;
    }
  }
  if (synced > 0 && isBrowser()) {
    try {
      window.localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch {
      // Best-effort.
    }
  }
  return { synced, failed };
}

/**
 * Snapshot of the offline status: online flag, pending queue size, last sync
 * timestamp (ISO string or null).
 */
export function getOfflineStatus(): OfflineStatus {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const queueSize = OfflineQueue.size();
  let lastSync: string | null = null;
  if (isBrowser()) {
    try {
      lastSync = window.localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      lastSync = null;
    }
  }
  return { online, queueSize, lastSync };
}

// ── SMS notification stubs ───────────────────────────────────────────────
//
// STUB: In production, queued SMS would be dispatched via Twilio/Vonage when
// online. For now, they're stored locally and surfaced in the UI as
// "SMS queued". The /api/notifications/sms route is a future task.

export function queueOfflineSms(to: string, message: string): SmsNotification {
  const notif: SmsNotification = {
    id: generateId(),
    to,
    message,
    createdAt: new Date().toISOString(),
    status: "queued",
  };
  if (isBrowser()) {
    try {
      const all = getQueuedSms();
      all.push(notif);
      window.localStorage.setItem(SMS_KEY, JSON.stringify(all));
    } catch {
      // Best-effort.
    }
  }
  // Future: when online, fire a fetch to "/api/notifications/sms" which
  // integrates with the SMS gateway. For now, the notification stays queued
  // locally and is surfaced via getQueuedSms() in the offline UI.
  return notif;
}

export function getQueuedSms(): SmsNotification[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SMS_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SmsNotification[]) : [];
  } catch {
    return [];
  }
}

export function clearQueuedSms(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(SMS_KEY);
  } catch {
    // Best-effort.
  }
}

// AURIENTA account lockout — brute-force protection.
//
// Tracks failed login attempts per (normalized) email address. After
// MAX_FAILED_ATTEMPTS consecutive failures the account is locked for
// LOCK_DURATION_MS. Successful authentication clears the counter.
//
// Lockout state persists in the `AccountLockout` table so it survives process
// restarts and is shared across replicas in production. A locked account
// short-circuits the password verification path entirely — the password
// hash is never even read from the DB — preventing timing oracles.
//
// The record is keyed by email (not user id) so that lockout applies even
// before we know which user account is being targeted (e.g. a username that
// matches no row). This eliminates the user-exists timing side-channel.

import { db } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export type LockoutStatus = {
  locked: boolean;
  remainingMs?: number;
  failedAttempts?: number;
};

/**
 * Returns the current lockout status for an email. If `locked` is true the
 * caller MUST refuse to verify the password and return a 423 (Locked) HTTP
 * status with the `remainingMs` so the client can show a countdown.
 */
export async function checkLockout(email: string): Promise<LockoutStatus> {
  const record = await db.accountLockout.findUnique({
    where: { email },
  });
  if (!record || !record.lockedUntil) {
    return { locked: false, failedAttempts: record?.failedAttempts ?? 0 };
  }
  if (record.lockedUntil.getTime() > Date.now()) {
    return {
      locked: true,
      remainingMs: record.lockedUntil.getTime() - Date.now(),
      failedAttempts: record.failedAttempts,
    };
  }
  // Lock expired — treat as not locked (counter still visible to caller).
  return { locked: false, failedAttempts: record.failedAttempts };
}

/**
 * Record a failed authentication attempt for the given email. If the running
 * counter crosses MAX_FAILED_ATTEMPTS, the account is locked for
 * LOCK_DURATION_MS. Returns the post-increment state so the caller can
 * surface "X attempts remaining" in the response.
 */
export async function recordFailedAttempt(
  email: string
): Promise<{ locked: boolean; attempts: number; attemptsRemaining: number }> {
  const existing = await db.accountLockout.findUnique({
    where: { email },
  });
  const attempts = (existing?.failedAttempts ?? 0) + 1;
  const locked = attempts >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = locked ? new Date(Date.now() + LOCK_DURATION_MS) : null;

  await db.accountLockout.upsert({
    where: { email },
    create: {
      email,
      failedAttempts: attempts,
      lockedUntil,
      lastFailedAt: new Date(),
    },
    update: {
      failedAttempts: attempts,
      lockedUntil,
      lastFailedAt: new Date(),
    },
  });

  return {
    locked,
    attempts,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
  };
}

/**
 * Reset the lockout counter for an email. Called on every successful sign-in
 * so that a single success clears any prior failed attempts. Also runs when a
 * passkey authentication succeeds (since passkeys are phishing-resistant and
 * never produce a password-failure event, but the email may still have an
 * outstanding lockout from a prior password attempt — clear it for UX).
 */
export async function resetLockout(email: string): Promise<void> {
  await db.accountLockout.upsert({
    where: { email },
    create: { email, failedAttempts: 0, lockedUntil: null },
    update: { failedAttempts: 0, lockedUntil: null },
  });
}

export const LOCKOUT_LIMITS = {
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  lockDurationMs: LOCK_DURATION_MS,
} as const;

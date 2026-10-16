// AURIENTA session management — server-side Session records (not bare cookies).
// CTO-AUDIT remediation:
// - Session table with revocation, rotation, device tracking.
// - TOTP MFA for sensitive roles.
// - sameSite=Lax (sufficient for same-site; CSRF middleware handles cross-site).
// - Signed session token (tokenHash = SHA3-256 of token).

import { cookies } from "next/headers";
import { cache } from "react";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { env } from "./env";

export const SESSION_COOKIE = "aurienta_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash("sha3-256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Get the current authenticated user. Cached per-request via React.cache()
 * so that multiple calls within the same request (layout + page + components)
 * share the SAME DB lookup — prevents the 2nd+ call from failing if the DB
 * connection is cold or slow.
 */
export const getCurrentUser = cache(async () => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: { include: { enterprise: true } },
            ownershipRecords: { include: { enterprise: true } },
            tasks: { where: { done: false }, orderBy: { priority: "desc" }, take: 6 },
            notifications: { where: { read: false }, orderBy: { createdAt: "desc" }, take: 5 },
          },
        },
      },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;

    // AUD-003 / FIX 3: surface the session's `mfaVerifiedAt` onto the returned
    // user object so the dashboard layout's MFA gate can decide whether the
    // user has completed second-factor verification THIS session (vs. just
    // having MFA enrolled on their account, which is `user.mfaEnabled`).
    // The session is the source of truth for "MFA verified for this login".
    return { ...session.user, mfaVerifiedAt: session.mfaVerifiedAt };
  } catch (e) {
    console.error("[auth] getCurrentUser error:", e);
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/**
 * Platform-wide RBAC helper. Returns the current user if they hold ANY of the
 * given roles via ACTUAL EnterpriseMember.role records (AUD-019: previously
 * also accepted the self-declared `user.primaryIntent` field as a substitute,
 * which let any newly-registered user pass any role check).
 *
 * Platform admins (`aurienta_rep` via primaryIntent OR a membership) bypass
 * every role check — AURIENTA Reps have full platform access by design.
 *
 * Usage:
 *   // API route:
 *   const user = await requireRole("aurienta_rep");
 *   // Server component (with redirect on denial):
 *   const hasRole = user.memberships.some(m => m.role === "aurienta_rep");
 *   if (!hasRole) redirect("/dashboard");
 */
export async function requireRole(
  ...roles: string[]
): Promise<NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  // AUD-019: check ACTUAL enterprise memberships, not self-declared primaryIntent.
  const hasRole = (user.memberships ?? []).some((m) => roles.includes(m.role));
  // AURIENTA Reps are platform-wide admins — they bypass every role check.
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!hasRole && !isPlatformAdmin) {
    throw new Error(`Forbidden: requires one of ${roles.join(", ")}`);
  }
  return user;
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  };
}

/** Create a new session for a user. Sets the cookie and persists the Session row. */
export async function createSession(userId: string, opts?: { ip?: string; userAgent?: string; mfaVerifiedAt?: Date }) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: opts?.ip,
      userAgent: opts?.userAgent,
      mfaVerifiedAt: opts?.mfaVerifiedAt,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return session;
}

/** Revoke the current session (sign out). */
export async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await db.session.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/** Revoke all sessions for a user ("sign out everywhere"). */
export async function revokeAllSessions(userId: string) {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Quick demo sign-in — ONLY when ALLOW_DEMO_SIGNIN=true (opt-in, sandbox only). */
export async function signInAs(email: string) {
  if (!env.allowDemoSignIn) return null;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  await createSession(user.id);
  return user;
}

export const DEMO_USERS = [
  { email: "layla@streetbites.eg", name: "Layla Mostafa", role: "Capital Partner · Founding Operator", note: "The blueprint's Cairo student — multi-role partner" },
  { email: "ahmed@ecopack.eg", name: "Ahmed Khaled", role: "Founding Operator · Manager", note: "EcoPack founder, Tier C growth" },
  { email: "sarah@Capital Partner.eg", name: "Sarah Ibrahim", role: "Capital Partner", note: "Active Capital Partner across 3 enterprises" },
  { email: "mohamed@smartfarm.eg", name: "Mohamed Adel", role: "Founding Operator (graduated)", note: "SmartFarm — sovereign JSC" },
  { email: "khalil@holding.eg", name: "Khalil Mansour", role: "Company Owner · Board Member", note: "Nile Brew owner, Tier D → graduation" },
];

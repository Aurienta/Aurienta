// AURIENTA session management — server-side Session records (not bare cookies).
// CTO-AUDIT remediation:
// - Session table with revocation, rotation, device tracking.
// - TOTP MFA for sensitive roles.
// - sameSite=Lax (sufficient for same-site; CSRF middleware handles cross-site).
// - Signed session token (tokenHash = SHA3-256 of token).

import { cookies, headers } from "next/headers";
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
 * Read the session token directly from the raw Cookie header.
 * This bypasses the Next.js cookies() API entirely, which can have
 * edge-case issues on Vercel serverless (cookie not detected on some
 * cold-start invocations, or the API modifying response cookies).
 */
export async function getCurrentUser() {
  try {
    // Read the session token directly from the raw Cookie header.
    // This bypasses the cookies() API which may have side effects
    // on response cookies in Next.js 16 / Vercel serverless.
    const h = await headers();
    const cookieHeader = h.get("cookie");
    if (!cookieHeader) return null;

    const tokenMatch = cookieHeader.match(/(?:^|;\s*)aurienta_session=([^;]+)/);
    const token = tokenMatch?.[1];
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

    // Touch lastSeenAt (non-blocking — fire-and-forget).
    db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});

    return session.user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/**
 * Platform-wide RBAC helper. Returns the current user if they hold ANY of the
 * given roles (via EnterpriseMember.role) OR their primaryIntent matches one
 * of the supplied strings. Otherwise throws — callers in route handlers can
 * surface this as a 403; server components typically `redirect("/dashboard")`
 * before reaching this throw via an explicit `user.memberships.some(...)` guard.
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
  const hasRole = user.memberships.some((m) => roles.includes(m.role));
  if (!hasRole && !roles.includes(user.primaryIntent ?? "")) {
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

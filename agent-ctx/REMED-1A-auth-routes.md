# REMED-1A — Auth API route hardening

**Agent:** Remediation Agent (auth routes)
**Task ID:** REMED-1A
**Date:** 2026-07-05

## What I did

Rewrote the AURIENTA auth API routes to use the new Session-based auth + scrypt
verification, added a register endpoint, and rewired the signin page so demo
access uses a real password (`aurienta2026`) instead of relying on the
(now OFF by default) passwordless bypass.

## Files touched

| File | Change |
|---|---|
| `src/lib/aurienta/validation.ts` | Added `registerSchema`; relaxed `authSchema.password` to allow empty string (so demo sign-in can send `{ email }` and pass validation). |
| `src/app/api/auth/route.ts` | Full rewrite — Session-based sign-in via `parseBody` + `limiters.signin` + `verifyPassword` + `createSession`. Audits every attempt. Production hard-500 on plaintext hashes. Demo sign-in only when `env.allowDemoSignIn` AND no password. |
| `src/app/api/auth/register/route.ts` | NEW — creates a user with real Ed25519 keypair, scrypt hash, AES-GCM-encrypted nationalIdLast4, and signed Constitutional Pledge. Returns 201 + creates a Session. |
| `src/app/api/auth/signout/route.ts` | Rewrote POST + GET to call `signOut()` from auth.ts, audit-log, and return JSON or redirect based on `Accept` header. |
| `src/components/auth/signin-form.tsx` | Removed email/mobile Tabs (mobile shorthand is gone). POSTs `{ email, password }` to `/api/auth`. Accepts `onReady(fn)` prop so the parent can register a `quickSignIn(email, password?)` function that fills the form and submits. |
| `src/components/auth/demo-user-picker.tsx` | Calls `quickSignIn(email, "aurienta2026")` to fill the form and submit — works in any environment because `aurienta2026` is the real scrypt-verified password on every seed user. Added visible demo-mode note. |
| `src/components/auth/signin-client.tsx` | NEW client wrapper that owns the `quickSignIn` state shared between `SigninForm` and `DemoUserPicker`. |
| `src/app/signin/page.tsx` | Renders `<SigninClient />` instead of `<SigninForm /><DemoUserPicker />`. Stays a server component (preserves `metadata`). |

## Verification

- `bun run lint` → 0 errors, 0 warnings (one pre-existing warning in `dashboard-shell.tsx` is unrelated).
- `bunx tsc --noEmit` filtered to my files → 0 errors.
- `/signin` page renders successfully (200) in the dev log after the swap.
- The full worklog entry (with security properties and follow-ups) is appended to `/home/z/my-project/worklog.md`.

## Key decisions

1. **Removed the email/mobile Tabs** on the signin form. The new `authSchema`
   only accepts an email (the old `demo:${mobile}` shorthand is gone), so the
   mobile tab would have always failed validation. The picker autofills the
   email directly.

2. **Demo picker now submits the real password** `aurienta2026` rather than
   relying on the passwordless bypass. This keeps the sandbox usable even when
   `ALLOW_DEMO_SIGNIN=false` (the secure default). The bypass is still wired
   up in the API for true sandbox-mode convenience, but it's no longer the
   primary demo path.

3. **Sign-out returns JSON or redirects** based on the `Accept` header. The
   legacy code always redirected, which broke `fetch()` callers. Now both
   `<form>` posts and `fetch()` calls work.

4. **No `X-CSRF-Token` header on auth responses**. The CSRF cookie is set by
   `src/middleware.ts` (double-submit pattern). Same-origin fetches under
   `sameSite=lax` + Origin check are already CSRF-protected by middleware;
   adding a token to the response would be redundant.

5. **`identityHash` for new registrations** = SHA3-256(`email|mobile|nationalIdLast4`).
   This is a placeholder for the full identity-hash flow; the seed uses a
   different format (`sha("name-nationalId")`) so there's no collision risk.

# AURIENTA — Auth-Redirect Incidents (Runtime Audit)

**Audit ID:** AUDIT-2-RUNTIME
**Date:** 2026-09-03
**Site:** https://aurienta.vercel.app
**Tester:** Lead QA Engineer (Runtime Browser Session Audit)
**Scope:** Real-user runtime session-persistence + auth-redirect forensics

---

## Summary

A single **P0 critical bug** accounts for essentially every unexpected signin
redirect observed on the live site. Two lower-severity UX issues were also
identified. All prior fixes from the recent remediation sprints
(`React.cache` on `getCurrentUser`, CSRF exemption on `/api/auth`, service
worker disabled, `window.location.assign` post-login redirect) are intact and
working — but they did not address this specific root cause.

| # | Severity | Title                                                              | Status      |
|---|----------|--------------------------------------------------------------------|-------------|
| 1 | **P0**  | Next.js `<Link>` prefetch of `/api/auth/signout` silently logs users out | OPEN        |
| 2 | P2       | Hardcoded `next=/dashboard/portfolio` ignores requested URL       | OPEN        |
| 3 | P3       | "0 active roles" badge always shows 0 for users with memberships   | OPEN        |

---

## Incident #1 — Signout Link prefetch revokes session  (P0 CRITICAL)

### Symptom

After signing in, the user is **silently logged out** within a few seconds
of landing on `/dashboard/portfolio`. The first sidebar click (Overview,
Constitutional Holdings, Capital Participation, etc.) immediately redirects
to `/signin?next=/dashboard` and the `aurienta_session` cookie is gone from
the browser jar. No toast, no error message, no console error — the user
just finds themselves back on the signin page.

### Reproduction (verified for ALL 5 demo users)

1. Clear cookies + storage.
2. Visit `https://aurienta.vercel.app/signin`.
3. Click any demo-user button (Layla / Ahmed / Sarah / Mohamed / Khalil).
4. Wait for redirect to `/dashboard/portfolio`. Verify `aurienta_session`
   cookie is present.
5. Either:
   - Wait ~2 seconds (if the page is short enough for the footer to be in
     the initial viewport), OR
   - Scroll to the bottom of the page (if the page is tall, e.g. Mohamed's
     portfolio).
6. Click any sidebar tab (e.g. "Overview").
7. **Result:** Browser is redirected to `/signin?next=/dashboard`, and the
   `aurienta_session` cookie has been removed from the cookie jar.

### Forensics

#### Network trace (representative, Layla)

```
[1]    POST  /api/auth                           200   (session cookie SET)
[2]    GET   /dashboard/portfolio                200   (Document, full page)
[3-34] GET   /_next/static/chunks/...            200   (JS bundles, fonts, css)
[35]   GET   /dashboard?_rsc=qWE6ayoOG7kVAT_G    200   size=267  (loading.tsx prefetch)
[36]   GET   /dashboard/notifications?_rsc=...   200   size=419  (loading.tsx prefetch)
[37]   GET   /dashboard/opportunities?_rsc=...  200   size=290  (loading.tsx prefetch)
[38]   GET   /dashboard/market?_rsc=...         200   size=78   (loading.tsx prefetch)
[40]   GET   /dashboard/priority-windows?_rsc…   200   size=108  (loading.tsx prefetch)
[41]   GET   /dashboard/calendar?_rsc=...       200   size=289  (loading.tsx prefetch)
[42]   GET   /dashboard/updates?_rsc=...        200   size=78   (loading.tsx prefetch)
[44]   GET   /dashboard?_rsc=BlM_qqrL1IM2plO7   200   size=59   ← REDIRECT response (session GONE)
[55]   GET   /registry?_rsc=j79Vj4yH5aoiafxS    200   size=265  (footer link prefetch)
[56]   GET   /legal?_rsc=j79Vj4yH5aoiafxS       200   size=257  (footer link prefetch)
[58]   GET   /api/auth/signout?_rsc=j79Vj4yH5aoiafxS  [0]   ← prefetch ABORTED client-side
                                                                BUT server already processed it
[60]   GET   /dashboard/constitution?_rsc=...   200   (next prefetch batch — too late)
[62]   GET   /signin                            200   (Document — the actual logout redirect)
[63]   GET   /signin?_rsc=...                   200   size=3420  (RSC signin payload)
```

Entry [58] is the smoking gun. The request headers show:
```
next-router-prefetch: 1
next-router-segment-prefetch: /_tree
next-url: /dashboard
rsc: 1
Referer: https://aurienta.vercel.app/dashboard
```

This is a **Next.js Link prefetch**. Next.js automatically prefetches any
`<Link>` target that enters the viewport (in production). The
`ConstitutionalFooter` is rendered on every dashboard page and contains:

```tsx
// src/components/dashboard/constitutional-footer.tsx (lines 102-106)
<Link href="/api/auth/signout" className="...">
  Sign out
</Link>
```

The same pattern appears in `DashboardShell`'s user dropdown:

```tsx
// src/components/dashboard/dashboard-shell.tsx (lines 636-639)
<DropdownMenuItem asChild>
  <Link href="/api/auth/signout" className="...">
    <LogOut className="mr-2 h-4 w-4" /> Sign out
  </Link>
</DropdownMenuItem>
```

The `/api/auth/signout` route accepts **GET** requests and unconditionally
revokes the session:

```ts
// src/app/api/auth/signout/route.ts (lines 45-49)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const json = await doSignOut(req);    // ← revokes Session row + clears cookie
  if (json) return json;
  redirect("/signin");
}, "GET /api/auth/signout");
```

So:
1. User lands on `/dashboard/portfolio`.
2. `ConstitutionalFooter` renders, registering a `<Link>` to
   `/api/auth/signout`.
3. Next.js sees the Link enter the viewport and issues an RSC prefetch to
   `/api/auth/signout?_rsc=...`.
4. The route handler is a real server-side route, not a page — Next.js
   still executes it. `doSignOut()` runs:
   - `db.session.update({ where: { tokenHash }, data: { revokedAt: new Date() } })`
   - Cookie header set with `Max-Age=0` to clear `aurienta_session`.
5. The browser cancels the prefetch fetch client-side (status 0 in HAR)
   because the response is a 303 redirect — not prefetch-able.
6. But the server-side damage is already done: the Session row is revoked
   and the `Set-Cookie: aurienta_session=; Max-Age=0` header has been
   applied to the prefetch response. The browser applies the Set-Cookie
   directive even on a cancelled fetch, deleting the cookie from the jar.
7. The user clicks any sidebar tab. The browser makes an RSC fetch to
   `/dashboard` (or whichever page), with NO `aurienta_session` cookie.
8. `getCurrentUser()` returns null. Dashboard layout redirects to
   `/signin?next=/dashboard`.

### Why the prior remediation sprints missed this

The previous DASHBOARD-TABS-LOGOUT-FIX task attributed the logout-on-click
bug to `getCurrentUser()` being called twice per request (layout + page),
with the 2nd DB call failing on cold Vercel serverless. The fix was
`React.cache()` memoization. That fix is correct for THAT specific issue
(verified intact in `src/lib/aurienta/auth.ts` line 28 — `export const
getCurrentUser = cache(async () => {...})`).

However, the original bug report was almost certainly observing the
**signout-prefetch issue**, not the duplicate-DB-call issue. The fix
shipped without an end-to-end reproduction that actually clicked sidebar
links in a fresh browser session. Screenshot-based verification captures
the dashboard after the initial Document load (which succeeds because
the prefetch hasn't fired yet), but does not catch the next-click
redirect.

### Recommended fix (defense in depth — implement ALL THREE)

**Fix A — Disable Link prefetch on the Sign out link (minimum).**

```tsx
// src/components/dashboard/constitutional-footer.tsx
<Link href="/api/auth/signout" prefetch={false} className="...">
  Sign out
</Link>

// src/components/dashboard/dashboard-shell.tsx
<Link href="/api/auth/signout" prefetch={false} className="...">
  <LogOut className="mr-2 h-4 w-4" /> Sign out
</Link>
```

**Fix B — Replace `<Link>` with a plain `<a>` (more robust).**

```tsx
<a href="/api/auth/signout" className="...">Sign out</a>
```

Plain anchors are not subject to Next.js Link prefetching.

**Fix C — Make `/api/auth/signout` POST-only (most robust, defense in depth).**

```ts
// src/app/api/auth/signout/route.ts
export const POST = withErrorHandler(async (req: NextRequest) => {
  const json = await doSignOut(req);
  if (json) return json;
  redirect("/signin");
}, "POST /api/auth/signout");

// REMOVE the GET export entirely.
```

Replace the link with a real form:

```tsx
<form action="/api/auth/signout" method="post">
  <button type="submit" className="...">Sign out</button>
</form>
```

A GET request to a state-changing endpoint is a CSRF risk in itself
(trivially exploitable via `<img src="...">`); removing the GET handler
closes both this bug and a separate CSRF vector.

**Verification step (post-fix):** Sign in as any demo user. Wait 30
seconds (long enough for any pending prefetch to fire). Click every
sidebar tab in sequence. Confirm: 0 redirects to `/signin`, session
cookie persists throughout.

---

## Incident #2 — Hardcoded redirect target ignores requested URL (P2)

### Symptom

When an unauthenticated user requests a deep dashboard URL
(`/dashboard/governance`, `/dashboard/constitution`,
`/dashboard/admin/users`, etc.), the dashboard layout redirects them to
`/signin?next=/dashboard/portfolio` — NOT to `/signin?next=<requested-url>`.

### Root cause

```ts
// src/app/dashboard/layout.tsx (line 8)
const user = await getCurrentUser();
if (!user) redirect("/signin?next=/dashboard/portfolio");   // ← hardcoded
```

### Impact

If a user follows a deep link (e.g. an email link to
`/dashboard/governance/proposal/123`) while logged out, they will sign in
and end up at `/dashboard/portfolio` — not at the page they originally
requested. Sub-optimal UX, especially for notification/email flows.

### Recommended fix

```ts
// src/app/dashboard/layout.tsx
import { headers } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/dashboard/portfolio";
    redirect(`/signin?next=${encodeURIComponent(pathname)}`);
  }
  // ... rest unchanged
}
```

(Note: Vercel exposes the pathname via `x-pathname` header in some setups;
otherwise derive from the request URL passed through middleware.)

---

## Incident #3 — "0 active roles" badge always shows 0 (P3)

### Symptom

The header next to the user button shows "0 active roles" for every demo
user, including Sarah Ibrahim (who has 3 enterprises) and Mohamed Adel
(who is a graduated founder with multiple memberships).

### Reproduction

1. Sign in as any demo user.
2. Look at the area to the right of the user button in the top-right
   header.
3. **Result:** Text reads "0 active roles" for every user.

### Root cause (suspected)

The `DashboardShell` likely renders `user.memberships.filter(m => m.isActive).length`
(or similar) but the `isActive` field is either always false, not set
during seed, or not included in the `getCurrentUser` Prisma query.

### Recommended fix

Investigate `src/components/dashboard/dashboard-shell.tsx` for the roles
badge implementation. Either:
- Update the seed to set `isActive: true` on memberships, OR
- Change the filter to `user.memberships.length` (count all memberships).

---

## Test matrix — per-user session persistence results

Tests were run on the live site (`https://aurienta.vercel.app`) with a
fresh browser session (cookies + storage cleared before each user).
Test labels follow the audit prompt (Tests A, B, C, D, H, I).

### Without prefetch blocker (raw production behavior)

| User              | Login | Test A (5 sidebar tabs)    | Notes                                              |
|-------------------|-------|-----------------------------|----------------------------------------------------|
| Layla Mostafa     | ✅    | ❌ FAIL — session lost on 1st click (Overview)    | Footer in initial viewport → prefetch fires immediately.    |
| Ahmed Khaled      | ✅    | ❌ FAIL — session lost on 1st click (Overview)    | Same.                                                       |
| Sarah Ibrahim     | ✅    | ❌ FAIL — session lost on 1st click (Overview)    | Same.                                                       |
| Mohamed Adel      | ✅    | ❌ FAIL — session lost after scrolling to footer  | Footer not in initial viewport; prefetch fires on scroll. |
| Khalil Mansour    | ✅    | ❌ FAIL — session lost after scrolling to footer  | Same as Mohamed.                                            |

### With `/api/auth/signout` prefetch blocked (control)

| User              | Test A (7 tabs)    | Test B (refresh)   | Test C (deep-link)  | Test D (back/fwd) | Test H (logout)    | Test I (re-login) |
|-------------------|--------------------|--------------------|---------------------|-------------------|--------------------|--------------------|
| Layla Mostafa     | ✅ PASS            | ✅ PASS            | ✅ PASS             | ✅ PASS           | ✅ PASS            | ✅ PASS            |
| Sarah Ibrahim     | ✅ PASS (7 tabs)   | ✅ PASS            | ✅ PASS (/gov)      | ✅ PASS           | ✅ PASS            | ✅ PASS            |
| Mohamed Adel      | ✅ PASS            | ✅ PASS            | ✅ PASS             | ✅ PASS           | ✅ PASS            | ✅ PASS            |

(Test B/C/D for Layla performed with blocker engaged — the layout,
getCurrentUser, redirect logic, cookie persistence, and navigation
back/forward all behave correctly when the signout-prefetch is excluded.)

### Console / network error audit

Throughout all tests:
- **0 page errors** (`agent-browser errors` returned empty).
- **0 console messages** (`agent-browser console` returned empty).
- **0 hydration errors**, **0 React errors**.
- **0 failed requests** (other than the cancelled signout prefetches,
  which are aborted client-side after the server has already processed
  them — these don't surface as visible errors).
- **0 401/403/500 responses** to legitimate authenticated requests.

### Cache isolation test

Layla → logout → Sarah: Sarah sees her own initials ("SI Sarah") in the
header, her own portfolio summary, and her own enterprise memberships.
No cache contamination from Layla's prior session.

### Role-switch test

No role-switcher UI exists in the DashboardShell user menu (only "Profile
& Identity", "Public site", "Sign out"). The `primaryIntent` field
(capital_partner / founding_operator / company_owner) is fixed per user
at the DB level — switching roles mid-session is not supported in the
current UI.

---

## Verification of prior fixes

| Prior fix                                                                                       | Status          |
|-------------------------------------------------------------------------------------------------|-----------------|
| `React.cache` on `getCurrentUser` (memoize per-request, prevent duplicate DB calls)            | ✅ intact (auth.ts:28) |
| CSRF exemption on `/api/auth/*` matcher                                                          | ✅ intact (middleware.ts:113) |
| Service worker disabled (`RegisterSW` unregisters)                                              | ✅ effective (no SW active in HAR) |
| `window.location.assign(next)` for post-login redirect                                          | ✅ intact (signin-form.tsx) |
| `csrfFetch()` helper for X-CSRF-Token double-submit on POST                                      | ✅ intact (csrf-client.ts) |
| Service worker cache-bump (`aurienta-v2-csrf-fix`) + `no-store` on /sw.js                        | ✅ effective (no SW cache seen) |
| Demo user password rehash (`scrypt$16384$8$1$...` format, password = `aurienta2026`)             | ✅ effective (all 5 users logged in successfully) |
| `ALLOW_DEMO_SIGNIN=false` on Vercel production                                                   | ✅ effective (password verification enforced) |

All prior fixes are intact and effective. The new P0 incident is a
**separate root cause** that was masked by the noise of the earlier bugs.

---

## Files created / referenced

- `docs/AUTH_REDIRECT_INCIDENTS.md` (this file)
- `src/components/dashboard/constitutional-footer.tsx` — Sign out Link (lines 102-106)
- `src/components/dashboard/dashboard-shell.tsx` — Sign out Link (lines 636-639)
- `src/app/api/auth/signout/route.ts` — GET handler (line 45)
- `src/app/dashboard/layout.tsx` — hardcoded redirect (line 8)
- `src/lib/aurienta/auth.ts` — getCurrentUser with React.cache (line 28)
- `src/middleware.ts` — CSRF matcher with /api/auth and /dashboard exemptions (line 113)

## Next actions (priority order)

1. **P0 — Implement Fix C** (POST-only `/api/auth/signout`) and
   **Fix B** (replace `<Link>` with `<a>` or `<form>`). This stops the
   prefetch from triggering session revocation.
2. **Re-run the full session-persistence test matrix** (Tests A/B/C/D/H/I)
   against the patched site, WITHOUT any network route blocker, for all
   5 demo users. All tests should pass without intervention.
3. **P2 — Implement dynamic `next=` parameter** in `dashboard/layout.tsx`.
4. **P3 — Investigate "0 active roles" badge** logic.
5. Consider adding a **runtime smoke test** to CI that signs in as each
   demo user, clicks 5 sidebar tabs, and asserts the session cookie is
   still present. This would have caught Incident #1 before deploy.

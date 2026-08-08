# Task C — Capital & Workforce Features

Agent: Full-stack developer (Capital & Workforce)
Task: Build #7 Syndicates + #8 DRIP + #10 Career Ledger + #11 Mentorship + #12 Skill-to-Equity (2yr + docs) + #31 Diaspora.

## Foundation
- Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite
- Demo user: Layla (`layla@streetbites.eg`) — Capital Partner · Founding Operator, STS 78
- Signed-in users reach `/dashboard/*`
- Foundation libs: `src/lib/aurienta/{auth,ai,cre,constants,format}.ts`
- `getCurrentUser()` returns user with memberships, shareholdings
- `askConstitutionalAI()`, `buildEnterpriseContext()`, `buildUserContext()`, `mockCid()`, `mockHash()`
- `appendLedgerEvent()`, `enforcePriceBand()`
- DB models already exist: Syndicate, SyndicateMember, DripEnrollment, CareerLedgerEntry, Mentorship, SkillEquityClaim, DiasporaProfile, Employee

## File Ownership (CREATE ONLY)
- Pages: src/app/dashboard/{syndicates,career-ledger,mentorship,skill-equity,diaspora}/page.tsx
- APIs: src/app/api/{syndicates,syndicates/[id]/join,drip,mentorship,skill-equity,skill-equity/[id]/review,diaspora}/route.ts
- Components: src/components/dashboard/{capital2,workforce}/*

## Status
- [x] Directories created
- [ ] APIs
- [ ] Pages + components
- [ ] Lint pass

## Notes
- Skill-Equity: must enforce 24-month tenure both client-side (progress bar) and server-side (403 if <24).
- DRIP Card is reusable — props: userId, enterpriseId, shareholding.
- All pages are server components that fetch via Prisma; client components for interactivity.
- Luxury gold-on-near-black, glassmorphism, serif headings. NO blue/indigo.
- Per-page SonnerToaster mount (matching governance page pattern).
- AI calls via askConstitutionalAI in server components; client components call /api/* endpoints.

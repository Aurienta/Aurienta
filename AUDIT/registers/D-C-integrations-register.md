# D-C — Integrations Live Probe Register

**Task ID:** 1-D
**Agent:** `integrations-probe`
**Mandate:** PLATFORM-FULL-AUDIT-AND-REMEDIATION-001
**Probe date:** 2026-10-23
**Environment:** Local sandbox dev server (`next dev --webpack -p 3000`, PID 1115)
**Probe mode:** Safe read-only — no writes, no charges, no irreversible actions.

---

## 0. Executive Summary

**Critical finding: NONE of the 7 external integrations are live in the current sandbox.**
The `.env` file contains a single line — `DATABASE_URL=file:/home/z/my-project/db/custom.db` —
pointing the running app at a **local SQLite file**, not the Turso cloud DB.
**All 12 expected integration env vars are ABSENT** from the process environment
(verified via `printenv` against the running Next.js server, PID 1115).

Despite this, the `/api/health` endpoint returns HTTP 200 (`"status":"ok","db":"connected"`)
because the local SQLite fallback in `src/lib/db.ts` (lines 21–48) silently substitutes a
local file whenever `DATABASE_URL` doesn't start with `libsql://` or `http`.
The `/api/platform-health` route also reports `turso.status:"connected"` — but the URL field
exposes the truth: `file:/home/z/my-project/prisma/.provider-placeholder.db`.

The `/api/ready` readiness probe is the only honest signal: HTTP 503, status `"down"`,
`0/5` AI providers configured, `cre_config: down (FIELD_ENCRYPTION_KEY missing)`.

Worklog claims of "Production: LIVE", "All platforms connected", and "All AI providers
configured" (recently seen in tasks ERP-INTEGRATION-MANAGER, PUSH-HARDEN-BACKUP-FINAL)
are **NOT reproducible in this sandbox** — they almost certainly describe the Vercel
production deployment, which is not the environment under audit here.

| Status classification | Count |
|---|---|
| End-to-end verified | 0 |
| Functionally verified | 0 |
| Contract-validated | 0 |
| Authenticated | 0 |
| Reachable (endpoint up, no creds) | 7 |
| Configured only | 1 (local DB fallback) |
| Failed (probe returned down) | 2 (`/api/ready` readiness, AI router functional) |
| Verified absent (removal confirmed) | 1 (z-ai-web-dev-sdk) |

**Defects found: 6** (P0×1, P1×3, P2×2) — see §4.

---

## 1. Integration Verification Register

| ID | Provider | Purpose | Endpoint (sanitized) | Credentials | Connectivity | Auth | Contract | Functional test | Status | Evidence | Defect / Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-01 | Turso (libSQL) | Primary DB — auth/sessions/ledger/OLTP | `libsql://aurienta-fortleem.aws-us-east-1.turso.io` (DNS→100.25.145.202 AWS ELB) | **Missing** — `TURSO_AUTH_TOKEN` ABSENT; `DATABASE_URL=file:/home/z/my-project/db/custom.db` (local fallback) | Reachable: `curl https://aurienta-fortleem.aws-us-east-1.turso.io/` → HTTP 401 "empty JWT token" in 0.85 s. DNS resolves correctly. | NOT Authenticated — no JWT available | N/A (no auth) | `/api/health` 200 `db:connected` is misleading (uses local SQLite, not Turso cloud). `/api/platform-health` reports `turso.status:"connected"` but `url` field = `file:/home/z/my-project/prisma/.provider-placeholder.db` — **local file, not cloud**. | **Failed (sandbox)** — Configured only / running on local fallback. Cloud endpoint is Reachable but Unauthenticated. | §2.1 + §3.1 | **P0** D-001: Production env vars missing in sandbox. Provision `.env` with `DATABASE_URL=libsql://...` + `TURSO_AUTH_TOKEN`. |
| INT-02 | Groq | AI provider — fast reasoning (llama-3.1-8b-instant) | `https://api.groq.com/openai/v1/models` | **Missing** — `GROQ_API_KEY` ABSENT (process env check confirms) | Reachable: `curl -H "Authorization: Bearer MISSING"` → HTTP 403 `{"error":{"message":"Forbidden"}}` in 0.04 s | NOT Authenticated | N/A | `/api/ready` reports `groq:off` (configured:false, lastError:"API key not configured") | **Reachable, Unauthenticated** | §2.2 + §3.2 | **P1** D-002: Provision `GROQ_API_KEY`. Prior audit (INT-004b, 2026-10-16) showed key was present but model name `llama-3.3-70b-versatile` returned 404 — verify model id once key restored. |
| INT-03 | OpenRouter | AI gateway (free models) | `https://openrouter.ai/api/v1/models` | **Missing** — `OPENROUTER_API_KEY` ABSENT | Reachable: `curl -H "Authorization: Bearer MISSING"` → HTTP 200 in 0.08 s, returns 1000+ models list (note: `/v1/models` is anonymously listable; chat endpoints require valid key) | NOT Authenticated (anonymous listing succeeds but chat will 402) | N/A (model-list contract reachable; chat contract unverified) | `/api/ready` reports `openrouter:off` | **Reachable, Unauthenticated** | §2.3 + §3.3 | **P1** D-003: Provision `OPENROUTER_API_KEY`. Prior audit showed 402 Payment Required — credits must be replenished. |
| INT-04 | NVIDIA NIM | AI provider — enterprise Llama Nemotron | `https://integrate.api.nvidia.com/v1/models` | **Missing** — `NVIDIA_API_KEY` ABSENT | Reachable: `curl -H "Authorization: Bearer MISSING"` → HTTP 200 in 0.17 s, returns model list (anonymous listing like OpenRouter) | NOT Authenticated | N/A | `/api/ready` reports `nvidia:off` | **Reachable, Unauthenticated** | §2.4 + §3.4 | **P1** D-004: Provision `NVIDIA_API_KEY`. Prior audit (INT-004d) reported 404 model_not_found — model id `nvidia/llama-3.1-nemotron-70b-instruct` may be invalid; verify against current NIM catalog. |
| INT-05 | Google Gemini | AI provider — consensus/fast (gemini-2.0-flash) | `https://generativelanguage.googleapis.com/v1/models?key=KEY` | **Missing** — `GEMINI_API_KEY` ABSENT (task spec says starts with `AQ.`) | Reachable: `curl "?key=MISSING"` → HTTP 400 `{"error":{"code":400,"message":"API key not valid. Please pass a valid API key."}}` in 0.07 s | NOT Authenticated | N/A | `/api/ready` reports `gemini:off` | **Reachable, Unauthenticated** | §2.5 + §3.5 | **P1** D-005: Provision `GEMINI_API_KEY`. Prior audit (INT-004a) showed key was present but failed with `ACCESS_TOKEN_TYPE_UNSUPPORTED` — verify key type is API key, not OAuth token. |
| INT-06 | HuggingFace | AI provider — open-source Llama/Mistral | `https://huggingface.co/api/whoami-v2` | **Missing** — `HUGGINGFACE_API_KEY` ABSENT | Reachable: `curl -H "Authorization: Bearer MISSING"` → HTTP 401 `{"error":"Invalid username or password."}` in 0.26 s | NOT Authenticated | N/A | `/api/ready` reports `huggingface:off` | **Reachable, Unauthenticated** | §2.6 + §3.6 | **P1** D-006: Provision `HUGGINGFACE_API_KEY`. Prior audit (INT-004e) reported network fetch failure — likely cold-start; verify with `hf inference warmup` after key restored. |
| INT-07 | GitHub | Source-of-truth repo (`Aurienta/Aurienta`) | `https://api.github.com/repos/Aurienta/Aurienta` | **Missing** — `GITHUB_TOKEN` ABSENT | Reachable but rate-limited: anonymous `curl` returns HTTP 403 "rate limit exceeded for 47.57.232.232" (IP-blocked). With `Authorization: token MISSING` → HTTP 401 `Bad credentials`. Repo existence not verifiable without auth. | NOT Authenticated | N/A | `/api/platform-health` hardcodes `github.status:"connected"` (no live probe) | **Reachable, Unauthenticated, Repo unverified** | §2.7 + §3.7 | **P2** D-007: Provision `GITHUB_TOKEN`. Code at `src/app/api/platform-health/route.ts:15-20` returns hardcoded "connected" — should actually ping `/repos/Aurienta/Aurienta`. |
| INT-08 | Vercel | Hosting + cron scheduler | `https://api.vercel.com/v9/projects/prj_zEATZmp64oA7lfDTt8wya1OjOPYg` | **Missing** — `VERCEL_TOKEN` ABSENT; `NEXT_PUBLIC_VERCEL_URL` also ABSENT (app reports `"vercel":"local-dev"`) | Reachable: `curl -H "Authorization: Bearer MISSING"` → HTTP 403 `{"error":{"code":"forbidden","message":"Not authorized","invalidToken":true}}` in 0.49 s. Project ID format valid. | NOT Authenticated | N/A | `/api/platform-health` returns `vercel.status:"local-dev"` — accurate | **Reachable, Unauthenticated** | §2.8 + §3.8 | **P2** D-008: Provision `VERCEL_TOKEN` + `NEXT_PUBLIC_VERCEL_URL` if production-monitoring required. |
| INT-09 | AI Router (functional, through app) | Multi-model consensus — 5 providers (Groq/NVIDIA/Gemini/HuggingFace/OpenRouter) | `GET http://localhost:3000/api/ready` (no auth required) | N/A — proxies to all 5 AI providers | N/A (aggregates INT-02..06) | N/A | N/A | **HTTP 503** `{"status":"down", "ai_providers":{"connected":0,"total":5,"detail":"0/5 connected, 0/5 configured (openrouter:off,groq:off,nvidia:off,gemini:off,huggingface:off)"}}` | **Failed** — readiness probe correctly reports down | §3.9 | (covered by D-002..D-006 above). |
| INT-10 | z-ai-web-dev-sdk removal | Verify SDK excised from app code | `rg "z-ai-web-dev-sdk" src/` → 0 matches | N/A | N/A | N/A | N/A | `rg -c "z-ai-web-dev-sdk" src/` → 0 matches. `package.json` no longer lists dependency. Matches still present only in `./skills/*` (separate tooling area, not part of shipped app). | **Verified — removed** | §3.10 | None. Confirms worklog task "z-ai-web-dev-sdk removed" is honest. |

**Totals: 10 integrations probed.**

---

## 2. Direct curl probes (raw evidence)

### 2.1 Turso (libSQL) — endpoint reachability
```
$ getent hosts aurienta-fortleem.aws-us-east-1.turso.io
100.25.145.202  us-east-1b.plt-pub-nlb-us-east-1-88b4e1eabbf8c91c.elb.us-east-1.amazonaws.com aurienta-fortleem.aws-us-east-1.turso.io

$ curl -s -o - -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    "https://aurienta-fortleem.aws-us-east-1.turso.io/"
HTTP 401 time=0.847023s
{"error":"Unauthorized: `unauthorized access attempt on database: empty JWT token`"}
```
→ DNS resolves; endpoint reachable; requires valid JWT.

### 2.2 Groq
```
$ curl -s -o /tmp/groq.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    https://api.groq.com/openai/v1/models -H "Authorization: Bearer MISSING"
HTTP 403 time=0.039893s
{"error":{"message":"Forbidden"}}
```

### 2.3 OpenRouter
```
$ curl -s -o /tmp/or.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    https://openrouter.ai/api/v1/models -H "Authorization: Bearer MISSING"
HTTP 200 time=0.076436s
{"data":[{"id":"moonshotai/kimi-k3.1-pro", ... }]}
```
Note: `/v1/models` is anonymously listable on OpenRouter — 200 here does NOT imply chat auth works.

### 2.4 NVIDIA NIM
```
$ curl -s -o /tmp/nv.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    https://integrate.api.nvidia.com/v1/models -H "Authorization: Bearer MISSING"
HTTP 200 time=0.171152s
{"object":"list","data":[{"id":"01-ai/yi-large", ... }]}
```
Same anonymous-listing quirk as OpenRouter.

### 2.5 Google Gemini
```
$ curl -s -o /tmp/gem.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    "https://generativelanguage.googleapis.com/v1/models?key=MISSING"
HTTP 400 time=0.065677s
{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT", ...}}
```

### 2.6 HuggingFace
```
$ curl -s -o /tmp/hf.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    https://huggingface.co/api/whoami-v2 -H "Authorization: Bearer MISSING"
HTTP 401 time=0.257406s
{"error":"Invalid username or password."}
```

### 2.7 GitHub
```
$ curl -s -o /tmp/gh.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    https://api.github.com/repos/Aurienta/Aurienta -H "Authorization: token MISSING"
HTTP 401 time=0.327404s
{"message":"Bad credentials","documentation_url":"https://docs.github.com/rest","status":"401"}

# Anonymous (no token at all) — IP rate-limited:
$ curl -s -A "Mozilla/5.0 aurienta-audit" https://api.github.com/repos/Aurienta/Aurienta
HTTP 403  {"message":"API rate limit exceeded for 47.57.232.232 ..."}
```
→ Repo `Aurienta/Aurienta` existence not verifiable from this IP without auth.

### 2.8 Vercel
```
$ curl -s -o /tmp/vc.txt -w "HTTP %{http_code} time=%{time_total}s\n" --max-time 8 \
    "https://api.vercel.com/v9/projects/prj_zEATZmp64oA7lfDTt8wya1OjOPYg" \
    -H "Authorization: Bearer MISSING"
HTTP 403 time=0.488250s
{"error":{"code":"forbidden","message":"Not authorized","invalidToken":true}}
```

---

## 3. App-level probes (through the running Next.js dev server)

### 3.1 Turso via `/api/health` + `/api/platform-health`
```
$ curl -s http://localhost:3000/api/health
{"status":"ok","uptime":12140,"uptime_human":"12s","db":"connected","service":"aurienta","version":"0.2.0","timestamp":"2026-10-23T20:19:28.419Z"}

$ curl -s http://localhost:3000/api/platform-health | jq '.platforms.turso'
{
  "status": "connected",
  "latencyMs": 1,
  "url": "file:/home/z/my-project/prisma/.provider-placeholder.db",   ← LOCAL FILE, NOT TURSO CLOUD
  "models": 56,
  "note": "Primary database (libSQL). 56 models, 109+ indexes."
}
```
**MISLEADING**: route label says "turso: connected" but `url` field exposes the local SQLite path. `src/lib/db.ts:21-48` falls back to local file whenever `DATABASE_URL` doesn't start with `libsql://` or `http`.

### 3.2–3.6 AI providers via `/api/ready` (the only honest signal)
```
$ curl -s http://localhost:3000/api/ready
HTTP 503  time=2.538412s
{
  "status": "down",
  "uptimeMs": 20,
  "checks": [
    {"name":"database","status":"ok","latencyMs":13},
    {"name":"cre_config","status":"down","detail":"FIELD_ENCRYPTION_KEY missing"},
    {"name":"ai_providers","status":"down","latencyMs":1,
     "detail":"0/5 connected, 0/5 configured (openrouter:off,groq:off,nvidia:off,gemini:off,huggingface:off)",
     "connected":0,"total":5,
     "providers":[
       {"provider":"openrouter","configured":false,"connected":false,"model":"xingchen-agi/xing4.0-29b-a4b:free","latencyMs":0,"lastError":"API key not configured"},
       {"provider":"groq","configured":false,"connected":false,"model":"llama-3.1-8b-instant","latencyMs":0,"lastError":"API key not configured"},
       {"provider":"nvidia","configured":false,"connected":false,"model":"google/gemma-3-12b-it","latencyMs":0,"lastError":"API key not configured"},
       {"provider":"gemini","configured":false,"connected":false,"model":"gemini-2.0-flash","latencyMs":0,"lastError":"API key not configured"},
       {"provider":"huggingface","configured":false,"connected":false,"model":"mistralai/Mistral-7B-Instruct-v0.3","latencyMs":0,"lastError":"API key not configured"}
     ]},
    {"name":"ledger","status":"ok","latencyMs":2,"detail":"0 events"}
  ]
}
```
**This is the authoritative finding.** The readiness probe (unlike `platform-health`) actually invokes `getAiProviderStatus()` which performs live pings via the smallest available model. All 5 providers report `configured:false` because their env vars are not set.

### 3.7 GitHub via `/api/platform-health`
```
"github":{"status":"connected","repo":"Aurienta/Aurienta","branch":"main","note":"Source of truth. Push triggers CI/CD."}
```
**Hardcoded value** at `src/app/api/platform-health/route.ts:15-20` — no actual HTTP probe is performed.

### 3.8 Vercel via `/api/platform-health`
```
"vercel":{"status":"local-dev","url":"localhost:3000","note":"Next.js host. Auto-deploys from GitHub main."}
```
Accurate — `NEXT_PUBLIC_VERCEL_URL` env var is genuinely absent in this sandbox.

### 3.9 AI Router functional test — direct
Authenticated routes (`/api/ai/brain-status`, `/api/copilot`, `/api/ai/explain`) require both session + CSRF — all return HTTP 401/403 to anonymous probes. The unauthenticated `/api/ready` (§3.2 above) is the canonical functional probe and returns **HTTP 503 down**.

### 3.10 z-ai-web-dev-sdk removal
```
$ rg -c "z-ai-web-dev-sdk" src/
(no matches in src/ — confirmed removed)
$ grep "z-ai-web-dev-sdk" package.json
(no match — not in dependencies)
$ rg "z-ai-web-dev-sdk" . --include='*.ts' --include='*.tsx' --include='*.json'
./skills/video-understand/scripts/video-understand.ts
./skills/TTS/tts.ts
./skills/image-understand/scripts/image-understand.ts
./skills/image-edit/scripts/image-edit.ts
./skills/LLM/scripts/chat.ts
./skills/video-generation/scripts/video.ts
./skills/stock-analysis-skill/src/*.ts   (4 files)
```
→ SDK removed from app code (`src/`); residual matches only in `./skills/*` (separate tooling area, not part of the Next.js build).

---

## 4. Findings (P0–P3)

| ID | Severity | Integration | Finding |
|---|---|---|---|
| **D-001** | **P0** | Turso + all AI | **No integration env vars present in sandbox `.env`.** `.env` contains only `DATABASE_URL=file:/home/z/my-project/db/custom.db`. App silently falls back to local SQLite via `src/lib/db.ts:21-48`. `/api/health` reports `db:connected` and `/api/platform-health` reports `turso:connected` — both **misleading**. Worklog claims of "Production: LIVE / all platforms connected" cannot be reproduced here. Either (a) provision a `.env.local` with all 12 expected vars (`TURSO_AUTH_TOKEN`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, `GITHUB_TOKEN`, `VERCEL_TOKEN`, `NEXT_PUBLIC_VERCEL_URL`, `NEON_DATABASE_URL`, `FIELD_ENCRYPTION_KEY`, `SESSION_SECRET`), or (b) explicitly document that the production env lives on Vercel and is out-of-scope for sandbox audit. |
| D-002 | P1 | Groq | `GROQ_API_KEY` ABSENT. Prior audit (2026-10-16 INT-004b) noted model name `llama-3.3-70b-versatile` returns 404 — reverify model id once key is restored. |
| D-003 | P1 | OpenRouter | `OPENROUTER_API_KEY` ABSENT. Prior audit showed 402 Payment Required — credits must be replenished before re-test. |
| D-004 | P1 | NVIDIA NIM | `NVIDIA_API_KEY` ABSENT. Prior audit reported 404 model_not_found — model id `nvidia/llama-3.1-nemotron-70b-instruct` may be invalid; verify against current NIM catalog. |
| D-005 | P1 | Gemini | `GEMINI_API_KEY` ABSENT (task spec says starts with `AQ.`). Prior audit reported `ACCESS_TOKEN_TYPE_UNSUPPORTED` — verify key type is REST API key (not OAuth token). |
| D-006 | P1 | HuggingFace | `HUGGINGFACE_API_KEY` ABSENT. Prior audit reported network fetch failure — likely cold-start on HF Inference API; warm up after key restored. |
| D-007 | P2 | GitHub | `GITHUB_TOKEN` ABSENT. `src/app/api/platform-health/route.ts:15-20` hardcodes `github.status:"connected"` — should actually probe `/repos/Aurienta/Aurienta` and surface real status. Repo existence unverified due to anonymous-IP rate-limit. |
| D-008 | P2 | Vercel | `VERCEL_TOKEN` + `NEXT_PUBLIC_VERCEL_URL` ABSENT. `platform-health` correctly reports `vercel:local-dev` — accurate. Optional: provision token if production-monitoring is required from sandbox. |
| D-009 | P3 | (informational) | `/api/platform-health` route mixes real probes (Turso DB count, Inngest, Neon) with hardcoded values (GitHub "connected", Vercel var-presence only) — inconsistent. Recommend refactoring so all entries follow the same probe-or-report pattern, and label clearly when value is asserted-not-verified. |
| D-010 | (none) | z-ai-web-dev-sdk | **Confirmed removed** from `src/` and `package.json`. Residual matches only in `./skills/*` tooling (not part of Next.js build). No action needed. |

---

## 5. Status breakdown

| Bucket | Count | Integrations |
|---|---|---|
| End-to-end verified | 0 | — |
| Functionally verified | 0 | — |
| Contract-validated | 0 | — |
| Authenticated | 0 | — |
| Reachable (endpoint up, no creds) | 7 | Turso, Groq, OpenRouter, NVIDIA, Gemini, HuggingFace, GitHub, Vercel (8 if counting Turso-cloud separately) |
| Configured only | 1 | Turso (via local SQLite fallback — misleading "connected" status) |
| Failed (probe returned down) | 2 | AI Router functional (`/api/ready` HTTP 503), CRE config (`FIELD_ENCRYPTION_KEY missing`) |
| Verified absent (removal confirmed) | 1 | z-ai-web-dev-sdk |

---

## 6. Notes on prior audit drift

The existing `INTEGRATION_REGISTER.csv` (2026-10-16) classified 4 of the 5 AI providers
as "Configured (not working)" with specific failure codes (401/402/404/network). Those
findings cannot be reproduced in the current sandbox because the credentials themselves
are now missing entirely. Two scenarios:

1. The sandbox has been intentionally reset to a credentials-stripped state for safety
   (in which case the prior "configured" findings refer to the production Vercel env).
2. The credentials have been removed and not yet restored — a regression.

Either way, the action is the same: provision the 12 expected env vars and re-run Phase 1-D
to convert each row from **Reachable+Unauthenticated** to **Authenticated** (and ideally
**Contract-validated** via a real `chat.completions` 1-token roundtrip).

---

## 7. Files touched

- **Created:** `/home/z/my-project/AUDIT/registers/D-C-integrations-register.md` (this file)
- **Appended to:** `/home/z/my-project/AUDIT/MASTER_LOG.md` (Task 1-D summary, see below)

No source code or configuration files were modified. All probes were read-only.

— end —

#!/usr/bin/env python3
"""B-API-STRESS: re-scan all 215 API routes and classify.

Adds fields needed for stress testing:
- methods_supported (GET/POST/PUT/PATCH/DELETE)
- auth_required (getCurrentUser / getServerSession / requireUser / header-token / signature)
- validation_kind (zod / parseBody / manual / none)
- body_shape_hint (short text describing expected body shape from code reading)
- has_path_param
- public_by_design (best guess)
- domain
"""
import json, re, os, sys
from pathlib import Path

API_ROOT = Path("/home/z/my-project/src/app/api")
OUT = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json")

METHOD_RE = re.compile(r"export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b")
ZOD_RE = re.compile(r"\bz\.(object|string|number|boolean|array|enum|nativeEnum|union|optional|literal)\b")
PARSE_BODY_RE = re.compile(r"\bparseBody\b")
SAFE_PARSE_RE = re.compile(r"\.safeParse\(")
AUTH_CALL_RE = re.compile(r"\b(getCurrentUser|requireUser|requireRole|getServerSession|getSession|requireAuth)\b\(")
AUTH_HEADER_RE = re.compile(r"headers\.get\(\s*['\"]authorization['\"]")
AUTH_APIKEY_RE = re.compile(r"headers\.get\(\s*['\"]x-api-key['\"]")
SIGNATURE_RE = re.compile(r"(verifyWebhookSignature|verifySignature|crypto\.verify|nacl\.sign|tweetnacl)")
TOKEN_SECRET_RE = re.compile(r"process\.env\.(CRON_SECRET|FRA_ACCESS_TOKEN|WEBHOOK_SECRET|API_KEY)")
QUERY_TOKEN_RE = re.compile(r"(searchParams\.get\(\s*['\"]token['\"]|\.token\b)")
DEV_FALLBACK_RE = re.compile(r"(DEV_FALLBACK_SECRET|dev-cron-secret)")
PATH_PARAM_RE = re.compile(r"\[\s*([a-zA-Z0-9_]+)\s*\]")
CATCH_ALL_RE = re.compile(r"\[\[\s*\.\.\.([a-zA-Z0-9_]+)\s*\]\]")

# Public-by-design candidates
PUBLIC_DESIGN_PATHS = {
    "/api/health", "/api/auth", "/api/auth/register", "/api/auth/signout",
    "/api/auth/passkey/authenticate/start", "/api/auth/passkey/authenticate/finish",
    "/api/auth/passkey/register/start", "/api/auth/passkey/register/finish",
    "/api/oracle/consensus", "/api/soulbound/verify", "/api/v1/cre/validate",
    "/api/v1/ipfs/pin", "/api/v1/webhook/payment", "/api/public/stats",
    "/api/public/registry", "/api/legal-templates", "/api/v1/cre/policies",
    "/api/fx/consensus", "/api/v1/gov/gafi", "/api/v1/gov/nosi", "/api/v1/gov/eta",
    "/api/v1/intelligence/conflicts", "/api/ready", "/api/metrics",
}

def path_to_route(p: Path) -> str:
    rel = p.relative_to(API_ROOT).as_posix()
    # strip /route.ts
    rel = rel[:-len("/route.ts")]
    if rel == "":
        return "/api"
    return "/api/" + rel

def domain_of(p: Path) -> str:
    parts = p.relative_to(API_ROOT).parts
    if not parts: return "root"
    first = parts[0]
    if first == "v1" and len(parts) > 1:
        return f"v1/{parts[1]}"
    return first

def classify(text: str, route: str) -> dict:
    methods = METHOD_RE.findall(text)
    has_zod = bool(ZOD_RE.search(text))
    has_parsebody = bool(PARSE_BODY_RE.search(text))
    has_safeparse = bool(SAFE_PARSE_RE.search(text))
    has_manual = bool(re.search(r"(typeof\s+\w+|Number\.isFinite|\.trim\(\)\.length|Array\.isArray|!\w+\s*[\?\|\|\|]|require.*\?\?\s*throw)", text))
    has_auth_call = bool(AUTH_CALL_RE.search(text))
    has_auth_header = bool(AUTH_HEADER_RE.search(text))
    has_apikey_header = bool(AUTH_APIKEY_RE.search(text))
    has_signature = bool(SIGNATURE_RE.search(text))
    has_token_secret = bool(TOKEN_SECRET_RE.search(text))
    has_query_token = bool(QUERY_TOKEN_RE.search(text))
    has_dev_fallback = bool(DEV_FALLBACK_RE.search(text))

    # Determine auth kind
    auth_kind = "none"
    if has_auth_call:
        auth_kind = "session"
    elif has_auth_header or has_token_secret:
        auth_kind = "bearer-token"
    elif has_apikey_header:
        auth_kind = "api-key"
    elif has_signature:
        auth_kind = "signature"
    elif has_query_token:
        auth_kind = "query-token"

    # Validation kind
    if has_zod or has_parsebody or has_safeparse:
        val_kind = "zod"
    elif has_manual:
        val_kind = "manual"
    else:
        val_kind = "none"

    is_public_by_design = route in PUBLIC_DESIGN_PATHS

    return {
        "methods": methods,
        "auth_kind": auth_kind,
        "validation": val_kind,
        "has_dev_fallback_secret": has_dev_fallback,
        "has_signature": has_signature,
        "public_by_design": is_public_by_design,
    }

def body_hint(text: str) -> str:
    # First JSON.parse / await req.json()
    m = re.search(r"await\s+req\.json\(\)", text)
    if not m:
        return "(no body parsing — likely no body)"
    # Find variable assignment near
    idx = m.start()
    # Look back 60 chars for assignment
    pre = text[max(0, idx-80):idx]
    mvar = re.search(r"(?:const|let|var)\s+(\w+)\s*=\s*$", pre)
    var_name = mvar.group(1) if mvar else "body"
    # Look at zod schema name nearby
    mschema = re.search(r"(\w+Schema)\s*=\s*z\.object", text)
    schema_name = mschema.group(1) if mschema else None
    if schema_name:
        # find the schema definition
        sm = re.search(re.escape(schema_name) + r"\s*=\s*z\.object\(\{([^}]+)\}", text, re.S)
        if sm:
            fields = re.findall(r"(\w+)\s*:", sm.group(1))
            return f"JSON body -> {schema_name} fields: {fields[:8]}"
        return f"JSON body validated by {schema_name}"
    # otherwise just list keys seen in next 200 chars
    post = text[idx:idx+400]
    keys = re.findall(r"\bbody\.(\w+)", post)
    if keys:
        return f"JSON body fields used: {list(set(keys))[:8]}"
    return f"JSON body parsed (var: {var_name}) — fields unclear"

def main():
    files = sorted(API_ROOT.rglob("route.ts"))
    inventory = []
    for f in files:
        route = path_to_route(f)
        text = f.read_text(errors="ignore")
        cls = classify(text, route)
        path_params = PATH_PARAM_RE.findall(route)
        catchall = CATCH_ALL_RE.findall(route)
        item = {
            "path": route,
            "file": str(f.relative_to(API_ROOT)),
            "domain": domain_of(f),
            "path_params": path_params + catchall,
            **cls,
            "body_hint": body_hint(text),
            "lines": text.count("\n")+1,
        }
        inventory.append(item)
    OUT.write_text(json.dumps(inventory, indent=2))
    print(f"Inventory written: {OUT}")
    print(f"Total routes: {len(inventory)}")
    # Domain counts
    from collections import Counter
    by_domain = Counter(x["domain"] for x in inventory)
    print(f"Domains: {len(by_domain)}")
    for d, c in sorted(by_domain.items(), key=lambda x: -x[1]):
        print(f"  {d:30s} {c}")
    # Method counts
    methods = Counter()
    for x in inventory:
        for m in x["methods"]:
            methods[m] += 1
    print("Methods:", dict(methods))
    # Auth kinds
    authkinds = Counter(x["auth_kind"] for x in inventory)
    print("Auth kinds:", dict(authkinds))
    # Validation kinds
    valkinds = Counter(x["validation"] for x in inventory)
    print("Validation kinds:", dict(valkinds))
    # Public vs protected
    public = [x for x in inventory if x["auth_kind"] == "none"]
    print(f"Endpoints with NO auth: {len(public)}")
    print(f"  public-by-design: {sum(1 for x in public if x['public_by_design'])}")
    print(f"  likely defect:    {sum(1 for x in public if not x['public_by_design'])}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Inspect-only API route scanner for Aurienta Phase 1-B audit (v2)."""
import os, re, json

API_ROOT = "/home/z/my-project/src/app/api"

AUTH_CALL_PATTERNS = [
    r"\bgetCurrentUser\b",
    r"\brequireUser\b",
    r"\brequireRole\b",
    r"\bgetServerSession\b",
    r"\brequireAuth\b",
]
AUTH_HEADER_PATTERNS = [
    r"headers\(\)\.get\s*\(\s*['\"]authorization['\"]",
    r"x-api-key['\"]",
    r"x-aurienta-api-key['\"]",
    r"\bapiKey\b.*\b(req|request)\b",
]
AUTH_DECORATOR = "withErrorHandler"

VALIDATION_PATTERNS = [
    (r"\bparseBody\s*\(", "parseBody"),
    (r"\bsafeParse\s*\(", "safeParse"),
    (r"\bfrom\s+['\"]zod['\"]", "zod"),
    (r"\bSchema\s*=\s*z\.object", "zod-schema"),
    (r"typeof\s+\w+\s*===?\s*['\"]string['\"]", "manual-typeof"),
    (r"Number\.isFinite\s*\(", "manual-number"),
    (r"\.trim\(\)\.length\s*[<>]", "manual-length"),
    (r"req\.json\(\)\.catch", "manual-parse"),
]

PRISMA_PATTERN = re.compile(r"\bdb\.\w+\.\w+\s*\(|\bprisma\.\w+\.\w+\s*\(|\btx\.\w+\.\w+\s*\(")

METHOD_PATTERN = re.compile(
    r"export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b"
)
METHOD_CONST_PATTERN = re.compile(
    r"export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*withErrorHandler"
)

def domain_of(rel_path):
    parts = rel_path.split(os.sep)
    if parts[0] == "v1":
        if parts[1] == "gov": return "gov"
        if parts[1] == "cre": return "cre"
        if parts[1] == "webhook": return "webhook"
        if parts[1] == "intelligence": return "intelligence"
        if parts[1] == "ipfs": return "ipfs"
        if parts[1] == "regulatory": return "regulatory"
        if parts[1] == "enterprise": return "enterprise"
        return parts[1]
    if parts[0] == "public": return "public"
    if parts[0] == "cron": return "cron"
    if parts[0] == "admin": return "admin"
    if parts[0] == "erp": return "erp"
    if parts[0] == "ai": return "ai"
    if parts[0] == "auth": return "auth"
    return parts[0]

def first_purpose(src):
    # try first JSDoc /** */ block
    m = re.search(r"/\*\*([\s\S]*?)\*/", src[:1800])
    if m:
        lines = [l.strip().lstrip("*").strip() for l in m.group(1).splitlines()]
        lines = [l for l in lines if l]
        if lines:
            return lines[0][:140]
    # try line comments at top of file (consecutive //)
    m = re.match(r"((?:\s*//[^\n]*\n)+)", src[:1500])
    if m:
        lines = [l.strip().lstrip("/").strip() for l in m.group(1).splitlines()]
        lines = [l for l in lines if l]
        if lines:
            return lines[0][:140]
    # try first `// METHOD /path` in src
    m = re.search(r"//\s*(GET|POST|PUT|PATCH|DELETE)\s+(/\S*)", src[:2500])
    if m:
        return f"{m.group(1)} {m.group(2)}"
    return "(no comment)"

def extract_catch_blocks(src):
    """Return list of catch block contents."""
    blocks = []
    for m in re.finditer(r"\bcatch\s*\([^)]*\)\s*\{", src):
        start = m.end()
        depth = 1
        i = start
        while i < len(src) and depth > 0:
            c = src[i]
            if c == "{": depth += 1
            elif c == "}": depth -= 1
            i += 1
        blocks.append(src[start:i-1])
    return blocks

def has_false_success(src):
    """A catch block returns NextResponse.json(...) with status 200 OR no status arg."""
    for block in extract_catch_blocks(src):
        # Find all NextResponse.json returns in the catch
        for jm in re.finditer(r"NextResponse\.json\s*\(([\s\S]{0,800}?)\)\s*;", block):
            payload = jm.group(1)
            # Has a second arg with status:?
            status_match = re.search(r"status\s*:\s*(\d+)", payload)
            if status_match:
                if int(status_match.group(1)) == 200:
                    return True
            else:
                # No status arg => defaults to 200
                return True
    return False

def is_stub_endpoint(src, has_prisma):
    """Endpoint that only returns ok:true / mock data and doesn't write to DB."""
    if has_prisma: return False
    if "audit(" in src: return False
    # If returns only ok:true without db writes
    if re.search(r"return\s+NextResponse\.json\s*\(\s*\{\s*(?:ok|success):\s*true\s*,?\s*\}?\s*(?:,\s*\{\s*\}\s*)?\s*\)", src, re.IGNORECASE):
        return True
    # If returns mock data without touching DB: comments mention 'mock' or 'placeholder' and no prisma
    if (re.search(r"\b(mock|placeholder|stub|TODO|FIXME)\b", src[:1500], re.IGNORECASE)
        and not has_prisma):
        return True
    return False

def scan_file(path):
    rel = os.path.relpath(path, API_ROOT)
    rel_route = "/api/" + rel.replace(os.sep, "/").replace("/route.ts", "")
    try:
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
    except Exception as e:
        return {"path": rel_route, "error": str(e)}

    methods = METHOD_PATTERN.findall(src)
    methods += METHOD_CONST_PATTERN.findall(src)
    methods = sorted(set(methods))

    auth_call = any(re.search(p, src) for p in AUTH_CALL_PATTERNS)
    auth_header = any(re.search(p, src, re.IGNORECASE) for p in AUTH_HEADER_PATTERNS)
    with_error_handler = AUTH_DECORATOR in src
    # Treat withErrorHandler as auth-protected ONLY if getCurrentUser appears inside the handler
    # Cheap proxy: withErrorHandler AND getCurrentUser both present
    auth_via_handler = with_error_handler and bool(re.search(r"\bgetCurrentUser\b", src))
    has_auth = auth_call or auth_header or auth_via_handler

    val_matches = []
    for pat, label in VALIDATION_PATTERNS:
        if re.search(pat, src):
            val_matches.append(label)
    has_validation = bool(val_matches)

    prisma_hits = len(PRISMA_PATTERN.findall(src))
    has_prisma = prisma_hits > 0

    false_success = has_false_success(src)
    stub = is_stub_endpoint(src, has_prisma)

    return {
        "path": rel_route,
        "file": rel,
        "domain": domain_of(rel),
        "methods": methods,
        "has_auth": has_auth,
        "auth_call": auth_call,
        "auth_header": auth_header,
        "with_error_handler": with_error_handler,
        "validation": has_validation,
        "validation_kinds": sorted(set(val_matches)),
        "prisma": has_prisma,
        "prisma_hits": prisma_hits,
        "false_success": false_success,
        "stub": stub,
        "purpose": first_purpose(src),
        "lines": src.count("\n") + 1,
    }

def main():
    files = []
    for root, _, fnames in os.walk(API_ROOT):
        for f in fnames:
            if f == "route.ts":
                files.append(os.path.join(root, f))
    files.sort()
    records = [scan_file(p) for p in files]
    out_path = "/home/z/my-project/AUDIT/registers/_api_scan.json"
    with open(out_path, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Scanned {len(records)} routes -> {out_path}")

    by_domain = {}
    for r in records:
        by_domain.setdefault(r["domain"], 0)
        by_domain[r["domain"]] += 1
    print("\n== Endpoints per domain ==")
    for d, c in sorted(by_domain.items(), key=lambda x: -x[1]):
        print(f"  {d:18s} {c}")

    mutators = {"POST", "PUT", "PATCH", "DELETE"}
    no_auth_mut = [r for r in records if (set(r["methods"]) & mutators) and not r["has_auth"]]
    print(f"\n== Mutating endpoints WITHOUT auth (P0/P1) — {len(no_auth_mut)} ==")
    for r in no_auth_mut:
        print(f"  {','.join(r['methods']):12s} {r['path']}")

    no_val_mut = [r for r in records if (set(r["methods"]) & mutators) and not r["validation"]]
    print(f"\n== Mutating endpoints WITHOUT validation (P2) — {len(no_val_mut)} ==")
    for r in no_val_mut:
        print(f"  {','.join(r['methods']):12s} {r['path']}")

    fs = [r for r in records if r["false_success"]]
    print(f"\n== False-success candidates (P1) — {len(fs)} ==")
    for r in fs:
        print(f"  {r['path']}")

    stubs = [r for r in records if r["stub"]]
    print(f"\n== Stub endpoints (P2/P3) — {len(stubs)} ==")
    for r in stubs:
        print(f"  {r['path']}  [{','.join(r['methods'])}]")

    # GET endpoints with no auth and no Prisma reads — possible leak
    gets = [r for r in records if "GET" in r["methods"] and not r["has_auth"]]
    print(f"\n== GET endpoints without auth — {len(gets)} (public or leak?) ==")
    for r in gets:
        print(f"  {r['path']}  [prisma={r['prisma']}]")

if __name__ == "__main__":
    main()

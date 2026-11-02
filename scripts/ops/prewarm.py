#!/usr/bin/env python3
"""Pre-warm the Next.js dev server's webpack compilation cache.

In Next.js dev mode, routes are compiled on-demand on first access. This
means the first user to hit a route waits 1-10s for webpack to compile it.

This script triggers compilation of EVERY API route + every page by
sending a GET request to each. The dev server compiles the route, caches
the result in .next/, and subsequent requests are <100ms.

Run AFTER `bun run dev` is ready:
    python3 scripts/ops/prewarm.py
"""
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

API_DIR = Path("/home/z/my-project/src/app/api")
DASHBOARD_DIR = Path("/home/z/my-project/src/app/dashboard")

BASE = "http://localhost:3000"
TIMEOUT_S = 90
MAX_WORKERS = 2  # Low to avoid OOM-killing the dev server

def collect_api_routes():
    """Collect all API routes that respond to GET (with no auth → 200/401/405)."""
    routes = []
    for route_file in sorted(API_DIR.rglob("route.ts")):
        rel = str(route_file.relative_to(API_DIR)).replace("/route.ts", "")
        text = route_file.read_text(errors="ignore")
        methods = set(re.findall(r"export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|DELETE|PATCH)", text))
        if not methods:
            continue
        # Replace [id], [slug], etc. with a valid placeholder for the probe
        path = re.sub(r"\[[^\]]+\]", "prewarm", f"/api/{rel}")
        routes.append({"path": path, "methods": sorted(methods)})
    return routes

def collect_dashboard_pages():
    """Collect all dashboard pages (server components) for compilation."""
    pages = []
    for page_file in sorted(DASHBOARD_DIR.rglob("page.tsx")):
        rel = str(page_file.relative_to(DASHBOARD_DIR.parent)).replace("/page.tsx", "")
        # Skip [id] dynamic segments — would need real IDs
        if "[" in rel:
            continue
        pages.append(f"/{rel}")
    # Add landing page
    pages.append("/")
    return pages

def probe(url, method="GET"):
    """Probe a single URL. Returns (url, status, ms, body)."""
    t0 = time.time()
    try:
        cmd = [
            "curl", "-s", "-o", "/tmp/_prewarm_body", "-w", "%{http_code}",
            "--max-time", str(TIMEOUT_S), "-X", method,
            url,
        ]
        if method in ("POST", "PATCH", "PUT"):
            cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT_S + 5)
        elapsed = round((time.time() - t0) * 1000)
        try:
            code = int(r.stdout.strip())
        except ValueError:
            code = 0
        return (url, method, code, elapsed)
    except Exception as e:
        return (url, method, -1, 0, str(e))

def main():
    # Verify dev server is up
    print("[prewarm] Checking dev server is up...", file=sys.stderr)
    r = subprocess.run(
        ["curl", "-s", "--max-time", "10", f"{BASE}/api/health"],
        capture_output=True, text=True
    )
    if r.returncode != 0 or "ok" not in r.stdout:
        print(f"[prewarm] FATAL: dev server not responding at {BASE}/api/health", file=sys.stderr)
        print(f"          stdout: {r.stdout[:200]}", file=sys.stderr)
        sys.exit(1)
    print(f"[prewarm] Dev server healthy: {r.stdout.strip()[:120]}", file=sys.stderr)

    # Collect routes
    api_routes = collect_api_routes()
    dashboard_pages = collect_dashboard_pages()
    print(f"[prewarm] Found {len(api_routes)} API routes + {len(dashboard_pages)} pages to warm", file=sys.stderr)

    # Combine all targets
    targets = []
    # Add dashboard pages first (they're the most expensive to compile)
    for path in dashboard_pages:
        targets.append((f"{BASE}{path}", "GET"))
    # Then API routes — use GET if supported, else POST
    for route in api_routes:
        method = "GET" if "GET" in route["methods"] else route["methods"][0]
        targets.append((f"{BASE}{route['path']}", method))

    print(f"[prewarm] Probing {len(targets)} routes sequentially (low concurrency to avoid OOM)...", file=sys.stderr)

    ok = 0
    errors_500 = 0
    auth_401_403 = 0
    not_allowed = 0
    other = 0
    t_start = time.time()

    # Use very low concurrency — the dev server OOM-kills easily
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(probe, url, method): (url, method) for (url, method) in targets}
        done = 0
        for fut in as_completed(futures):
            url, method = futures[fut]
            try:
                result = fut.result()
                if len(result) == 5:
                    # Error
                    print(f"  ERR [{method}] {url.replace(BASE,'')} -> {result[4]}", file=sys.stderr)
                    other += 1
                else:
                    _, _, code, ms = result
                    if code == 200 or code == 307:
                        ok += 1
                    elif code in (401, 403):
                        auth_401_403 += 1
                    elif code == 405 or code == 400:
                        not_allowed += 1
                    elif code == 500:
                        errors_500 += 1
                        print(f"  500 [{method}] {url.replace(BASE,'')} -> {ms}ms", file=sys.stderr)
                    elif code == 404:
                        # 404 is OK for [id] routes with fake IDs
                        ok += 1
                    elif code in (0, -1):
                        other += 1
                done += 1
                if done % 25 == 0:
                    print(f"  ... {done}/{len(targets)} done ({round(done/len(targets)*100)}%)", file=sys.stderr)
            except Exception as e:
                print(f"  EXCEPTION: {e}", file=sys.stderr)
                other += 1

    elapsed = round(time.time() - t_start)
    print("", file=sys.stderr)
    print(f"=== PREWARM COMPLETE in {elapsed}s ===", file=sys.stderr)
    print(f"  Total routes:  {len(targets)}", file=sys.stderr)
    print(f"  OK (200/307):  {ok}", file=sys.stderr)
    print(f"  Auth 401/403:  {auth_401_403} (expected — these are protected routes)", file=sys.stderr)
    print(f"  405/400:       {not_allowed} (expected — wrong method or missing body)", file=sys.stderr)
    print(f"  500 errors:    {errors_500}", file=sys.stderr)
    print(f"  Other:         {other}", file=sys.stderr)
    print("", file=sys.stderr)
    print("Subsequent requests to these routes will be served from webpack cache (<100ms).", file=sys.stderr)

if __name__ == "__main__":
    main()

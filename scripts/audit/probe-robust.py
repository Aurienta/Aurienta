#!/usr/bin/env python3
"""Sequentially probe all AURIENTA API routes to identify broken/duplicated/working ones."""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

API_DIR = Path("/home/z/my-project/src/app/api")
OUT_JSONL = Path("/tmp/api-probe-seq.jsonl")
OUT_SUMMARY = Path("/tmp/api-probe-seq-summary.txt")

# Build route inventory
routes = []
for route_file in sorted(API_DIR.rglob("route.ts")):
    rel = str(route_file.relative_to(API_DIR)).replace("/route.ts", "")
    text = route_file.read_text(errors="ignore")
    methods = set(re.findall(r"export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|DELETE|PATCH)", text))
    if not methods:
        continue
    routes.append({"path": f"/api/{rel}", "file": str(route_file), "methods": sorted(methods)})

print(f"Found {len(routes)} routes with exported methods", file=sys.stderr)

BASE = "http://localhost:3000"
results = []

def substitute_dynamic(path):
    """Replace [id] with test value."""
    return re.sub(r'\[([^\]]+)\]', 'test-id-123', path)

def probe(route):
    path = substitute_dynamic(route["path"])
    methods = route["methods"]
    out = {"path": route["path"], "real_path": path, "methods": methods, "probes": []}
    test_methods = []
    if "GET" in methods:
        test_methods.append("GET")
    elif "POST" in methods:
        test_methods.append("POST")
    else:
        test_methods.append(methods[0])
    for method in test_methods:
        try:
            t0 = time.time()
            cmd = [
                "curl", "-s", "-o", "/tmp/_probe_body_seq", "-w", "%{http_code}",
                "--max-time", "30", "-X", method,
                f"{BASE}{path}",
            ]
            if method in ("POST", "PATCH", "PUT"):
                cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
            elapsed = round((time.time() - t0) * 1000)
            try:
                code = int(r.stdout.strip())
            except ValueError:
                code = 0
            body = ""
            try:
                body = Path("/tmp/_probe_body_seq").read_text(errors="ignore")[:200]
            except Exception:
                pass
            out["probes"].append({"method": method, "status": code, "ms": elapsed, "body": body})
        except subprocess.TimeoutExpired:
            out["probes"].append({"method": method, "status": -1, "ms": 30000, "body": "TIMEOUT"})
        except Exception as e:
            out["probes"].append({"method": method, "status": -1, "ms": 0, "body": f"ERR: {e}"})
    return out

# Probe sequentially with small delay
total = len(routes)
for i, route in enumerate(routes, 1):
    try:
        # Health check first; if dev dead, restart it
        h = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "5", f"{BASE}/api/health"],
            capture_output=True, text=True, timeout=8
        )
        if h.stdout.strip() != "200":
            # Dev dead; try to restart
            print(f"  [restart] dev dead at probe {i}/{total}, restarting...", file=sys.stderr)
            subprocess.run(["bash", "-c", "pkill -9 -f next; pkill -9 -f 'bun.*dev'; sleep 3; cd /home/z/my-project && export $(grep -v '^#' .env | xargs) && nohup bun run dev </dev/null >dev.log 2>&1 & disown; sleep 10"], timeout=30)
        r = probe(route)
        results.append(r)
        if i % 20 == 0 or i == total:
            print(f"  probed {i}/{total}", file=sys.stderr)
        time.sleep(0.05)  # small breathing room
    except Exception as e:
        print(f"  ERR for {route['path']}: {e}", file=sys.stderr)
        results.append({"path": route["path"], "real_path": substitute_dynamic(route["path"]), "methods": route["methods"], "probes": [{"method": "?", "status": -1, "ms": 0, "body": f"ERR: {e}"}]})

results.sort(key=lambda x: x["path"])
with OUT_JSONL.open("w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")

status_buckets = {}
broken = []
working_public = []
auth_required = []
not_found = []
for r in results:
    for p in r["probes"]:
        code = p["status"]
        status_buckets[code] = status_buckets.get(code, 0) + 1
        if code == 500:
            broken.append((r["path"], p["method"], p["body"]))
        elif code == 200:
            working_public.append((r["path"], p["method"]))
        elif code == 401:
            auth_required.append((r["path"], p["method"]))
        elif code == 404:
            not_found.append((r["path"], p["method"]))

with OUT_SUMMARY.open("w") as f:
    f.write("=" * 70 + "\n")
    f.write("AURIENTA API PROBE SUMMARY (SEQUENTIAL)\n")
    f.write("=" * 70 + "\n\n")
    f.write(f"Total routes: {len(routes)}\n")
    f.write(f"Total probes:  {sum(status_buckets.values())}\n\n")
    f.write("Status code distribution:\n")
    for code in sorted(status_buckets.keys(), key=lambda x: (isinstance(x, str), x)):
        f.write(f"  HTTP {code}: {status_buckets[code]} probes\n")
    f.write("\n" + "=" * 70 + "\n")
    f.write(f"BROKEN APIs (HTTP 500): {len(broken)}\n")
    f.write("=" * 70 + "\n")
    for path, method, body in broken[:50]:
        f.write(f"  {method:5s} {path}\n")
        if body:
            f.write(f"        body: {body[:150]}\n")
    if len(broken) > 50:
        f.write(f"  ... and {len(broken)-50} more\n")
    f.write("\n" + "=" * 70 + "\n")
    f.write(f"OPEN-200 APIs (no auth): {len(working_public)}\n")
    f.write("=" * 70 + "\n")
    for path, method in working_public[:50]:
        f.write(f"  {method:5s} {path}\n")
    if len(working_public) > 50:
        f.write(f"  ... and {len(working_public)-50} more\n")
    f.write("\n" + "=" * 70 + "\n")
    f.write(f"AUTH-REQUIRED (401): {len(auth_required)}\n")
    f.write("=" * 70 + "\n")
    for path, method in auth_required[:30]:
        f.write(f"  {method:5s} {path}\n")
    if len(auth_required) > 30:
        f.write(f"  ... and {len(auth_required)-30} more\n")
    f.write("\n" + "=" * 70 + "\n")
    f.write(f"NOT FOUND (404 - route missing handler?): {len(not_found)}\n")
    f.write("=" * 70 + "\n")
    for path, method in not_found[:20]:
        f.write(f"  {method:5s} {path}\n")

print(f"\nWrote {OUT_JSONL} ({len(routes)} routes)", file=sys.stderr)
print(f"Wrote {OUT_SUMMARY}", file=sys.stderr)
print(f"\nBroken (500): {len(broken)}", file=sys.stderr)
print(f"Open (200):   {len(working_public)}", file=sys.stderr)
print(f"Auth (401):   {len(auth_required)}", file=sys.stderr)
print(f"404:          {len(not_found)}", file=sys.stderr)

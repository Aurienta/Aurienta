#!/usr/bin/env python3
"""Probe all AURIENTA API routes and categorize them."""
import json
import re
import subprocess
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

API_DIR = Path("/home/z/my-project/src/app/api")
OUT_JSONL = Path("/tmp/api-probe-results.jsonl")
OUT_SUMMARY = Path("/tmp/api-probe-summary.txt")

# Build route inventory
routes = []
for route_file in sorted(API_DIR.rglob("route.ts")):
    rel = str(route_file.relative_to(API_DIR)).replace("/route.ts", "")
    # Extract exported HTTP methods
    text = route_file.read_text(errors="ignore")
    methods = set(re.findall(r"export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|DELETE|PATCH)", text))
    if not methods:
        continue
    routes.append({"path": f"/api/{rel}", "file": str(route_file), "methods": sorted(methods)})

print(f"Found {len(routes)} routes with exported methods", file=sys.stderr)

BASE = "http://localhost:3000"
results = []

def probe(route):
    path = route["path"]
    file_path = route["file"]
    methods = route["methods"]
    out = {"path": path, "methods": methods, "probes": []}
    # Probe GET first (if supported)
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
                "curl", "-s", "-o", "/tmp/_probe_body", "-w", "%{http_code}",
                "--max-time", "45", "-X", method,
                f"{BASE}{path}",
            ]
            if method == "POST":
                cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=50)
            elapsed = round((time.time() - t0) * 1000)
            try:
                code = int(r.stdout.strip())
            except ValueError:
                code = 0
            body = ""
            try:
                body = Path("/tmp/_probe_body").read_text(errors="ignore")[:300]
            except Exception:
                pass
            out["probes"].append({"method": method, "status": code, "ms": elapsed, "body": body})
        except subprocess.TimeoutExpired:
            out["probes"].append({"method": method, "status": -1, "ms": 45000, "body": "TIMEOUT"})
        except Exception as e:
            out["probes"].append({"method": method, "status": -1, "ms": 0, "body": f"ERR: {e}"})
    return out

# Probe in parallel with limited concurrency
with ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(probe, r): r for r in routes}
    done = 0
    for fut in as_completed(futures):
        try:
            r = fut.result()
            results.append(r)
            done += 1
            if done % 20 == 0:
                print(f"  probed {done}/{len(routes)}", file=sys.stderr)
        except Exception as e:
            print(f"  ERR for {futures[fut]['path']}: {e}", file=sys.stderr)

# Sort by path
results.sort(key=lambda x: x["path"])

# Write JSONL
with OUT_JSONL.open("w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")

# Build summary
status_buckets = {}
broken = []
working_public = []
for r in results:
    for p in r["probes"]:
        code = p["status"]
        status_buckets[code] = status_buckets.get(code, 0) + 1
        if code == 500:
            broken.append({"path": r["path"], "method": p["method"], "body": p["body"][:200]})
        elif code == 200:
            working_public.append({"path": r["path"], "method": p["method"], "body": p["body"][:150]})

with OUT_SUMMARY.open("w") as f:
    f.write("=" * 70 + "\n")
    f.write("AURIENTA API PROBE SUMMARY\n")
    f.write("=" * 70 + "\n\n")
    f.write(f"Total routes: {len(results)}\n")
    f.write(f"Total probes:  {sum(len(r['probes']) for r in results)}\n\n")
    f.write("Status code distribution:\n")
    for code in sorted(status_buckets.keys()):
        f.write(f"  HTTP {code}: {status_buckets[code]} probes\n")
    f.write("\n")
    f.write("=" * 70 + "\n")
    f.write(f"BROKEN APIs (HTTP 500): {len(broken)}\n")
    f.write("=" * 70 + "\n")
    for b in broken:
        f.write(f"\n  [{b['method']}] {b['path']}\n")
        f.write(f"    Body: {b['body']}\n")
    f.write("\n")
    f.write("=" * 70 + "\n")
    f.write(f"OPEN-200 APIs (no auth required): {len(working_public)}\n")
    f.write("=" * 70 + "\n")
    for w in working_public:
        f.write(f"  [{w['method']}] {w['path']}\n")

print(f"\nWrote {OUT_JSONL} ({len(results)} routes)")
print(f"Wrote {OUT_SUMMARY}")
print(f"\nBroken (500): {len(broken)}")
print(f"Open (200):   {len(working_public)}")

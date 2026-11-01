#!/usr/bin/env python3
"""Re-probe dynamic routes with valid placeholder IDs."""
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

OUT_JSONL = Path("/tmp/api-probe-dynamic.jsonl")

# Load previous results to get HTTP 0 routes
zero_routes = []
with open('/tmp/api-probe-results.jsonl') as f:
    for line in f:
        r = json.loads(line)
        for p in r['probes']:
            if p['status'] == 0:
                zero_routes.append({"path": r['path'], "method": p['method'], "methods": r['methods']})
                break

print(f"Re-probing {len(zero_routes)} dynamic routes", file=sys.stderr)

BASE = "http://localhost:3000"

def substitute_dynamic(path):
    """Replace [id], [slug], [enterpriseId] etc with 'test-id-123'."""
    # Replace any [segment] with a placeholder
    return re.sub(r'\[[^\]]+\]', 'test-id-123', path)

def probe(route):
    path = route["path"]
    method = route["method"]
    real_path = substitute_dynamic(path)
    out = {"path": path, "real_path": real_path, "method": method}
    try:
        t0 = time.time()
        cmd = [
            "curl", "-s", "-o", "/tmp/_probe_body2", "-w", "%{http_code}",
            "--max-time", "60", "-X", method,
            f"{BASE}{real_path}",
        ]
        if method == "POST":
            cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
        elif method == "PATCH":
            cmd += ["-H", "Content-Type: application/json", "-X", "PATCH", "-d", "{}"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=65)
        elapsed = round((time.time() - t0) * 1000)
        try:
            code = int(r.stdout.strip())
        except ValueError:
            code = 0
        body = ""
        try:
            body = Path("/tmp/_probe_body2").read_text(errors="ignore")[:300]
        except Exception:
            pass
        out["status"] = code
        out["ms"] = elapsed
        out["body"] = body
    except subprocess.TimeoutExpired:
        out["status"] = -1
        out["ms"] = 60000
        out["body"] = "TIMEOUT"
    except Exception as e:
        out["status"] = -1
        out["ms"] = 0
        out["body"] = f"ERR: {e}"
    return out

results = []
# Probe sequentially with low concurrency to avoid dev server overload
with ThreadPoolExecutor(max_workers=4) as ex:
    futures = {ex.submit(probe, r): r for r in zero_routes}
    done = 0
    for fut in as_completed(futures):
        try:
            r = fut.result()
            results.append(r)
            done += 1
            if done % 10 == 0:
                print(f"  probed {done}/{len(zero_routes)}", file=sys.stderr)
        except Exception as e:
            print(f"  ERR: {e}", file=sys.stderr)

results.sort(key=lambda x: x["path"])
with OUT_JSONL.open("w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")

# Summary
status_buckets = {}
broken_500 = []
broken_0 = []
for r in results:
    code = r["status"]
    status_buckets[code] = status_buckets.get(code, 0) + 1
    if code == 500:
        broken_500.append(r)
    elif code == 0 or code == -1:
        broken_0.append(r)

print("\n=== DYNAMIC ROUTE RE-PROBE SUMMARY ===")
print(f"Total: {len(results)}")
print("Status distribution:")
for code in sorted(status_buckets.keys()):
    print(f"  HTTP {code}: {status_buckets[code]}")
print(f"\nBroken (500): {len(broken_500)}")
for b in broken_500:
    print(f"  [{b['method']}] {b['path']}")
    print(f"    Body: {b['body'][:200]}")
print(f"\nFailed (0/-1): {len(broken_0)}")
for b in broken_0:
    print(f"  [{b['method']}] {b['path']}")

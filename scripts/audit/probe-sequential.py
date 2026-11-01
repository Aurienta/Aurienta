#!/usr/bin/env python3
"""Sequentially re-probe the 45 remaining failed routes."""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

OUT_JSONL = Path("/tmp/api-probe-sequential.jsonl")

# Load dynamic probe results — get HTTP 0 ones
failed = []
with open('/tmp/api-probe-dynamic.jsonl') as f:
    for line in f:
        r = json.loads(line)
        if r["status"] in (0, -1):
            failed.append({"path": r["path"], "method": r["method"]})

print(f"Sequentially probing {len(failed)} failed routes", file=sys.stderr)

BASE = "http://localhost:3000"

def substitute_dynamic(path):
    return re.sub(r'\[[^\]]+\]', 'test-id-123', path)

results = []
for i, route in enumerate(failed):
    path = route["path"]
    method = route["method"]
    real_path = substitute_dynamic(path)
    out = {"path": path, "real_path": real_path, "method": method}
    try:
        t0 = time.time()
        cmd = [
            "curl", "-s", "-o", "/tmp/_probe_body3", "-w", "%{http_code}",
            "--max-time", "90", "-X", method,
            f"{BASE}{real_path}",
        ]
        if method in ("POST", "PATCH", "PUT"):
            cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=95)
        elapsed = round((time.time() - t0) * 1000)
        try:
            code = int(r.stdout.strip())
        except ValueError:
            code = 0
        body = ""
        try:
            body = Path("/tmp/_probe_body3").read_text(errors="ignore")[:300]
        except Exception:
            pass
        out["status"] = code
        out["ms"] = elapsed
        out["body"] = body
    except subprocess.TimeoutExpired:
        out["status"] = -1
        out["ms"] = 90000
        out["body"] = "TIMEOUT"
    except Exception as e:
        out["status"] = -1
        out["ms"] = 0
        out["body"] = f"ERR: {e}"
    results.append(out)
    print(f"  [{i+1}/{len(failed)}] {method} {real_path} -> HTTP {out['status']} ({out['ms']}ms)", file=sys.stderr)
    # Brief pause between requests
    time.sleep(0.5)

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
    elif code in (0, -1):
        broken_0.append(r)

print("\n=== SEQUENTIAL RE-PROBE SUMMARY ===")
print(f"Total: {len(results)}")
print("Status distribution:")
for code in sorted(status_buckets.keys()):
    print(f"  HTTP {code}: {status_buckets[code]}")
print(f"\nBroken (500): {len(broken_500)}")
for b in broken_500:
    print(f"  [{b['method']}] {b['path']}")
    print(f"    Body: {b['body'][:200]}")
print(f"\nStill failing (0/-1): {len(broken_0)}")
for b in broken_0:
    print(f"  [{b['method']}] {b['path']}")

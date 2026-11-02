#!/usr/bin/env python3
"""Targeted pre-warm of the most-used AURIENTA routes.
Hits ~30 critical endpoints (not all 333) to trigger webpack compilation
without OOM-killing the dev server."""
import subprocess
import sys
import time

BASE = "http://localhost:3000"
TIMEOUT = 60

# Prioritized routes — the ones users hit first
HOT_ROUTES = [
    # Pages (most expensive to compile)
    ("GET", "/"),
    ("GET", "/dashboard"),
    # Auth
    ("GET", "/api/auth"),
    # Ops
    ("GET", "/api/health"),
    ("GET", "/api/platform-health"),
    ("GET", "/api/ready"),
    # Public APIs
    ("GET", "/api/public/registry"),
    ("GET", "/api/public/stats"),
    ("GET", "/api/fx/consensus?from=USD&to=EGP"),
    ("GET", "/api/oracle/consensus"),
    ("GET", "/api/legal-templates"),
    ("GET", "/api/v1/cre/policies"),
    ("GET", "/api/evidence"),
    # Authenticated APIs (will return 401 — but compiles the route)
    ("GET", "/api/enterprises"),
    ("GET", "/api/proposals"),
    ("GET", "/api/notifications"),
    ("GET", "/api/dashboard-tasks"),
    ("GET", "/api/milestones"),
    ("GET", "/api/enterprises/test-id-123/profile"),
    ("GET", "/api/enterprises/test-id-123/health"),
    ("GET", "/api/admin/enterprises"),
    ("GET", "/api/admin/users"),
    ("GET", "/api/admin/audit"),
    ("GET", "/api/admin/settings"),
    ("GET", "/api/expenses"),
    ("GET", "/api/expenses/budget"),
    ("GET", "/api/employees"),
    ("GET", "/api/dividends"),
    ("GET", "/api/reservations"),
    ("GET", "/api/orders"),
    ("GET", "/api/trade-instruments"),
    ("GET", "/api/proxies"),
    ("GET", "/api/succession"),
    ("GET", "/api/endorsements"),
    ("GET", "/api/quadratic-voting"),
    ("GET", "/api/arei"),
    ("GET", "/api/genome"),
    ("GET", "/api/graduation"),
    ("GET", "/api/screening"),
    ("GET", "/api/skill-equity"),
    ("GET", "/api/mentorship"),
    ("GET", "/api/diaspora"),
    ("GET", "/api/productive-egp/snapshot"),
    ("GET", "/api/ledger/ticker"),
    ("GET", "/api/ledger/verify"),
    ("GET", "/api/benchmark"),
    # FRA dashboard
    ("GET", "/api/v1/regulatory/fra/dashboard"),
]

def probe(method, path):
    url = BASE + path
    cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{time_total}",
           "--max-time", str(TIMEOUT), "-X", method]
    if method in ("POST", "PATCH", "PUT"):
        cmd += ["-H", "Content-Type: application/json", "-d", "{}"]
    cmd.append(url)
    t0 = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT+5)
        parts = r.stdout.strip().split()
        code = int(parts[0]) if parts else 0
        elapsed = float(parts[1]) if len(parts) > 1 else 0
        return code, elapsed
    except Exception as e:
        return -1, 0

print(f"[prewarm-hot] Warming {len(HOT_ROUTES)} critical routes...")
ok = 0
total_time = 0
for i, (method, path) in enumerate(HOT_ROUTES, 1):
    code, elapsed = probe(method, path)
    total_time += elapsed
    status = "OK" if code in (200, 307, 401, 403, 404, 405, 400) else f"ERR({code})"
    if code in (200, 307, 401, 403, 404, 405, 400):
        ok += 1
    print(f"  [{i:2d}/{len(HOT_ROUTES)}] {status} {method} {path} — {code} in {elapsed:.2f}s")
    # Brief pause to let dev server breathe
    time.sleep(0.3)

print(f"\n[prewarm-hot] Done: {ok}/{len(HOT_ROUTES)} routes warmed in {total_time:.1f}s total")
print("[prewarm-hot] Subsequent requests to these routes will be <100ms (webpack cached)")

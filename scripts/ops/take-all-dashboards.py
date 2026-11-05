#!/usr/bin/env python3
"""
AURIENTA — Take screenshots of all 5 demo users' dashboards.
Restores DB if needed, logs in each user via curl, opens browser with cookie,
dismisses onboarding modal, captures clean dashboard screenshot.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

PROJECT = "/home/z/my-project"
SHOTS = f"{PROJECT}/screenshots"
os.makedirs(SHOTS, exist_ok=True)

def run(cmd, timeout=30):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)

def ab(*args, timeout=20):
    try:
        return subprocess.run(["agent-browser"] + list(args), capture_output=True, text=True, timeout=timeout)
    except: return None

def ensure_server():
    r = run('curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health', timeout=5)
    return r.stdout.strip() == "200"

def login_via_curl(email, password):
    r = run(
        f'curl -s -X POST http://localhost:3000/api/auth -H "Content-Type: application/json" '
        f'-d \'{{"email":"{email}","password":"{password}"}}\' -D - --max-time 30 -o /dev/null',
        timeout=35
    )
    for line in r.stdout.split("\n"):
        if line.lower().startswith("set-cookie:"):
            cookie_part = line[len("set-cookie:"):].strip()
            name_value = cookie_part.split(";")[0].strip()
            if "=" in name_value:
                return name_value
    return None

DEMO_USERS = [
    ("layla@streetbites.eg", "aurienta2026", "layla", "Layla Mostafa"),
    ("ahmed@ecopack.eg", "aurienta2026", "ahmed", "Ahmed Khaled"),
    ("sarah@investor.eg", "aurienta2026", "sarah", "Sarah Ibrahim"),
    ("mohamed@smartfarm.eg", "aurienta2026", "mohamed", "Mohamed Adel"),
    ("khalil@holding.eg", "aurienta2026", "khalil", "Khalil Mansour"),
]

results = []

for email, password, slug, name in DEMO_USERS:
    print(f"\n{'='*50}", flush=True)
    print(f"  {name} ({email})", flush=True)
    print(f"{'='*50}", flush=True)

    result = {"email": email, "name": name, "slug": slug}

    if not ensure_server():
        print("  ❌ server unavailable", flush=True)
        result["status"] = "FAILED - server"
        results.append(result)
        continue

    cookie = login_via_curl(email, password)
    if not cookie:
        print("  ❌ login failed", flush=True)
        result["status"] = "FAILED - login"
        results.append(result)
        continue
    print(f"  ✅ Login OK", flush=True)

    ab("close", timeout=5)
    time.sleep(1)
    ab("open", "http://localhost:3000/signin", timeout=15)
    ab("wait", "3000", timeout=5)
    ab("eval", f"document.cookie = '{cookie}; path=/; max-age=86400; SameSite=Lax'; localStorage.clear(); sessionStorage.clear();", timeout=5)

    if not ensure_server():
        result["status"] = "FAILED - server died before dashboard"
        results.append(result)
        continue

    ab("open", "http://localhost:3000/dashboard", timeout=15)
    ab("wait", "8000", timeout=12)

    r = ab("get", "url", timeout=5)
    url = r.stdout.strip() if r else ""
    print(f"  URL: {url}", flush=True)

    if "/dashboard" not in url:
        result["status"] = f"FAILED - redirected to {url}"
        results.append(result)
        continue

    # Screenshot with onboarding modal
    ab("screenshot", f"{SHOTS}/final-{slug}-01-with-modal.png", "--full", timeout=15)
    print(f"  📸 Screenshot 1: with modal", flush=True)

    # Find and click "Skip tour" button (or remove modal via JS)
    r = ab("snapshot", "-i", timeout=10)
    if r and "skip" in r.stdout.lower():
        # Find Skip button ref
        import re
        m = re.search(r'skip.*tour.*dashboard.*?\[ref=(e\d+)\]', r.stdout, re.IGNORECASE)
        if m:
            ref = f"@{m.group(1)}"
            ab("click", ref, timeout=10)
            ab("wait", "2000", timeout=5)
            print(f"  ✅ Clicked Skip tour", flush=True)
    # Also remove via JS as backup
    ab("eval", "document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove())", timeout=5)
    ab("wait", "2000", timeout=5)

    # Screenshot clean dashboard
    ab("screenshot", f"{SHOTS}/final-{slug}-02-dashboard.png", "--full", timeout=15)
    print(f"  📸 Screenshot 2: clean dashboard", flush=True)

    result["status"] = "OK"
    result["dashboard_url"] = url
    results.append(result)

# Summary
print(f"\n{'='*50}", flush=True)
print(f"  SUMMARY", flush=True)
print(f"{'='*50}", flush=True)
ok = sum(1 for r in results if r.get("status") == "OK")
print(f"  OK: {ok}/{len(results)}", flush=True)
for r in results:
    print(f"  - {r['email']}: {r.get('status', 'unknown')}", flush=True)

with open(f"{PROJECT}/screenshots-report.json", "w") as f:
    json.dump(results, f, indent=2)

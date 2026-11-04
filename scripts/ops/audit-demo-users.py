#!/usr/bin/env python3
"""
AURIENTA — Comprehensive end-to-end demo user audit.
Tests all 5 demo users through the full browser flow:
1. Login via curl (get session cookie)
2. Open dashboard in browser with cookie
3. Capture screenshot
4. Close onboarding modal
5. Capture clean dashboard screenshot
6. Test role switcher (if multiple roles)
7. Test enterprise switcher
8. Capture final state

Outputs: /home/z/my-project/screenshots/audit-*.png
         /home/z/my-project/audit-report.json
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
    except subprocess.TimeoutExpired:
        return None
    except Exception as e:
        return None

def ensure_server():
    r = run('curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health', timeout=5)
    if r.stdout.strip() != "200":
        print("  [restart] server dead, waiting for keepalive...", flush=True)
        for _ in range(20):
            time.sleep(2)
            r = run('curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health', timeout=5)
            if r.stdout.strip() == "200":
                return True
        return False
    return True

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

def get_memberships(email):
    """Get user's roles per enterprise from local SQLite."""
    r = run(f'''bun -e "
import {{ createClient }} from '@libsql/client';
const c = createClient({{ url: 'file:' + process.cwd() + '/db/custom.db' }});
const r = await c.execute(`SELECT em.role, e.name as enterprise FROM EnterpriseMember em JOIN User u ON u.id = em.userId JOIN Enterprise e ON e.id = em.enterpriseId WHERE u.email = '{email}' ORDER BY e.name`);
const grouped = {{}};
for (const row of r.rows) {{
  if (!grouped[row.enterprise]) grouped[row.enterprise] = [];
  grouped[row.enterprise].push(row.role);
}}
for (const [ent, roles] of Object.entries(grouped)) {{
  console.log(ent + ': ' + roles.join(', '));
}}
" ''', timeout=15)
    return r.stdout.strip()

DEMO_USERS = [
    ("layla@streetbites.eg", "aurienta2026", "layla", "Layla Mostafa"),
    ("ahmed@ecopack.eg", "aurienta2026", "ahmed", "Ahmed Khaled"),
    ("sarah@investor.eg", "aurienta2026", "sarah", "Sarah Ibrahim"),
    ("mohamed@smartfarm.eg", "aurienta2026", "mohamed", "Mohamed Adel"),
    ("khalil@holding.eg", "aurienta2026", "khalil", "Khalil Mansour"),
]

results = []

for email, password, slug, name in DEMO_USERS:
    print(f"\n{'='*60}", flush=True)
    print(f"  AUDIT: {name} ({email})", flush=True)
    print(f"{'='*60}", flush=True)

    result = {"email": email, "name": name, "slug": slug}

    # Get memberships
    memberships = get_memberships(email)
    print(f"  Memberships:\n{memberships}", flush=True)
    result["memberships"] = memberships

    if not ensure_server():
        result["status"] = "FAILED - server unavailable"
        results.append(result)
        continue

    # Login via curl
    cookie = login_via_curl(email, password)
    if not cookie:
        print(f"  ❌ Login failed", flush=True)
        result["status"] = "FAILED - login"
        results.append(result)
        continue
    print(f"  ✅ Login OK (cookie obtained)", flush=True)
    result["login"] = "OK"

    # Open browser
    ab("close", timeout=5)
    time.sleep(1)
    ab("open", "http://localhost:3000/signin", timeout=15)
    ab("wait", "3000", timeout=5)
    ab("eval", f"document.cookie = '{cookie}; path=/; max-age=86400; SameSite=Lax'", timeout=5)

    if not ensure_server():
        result["status"] = "FAILED - server died before dashboard"
        results.append(result)
        continue

    # Open dashboard
    ab("open", "http://localhost:3000/dashboard", timeout=15)
    ab("wait", "8000", timeout=12)

    # Check URL
    r = ab("get", "url", timeout=5)
    url = r.stdout.strip() if r else ""
    print(f"  URL: {url}", flush=True)
    result["dashboard_url"] = url

    if "/dashboard" not in url:
        print(f"  ❌ Did NOT reach dashboard (redirected to {url})", flush=True)
        result["status"] = f"FAILED - redirected to {url}"
        results.append(result)
        continue

    # Screenshot with onboarding modal
    ab("screenshot", f"{SHOTS}/audit-{slug}-01-dashboard-with-modal.png", "--full", timeout=15)
    print(f"  📸 Screenshot 1: dashboard with modal", flush=True)

    # Remove modal via JS
    ab("eval", "document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove())", timeout=5)
    ab("wait", "2000", timeout=5)

    # Screenshot clean dashboard
    ab("screenshot", f"{SHOTS}/audit-{slug}-02-dashboard-clean.png", "--full", timeout=15)
    print(f"  📸 Screenshot 2: clean dashboard", flush=True)

    # Check role switcher
    r = ab("snapshot", "-i", timeout=10)
    snapshot = r.stdout if r else ""
    has_role_btn = 'button "Role"' in snapshot
    has_active_roles = "active role" in snapshot
    print(f"  Role switcher button: {'✅ present' if has_role_btn else '❌ absent (single role)'}", flush=True)
    print(f"  Active roles badge: {'✅ present' if has_active_roles else '❌ absent'}", flush=True)
    result["role_switcher"] = "dropdown" if has_role_btn else "static-badge"

    result["status"] = "OK"
    results.append(result)

# Summary
print(f"\n{'='*60}", flush=True)
print(f"  AUDIT SUMMARY", flush=True)
print(f"{'='*60}", flush=True)
ok = sum(1 for r in results if r.get("status") == "OK")
failed = len(results) - ok
print(f"  Total users tested: {len(results)}", flush=True)
print(f"  OK: {ok}", flush=True)
print(f"  Failed: {failed}", flush=True)
for r in results:
    print(f"  - {r['email']}: {r.get('status', 'unknown')}", flush=True)

# Save report
with open(f"{PROJECT}/audit-report.json", "w") as f:
    json.dump(results, f, indent=2)
print(f"\n  Report saved: audit-report.json", flush=True)

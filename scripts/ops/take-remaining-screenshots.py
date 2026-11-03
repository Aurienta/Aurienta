#!/usr/bin/env python3
"""Take screenshots for remaining demo users — fast version."""
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

def ab(*args, timeout=15):
    try:
        return subprocess.run(["agent-browser"] + list(args), capture_output=True, text=True, timeout=timeout)
    except Exception as e:
        return None

def login_via_curl(email, password):
    r = run(
        f'curl -s -X POST http://localhost:3000/api/auth -H "Content-Type: application/json" '
        f'-d \'{{"email":"{email}","password":"{password}"}}\' -i --max-time 30',
        timeout=35
    )
    cookies = {}
    for line in r.stdout.split("\n"):
        line = line.strip()
        if line.lower().startswith("set-cookie:"):
            cookie_part = line[len("set-cookie:"):].strip()
            name_value = cookie_part.split(";")[0].strip()
            if "=" in name_value:
                name, _, value = name_value.partition("=")
                cookies[name.strip()] = value.strip()
    return cookies

def ensure_server():
    """Restart dev if dead."""
    r = run('curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health', timeout=5)
    if r.stdout.strip() == "200":
        return True
    print("  [restart] server dead, restarting...", flush=True)
    run("pkill -9 -f 'next'; pkill -9 -f 'bun.*dev'", timeout=10)
    time.sleep(3)
    env = os.environ.copy()
    with open(f"{PROJECT}/.env") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    env["NODE_OPTIONS"] = "--max-old-space-size=2048"
    log_fd = open(f"{PROJECT}/dev.log", "wb")
    proc = subprocess.Popen(["bun", "run", "dev"], cwd=PROJECT, env=env,
                            stdout=log_fd, stderr=subprocess.STDOUT, start_new_session=True)
    for i in range(40):
        time.sleep(1)
        r = run('curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health', timeout=5)
        if r.stdout.strip() == "200":
            print(f"  [restart] ready after {i+1}s", flush=True)
            return True
    return False

def take_user_shots(email, password, name):
    print(f"\n[{name}] === {email} ===", flush=True)
    if not ensure_server():
        print(f"  ❌ server unavailable", flush=True)
        return False
    cookies = login_via_curl(email, password)
    if not cookies:
        print(f"  ❌ login failed", flush=True)
        return False
    print(f"  ✅ logged in (cookies: {list(cookies.keys())})", flush=True)

    ab("close", timeout=5)
    time.sleep(1)
    ab("open", "http://localhost:3000/signin", timeout=15)
    ab("wait", "2000", timeout=5)
    for cname, cvalue in cookies.items():
        ab("eval", f"document.cookie = '{cname}={cvalue}; path=/; max-age=86400; SameSite=Lax'", timeout=5)

    # Dashboard
    ab("open", "http://localhost:3000/dashboard", timeout=15)
    ab("wait", "5000", timeout=10)
    rc, url, _ = (ab("get", "url", timeout=5).returncode, ab("get", "url", timeout=5).stdout, "")
    r = ab("get", "url", timeout=5)
    url = r.stdout.strip() if r else ""
    print(f"  URL: {url}", flush=True)
    ab("screenshot", f"{SHOTS}/verify-05-{name}-dashboard.png", "--full", timeout=15)
    print(f"  📸 dashboard saved", flush=True)

    # Egypt market (key feature)
    if not ensure_server(): return True
    ab("open", "http://localhost:3000/dashboard/egypt-market", timeout=15)
    ab("wait", "4000", timeout=8)
    ab("screenshot", f"{SHOTS}/verify-06-{name}-egypt-market.png", "--full", timeout=15)
    print(f"  📸 egypt-market saved", flush=True)
    return True

if __name__ == "__main__":
    users = [
        ("ahmed@ecopack.eg", "aurienta2026", "ahmed"),
        ("sarah@investor.eg", "aurienta2026", "sarah"),
        ("mohamed@smartfarm.eg", "aurienta2026", "mohamed"),
        ("khalil@holding.eg", "aurienta2026", "khalil"),
    ]
    for email, pwd, name in users:
        try:
            take_user_shots(email, pwd, name)
        except Exception as e:
            print(f"  ❌ {name} failed: {e}", flush=True)
    # List final screenshots
    files = sorted(Path(SHOTS).glob("verify-*.png"))
    print(f"\n[summary] {len(files)} verify-* screenshots:", flush=True)
    for f in files:
        print(f"  {f.name}  ({f.stat().st_size:,} bytes)", flush=True)

#!/usr/bin/env python3
"""
Take all AURIENTA verification screenshots in rapid succession.
Restarts dev server, then takes all screenshots before OOM kills it.
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

PROJECT = "/home/z/my-project"
SHOTS = f"{PROJECT}/screenshots"
os.makedirs(SHOTS, exist_ok=True)

def run(cmd, timeout=30, capture=True):
    """Run shell command."""
    if capture:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    else:
        return subprocess.run(cmd, shell=True, timeout=timeout).returncode, "", ""

def restart_dev():
    """Kill and restart dev server with proper env."""
    print("[restart] killing old dev server...", flush=True)
    run("pkill -9 -f 'next'; pkill -9 -f 'bun.*dev'", timeout=10)
    time.sleep(3)
    # Load env explicitly
    env = os.environ.copy()
    with open(f"{PROJECT}/.env") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    env["NODE_OPTIONS"] = "--max-old-space-size=2048"
    print("[restart] starting dev server...", flush=True)
    log_fd = open(f"{PROJECT}/dev.log", "wb")
    proc = subprocess.Popen(
        ["bun", "run", "dev"],
        cwd=PROJECT,
        env=env,
        stdout=log_fd,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    # Wait for health
    for i in range(40):
        time.sleep(1)
        try:
            r = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3",
                 "http://localhost:3000/api/health"],
                capture_output=True, text=True, timeout=5
            )
            if r.stdout.strip() == "200":
                print(f"[restart] dev server ready after {i+1}s (PID {proc.pid})", flush=True)
                return proc
        except Exception:
            pass
    print("[restart] FAILED to start dev server", flush=True)
    return None

def ab(*args, timeout=30):
    """Run agent-browser command."""
    cmd = ["agent-browser"] + list(args)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -1, "", str(e)

def login_via_curl(email, password):
    """Login via curl, return session cookie value."""
    rc, out, err = run(
        f'curl -s -X POST http://localhost:3000/api/auth -H "Content-Type: application/json" '
        f'-d \'{{"email":"{email}","password":"{password}"}}\' -i --max-time 30',
        timeout=35
    )
    # Parse Set-Cookie header
    cookies = {}
    for line in out.split("\n"):
        line = line.strip()
        if line.lower().startswith("set-cookie:"):
            cookie_part = line[len("set-cookie:"):].strip()
            # Get name=value (first part before ;)
            name_value = cookie_part.split(";")[0].strip()
            if "=" in name_value:
                name, _, value = name_value.partition("=")
                cookies[name.strip()] = value.strip()
    return cookies

def take_screenshot(url, filename, wait_ms=4000, full=True):
    """Navigate to URL and take screenshot."""
    ab("open", url, timeout=15)
    ab("wait", str(wait_ms), timeout=10)
    args = ["screenshot", f"{SHOTS}/{filename}"]
    if full:
        args.append("--full")
    ab(*args, timeout=15)

def main():
    # Kill any existing browser
    ab("close", timeout=5)
    time.sleep(1)

    # Restart dev server
    proc = restart_dev()
    if not proc:
        sys.exit(1)

    # Take initial screenshots (no auth needed)
    print("\n[shots] Taking public screenshots...", flush=True)
    take_screenshot("http://localhost:3000/", "verify-00-homepage.png", wait_ms=5000)
    take_screenshot("http://localhost:3000/signin", "verify-01-signin.png", wait_ms=3000)
    take_screenshot("http://localhost:3000/api/health", "verify-02-health-api.png", wait_ms=2000)
    take_screenshot("http://localhost:3000/api/public/stats", "verify-03-public-stats.png", wait_ms=2000)
    take_screenshot("http://localhost:3000/api/v1/egypt", "verify-04-egypt-market.png", wait_ms=2000)

    # Login as each demo user and screenshot dashboard
    demo_users = [
        ("layla@streetbites.eg", "aurienta2026", "layla"),
        ("ahmed@ecopack.eg", "aurienta2026", "ahmed"),
        ("sarah@investor.eg", "aurienta2026", "sarah"),
        ("mohamed@smartfarm.eg", "aurienta2026", "mohamed"),
        ("khalil@holding.eg", "aurienta2026", "khalil"),
    ]

    for email, password, name in demo_users:
        print(f"\n[shots] === {name} ({email}) ===", flush=True)
        # Login via curl
        cookies = login_via_curl(email, password)
        if not cookies:
            print(f"  ❌ login failed for {email}", flush=True)
            continue
        print(f"  ✅ logged in, got cookies: {list(cookies.keys())}", flush=True)

        # Restart dev if needed before each user (OOM mitigation)
        try:
            r = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3",
                 "http://localhost:3000/api/health"],
                capture_output=True, text=True, timeout=5
            )
            if r.stdout.strip() != "200":
                print(f"  [restart] server dead, restarting...", flush=True)
                proc = restart_dev()
                if not proc:
                    continue
                # Re-login after restart
                cookies = login_via_curl(email, password)
        except Exception:
            pass

        # Close browser and reopen fresh
        ab("close", timeout=5)
        time.sleep(1)

        # Open dashboard URL - server will redirect to /signin if not authed
        # We'll use agent-browser to navigate, then set cookies via JavaScript
        ab("open", "http://localhost:3000/signin", timeout=15)
        ab("wait", "2000", timeout=5)

        # Set cookies via JS eval
        for cname, cvalue in cookies.items():
            # Set cookie via document.cookie
            ab("eval", f"document.cookie = '{cname}={cvalue}; path=/; max-age=86400; SameSite=Lax'", timeout=5)

        # Now navigate to dashboard
        ab("open", "http://localhost:3000/dashboard", timeout=15)
        ab("wait", "5000", timeout=10)

        # Get URL to see if redirected
        rc, url, _ = ab("get", "url", timeout=5)
        print(f"  URL: {url.strip()}", flush=True)

        # Take screenshot
        ab("screenshot", f"{SHOTS}/verify-05-{name}-dashboard.png", "--full", timeout=15)
        print(f"  📸 screenshot saved: verify-05-{name}-dashboard.png", flush=True)

        # Try other key pages
        for page in ["/dashboard/egypt-market", "/dashboard/arei", "/dashboard/discovery",
                     "/dashboard/soulbound", "/dashboard/oracle", "/dashboard/enterprise"]:
            try:
                ab("open", f"http://localhost:3000{page}", timeout=10)
                ab("wait", "3000", timeout=5)
                page_name = page.split("/")[-1]
                ab("screenshot", f"{SHOTS}/verify-06-{name}-{page_name}.png", "--full", timeout=10)
                print(f"  📸 {page_name} screenshot saved", flush=True)
            except Exception as e:
                print(f"  ⚠️  {page} failed: {e}", flush=True)

    # Take final API screenshots
    print("\n[shots] Final API screenshots...", flush=True)
    take_screenshot("http://localhost:3000/api/v1/egypt?dataset=overview", "verify-07-egypt-overview.png", wait_ms=2000)
    take_screenshot("http://localhost:3000/api/v1/egypt?dataset=governorates", "verify-08-egypt-governorates.png", wait_ms=2000)
    take_screenshot("http://localhost:3000/api/public/registry", "verify-09-public-registry.png", wait_ms=2000)

    print("\n[done] All screenshots complete", flush=True)
    print(f"[done] Files saved to {SHOTS}/verify-*.png", flush=True)

    # List all verify-* files
    files = sorted(Path(SHOTS).glob("verify-*.png"))
    print(f"\n[summary] {len(files)} verification screenshots:", flush=True)
    for f in files:
        size = f.stat().st_size
        print(f"  {f.name}  ({size:,} bytes)", flush=True)

if __name__ == "__main__":
    main()

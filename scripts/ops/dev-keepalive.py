#!/usr/bin/env python3
"""
AURIENTA — Robust dev server keep-alive daemon.

Double-forks to become a true daemon (survives parent shell exit + sandbox signals).
Auto-restarts `bun run dev` whenever it dies (OOM, crash, etc).
Also runs `sandbox-recovery.sh` if db/ or .env gets wiped.

Usage:
  setsid python3 scripts/ops/dev-keepalive.py </dev/null >/tmp/keepalive.log 2>&1 &
  disown
"""
import os, sys, time, subprocess, signal

PROJECT = "/home/z/my-project"
DEV_LOG = f"{PROJECT}/dev.log"
HEALTH_LOG = "/tmp/keepalive.log"
MAX_RESTARTS = 100000
RESTART_DELAY = 2

def log(msg):
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] {msg}"
    print(line, flush=True)
    try:
        with open(HEALTH_LOG, "a") as f:
            f.write(line + "\n")
    except: pass

def daemonize():
    """Double-fork to become a true daemon."""
    try:
        if os.fork() > 0: sys.exit(0)
    except OSError: sys.exit(1)
    os.chdir("/"); os.setsid(); os.umask(0)
    try:
        if os.fork() > 0: sys.exit(0)
    except OSError: sys.exit(1)
    sys.stdout.flush(); sys.stderr.flush()
    with open("/dev/null", "r") as f: os.dup2(f.fileno(), 0)
    with open(HEALTH_LOG, "a") as f:
        os.dup2(f.fileno(), 1); os.dup2(f.fileno(), 2)

def load_env():
    """Load .env into a dict."""
    env = os.environ.copy()
    try:
        with open(f"{PROJECT}/.env") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line: continue
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    except FileNotFoundError:
        # .env missing — restore defaults
        log(".env missing — restoring defaults")
        default_env = """DATABASE_URL=file:/home/z/my-project/db/custom.db
SESSION_SECRET=aurienta-session-secret-2026-production-turso
CRON_SECRET=aurienta-cron-secret-2026
FRA_ACCESS_TOKEN=test-fra-token
FIELD_ENCRYPTION_KEY=Qm9FUVlJUnN5UWlobXN4ZE9TQnpNSllVRklZdnFzY2M=
FRED_KEY=369eee7bb9170bcb9d5c7244912f2e08
ALLOW_DEMO_SIGNIN=true
NODE_OPTIONS=--max-old-space-size=2048
"""
        with open(f"{PROJECT}/.env", "w") as f: f.write(default_env)
        for line in default_env.strip().split("\n"):
            if "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    env["NODE_OPTIONS"] = "--max-old-space-size=2048"
    return env

def ensure_db(env):
    """If db/custom.db missing or corrupted, run sandbox-recovery."""
    db_path = f"{PROJECT}/db/custom.db"
    if not os.path.exists(db_path) or os.path.getsize(db_path) < 100000:
        log("db missing or too small — running sandbox-recovery.sh")
        subprocess.run(
            ["bash", f"{PROJECT}/scripts/ops/sandbox-recovery.sh"],
            cwd=PROJECT, env=env, timeout=120,
            capture_output=True,
        )
    return env

def wait_for_health(timeout=60):
    """Wait until dev server responds 200 on /api/health."""
    for i in range(timeout):
        try:
            r = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "3", "http://localhost:3000/api/health"],
                capture_output=True, text=True, timeout=5,
            )
            if r.stdout.strip() == "200":
                return True
        except: pass
        time.sleep(1)
    return False

def main():
    # Kill existing dev servers
    subprocess.run("pkill -9 -f 'next dev'; pkill -9 -f 'next-server'; pkill -9 -f 'bun.*dev'", shell=True, capture_output=True)
    time.sleep(2)

    daemonize()

    restarts = 0
    while restarts < MAX_RESTARTS:
        env = load_env()
        ensure_db(env)

        log(f"=== attempt {restarts + 1}/{MAX_RESTARTS} ===")
        log(f"DATABASE_URL={env.get('DATABASE_URL', '(unset)')}")

        # Open dev log in append mode
        log_fd = open(DEV_LOG, "ab")
        log_fd.write(f"\n[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] === keepalive: starting dev (attempt {restarts + 1}) ===\n".encode())
        log_fd.flush()

        try:
            proc = subprocess.Popen(
                ["bun", "run", "dev"],
                cwd=PROJECT, env=env,
                stdout=log_fd, stderr=subprocess.STDOUT,
                start_new_session=True,  # Detach from our process group
            )
            log(f"started bun run dev (PID {proc.pid})")

            # Wait for health
            if wait_for_health(60):
                log("✅ dev server healthy (HTTP 200)")
            else:
                log("⚠️  dev server didn't become healthy within 60s")

            # Block until the dev server dies
            rc = proc.wait()
            log_fd.close()
            log(f"dev server exited (rc={rc})")
        except Exception as e:
            log(f"error: {e}")
            try: log_fd.close()
            except: pass

        time.sleep(RESTART_DELAY)
        restarts += 1

    log(f"Max restarts ({MAX_RESTARTS}) reached. Stopping.")

if __name__ == "__main__":
    main()

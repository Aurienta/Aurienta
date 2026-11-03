#!/usr/bin/env python3
"""
AURIENTA — Robust dev server watchdog.
Restarts `bun run dev` whenever it dies (OOM, crash, etc).
Survives shell exits because it double-forks and becomes a daemon.
"""
import os, sys, time, subprocess, signal, errno

PROJECT_DIR = "/home/z/my-project"
DEV_LOG = "/home/z/my-project/dev.log"
PID_FILE = "/tmp/aurienta-dev-watchdog.pid"
MAX_RESTARTS = 10000
RESTART_DELAY = 2

# Kill any existing dev servers and old watchdogs
def cleanup_existing():
    for pattern in ["next dev", "next-server", "bun run dev", "dev-watchdog"]:
        subprocess.run(["pkill", "-9", "-f", pattern], capture_output=True)
    time.sleep(2)

def write_pid_file():
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))

def daemonize():
    """Double-fork to become a true daemon (survives parent shell exit)."""
    try:
        if os.fork() > 0:
            sys.exit(0)
    except OSError as e:
        sys.exit(1)
    os.chdir("/")
    os.setsid()
    os.umask(0)
    try:
        if os.fork() > 0:
            sys.exit(0)
    except OSError as e:
        sys.exit(1)
    # Redirect stdin/stdout/stderr to /dev/null
    sys.stdout.flush()
    sys.stderr.flush()
    with open("/dev/null", "r") as f:
        os.dup2(f.fileno(), 0)
    with open("/dev/null", "a+") as f:
        os.dup2(f.fileno(), 1)
        os.dup2(f.fileno(), 2)

def start_dev_server():
    """Start bun run dev with proper env loading."""
    env = os.environ.copy()
    # Load .env explicitly
    with open(f"{PROJECT_DIR}/.env") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    env["NODE_OPTIONS"] = "--max-old-space-size=2048"
    log_fd = open(DEV_LOG, "ab")
    proc = subprocess.Popen(
        ["bun", "run", "dev"],
        cwd=PROJECT_DIR,
        env=env,
        stdout=log_fd,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    return proc, log_fd

def main():
    cleanup_existing()
    daemonize()
    write_pid_file()
    restarts = 0
    while restarts < MAX_RESTARTS:
        ts = time.strftime("%Y-%m-%dT%H:%M:%S%z")
        with open(DEV_LOG, "ab") as f:
            f.write(f"\n[{ts}] === watchdog: starting dev (attempt {restarts+1}/{MAX_RESTARTS}) ===\n".encode())
        try:
            proc, log_fd = start_dev_server()
            rc = proc.wait()
            log_fd.close()
            ts = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            with open(DEV_LOG, "ab") as f:
                f.write(f"\n[{ts}] === watchdog: dev exited (rc={rc}) — restarting in {RESTART_DELAY}s ===\n".encode())
        except Exception as e:
            ts = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            with open(DEV_LOG, "ab") as f:
                f.write(f"\n[{ts}] === watchdog: error: {e} — restarting in {RESTART_DELAY}s ===\n".encode())
        time.sleep(RESTART_DELAY)
        restarts += 1

if __name__ == "__main__":
    main()

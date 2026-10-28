#!/usr/bin/env python3
"""B-API-STRESS: resume from where stress_v2.py left off."""
import json, time, sys, httpx, urllib.parse, subprocess
from pathlib import Path

# Import the helper functions from stress_v2.py
sys.path.insert(0, "/home/z/my-project/AUDIT/coo-audit/_b_stress")
from stress_v2 import start_dev_server, health_check, probe_with_retry, stress_endpoint, SAME_ORIGIN_HEADERS

BASE = "http://localhost:3000"
OUT_JSONL = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_results.jsonl")
INVENTORY_PATH = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json")
CHOSEN_PATH = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/chosen_30.json")

def main():
    inventory = json.loads(INVENTORY_PATH.read_text())
    chosen = json.loads(CHOSEN_PATH.read_text())
    by_path = {x["path"]: x for x in inventory}
    endpoints = [by_path[p] for p in chosen if p in by_path]

    # Read what's already done
    done = set()
    if OUT_JSONL.exists():
        for line in OUT_JSONL.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                done.add(r["path"])
    print(f"Already done: {len(done)} endpoints")
    todo = [ep for ep in endpoints if ep["path"] not in done]
    print(f"Remaining:    {len(todo)} endpoints")

    # Ensure dev server running
    state, _ = start_dev_server()
    print(f"Dev server: {state}", flush=True)
    client = httpx.Client(follow_redirects=False, trust_env=False, timeout=60.0)

    # Pre-warm each remaining endpoint
    print("\n=== Phase 1: pre-warm remaining ===", flush=True)
    for i, ep in enumerate(todo):
        if not health_check(client):
            print(f"  SERVER DOWN before prewarm of {ep['path']}", flush=True)
            start_dev_server()
            time.sleep(3)
        r = probe_with_retry(client, "GET" if "GET" in ep["methods"] else ep["methods"][0], ep["path"], headers=SAME_ORIGIN_HEADERS, timeout=120.0)
        print(f"  [{i+1}/{len(todo)}] prewarm {ep['path']:55s} -> {r.get('code')} ({r.get('ms')}ms)", flush=True)
        time.sleep(0.5)

    # Stress each remaining endpoint
    print("\n=== Phase 2: stress remaining ===", flush=True)
    for i, ep in enumerate(todo):
        if not health_check(client):
            print(f"  SERVER DOWN before stress of {ep['path']}", flush=True)
            start_dev_server()
            time.sleep(3)
        print(f"  [{i+1}/{len(todo)}] stress {ep['path']}", flush=True)
        r = stress_endpoint(ep, client)
        with OUT_JSONL.open("a") as f:
            f.write(json.dumps(r) + "\n")
        cases = r["cases"]
        codes = " ".join(f"{k[0]}={v.get('code','-') if isinstance(v,dict) else 'S'}" for k, v in cases.items())
        print(f"      {codes}", flush=True)
        time.sleep(0.5)

    print(f"\nDone. Results: {OUT_JSONL}", flush=True)

if __name__ == "__main__":
    main()

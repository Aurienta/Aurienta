#!/usr/bin/env python3
"""B-API-STRESS: stress harness v2 — robust against dev-server slowness.

Strategy:
1. Pre-warm each chosen endpoint by hitting it with a no-auth probe (90s timeout).
   This triggers webpack compilation so the actual stress matrix runs fast.
2. Run the 8-case stress matrix per endpoint with 45s timeout + 1 retry on
   conn failure. Skip endpoint entirely if pre-warm fails irrecoverably.
3. Restart dev server if it dies (health check fails).
"""
import json, time, sys, httpx, urllib.parse, subprocess, os
from pathlib import Path
from collections import defaultdict

BASE = "http://localhost:3000"
OUT_JSONL = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_results.jsonl")
INVENTORY_PATH = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json")
CHOSEN_PATH = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/chosen_30.json")
HEALTH_LOG = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/health_log.jsonl")

SAME_ORIGIN_HEADERS = {
    "Origin": BASE,
    "Referer": BASE + "/",
}

DEV_SERVER_CMD = ["bash", "-c", "cd /home/z/my-project && NODE_OPTIONS='--max-old-space-size=4096' ./node_modules/.bin/next dev --webpack -p 3000 > /tmp/next-dev.log 2>&1"]

def start_dev_server():
    """Start the dev server (if not already running). Returns Popen-like."""
    # Check if it's already up
    try:
        r = httpx.get(BASE + "/api/health", timeout=10)
        if r.status_code == 200:
            return ("already_running", None)
    except Exception:
        pass
    proc = subprocess.Popen(DEV_SERVER_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Wait for ready
    for _ in range(60):
        time.sleep(2)
        try:
            r = httpx.get(BASE + "/api/health", timeout=10)
            if r.status_code == 200:
                return ("started", proc)
        except Exception:
            pass
    return ("timeout", proc)

def health_check(client):
    try:
        r = client.get(BASE + "/api/health", timeout=15)
        return r.status_code == 200
    except Exception:
        return False

def probe(client: httpx.Client, method: str, path: str, *, headers=None, json_body=None,
          raw_body=None, content_type=None, timeout=45.0) -> dict:
    url = path if path.startswith("http") else BASE + path
    h = {"Host": "localhost:3000"}
    if headers:
        h.update(headers)
    if content_type:
        h["Content-Type"] = content_type
    started = time.time()
    try:
        if json_body is not None:
            r = client.request(method, url, headers=h, json=json_body, timeout=timeout)
        elif raw_body is not None:
            r = client.request(method, url, headers=h, content=raw_body, timeout=timeout)
        else:
            r = client.request(method, url, headers=h, timeout=timeout)
    except httpx.ReadTimeout:
        return {"code": 0, "status": "timeout", "ms": int((time.time()-started)*1000),
                "body": "", "err": "read_timeout"}
    except httpx.ConnectError as e:
        return {"code": 0, "status": "conn_err", "ms": int((time.time()-started)*1000),
                "body": "", "err": f"ConnectError: {e}"}
    except httpx.RemoteProtocolError as e:
        return {"code": 0, "status": "remote_proto", "ms": int((time.time()-started)*1000),
                "body": "", "err": f"RemoteProtocolError: {e}"}
    except Exception as e:
        return {"code": 0, "status": "exception", "ms": int((time.time()-started)*1000),
                "body": "", "err": f"{type(e).__name__}: {e}"}
    body = r.text or ""
    return {
        "code": r.status_code,
        "status": r.reason_phrase,
        "ms": int((time.time()-started)*1000),
        "body": body[:400].replace("\n", "\\n"),
        "err": "",
    }

def probe_with_retry(client, method, path, **kw):
    """Probe with one retry on connection failure; restart server if needed."""
    r = probe(client, method, path, **kw)
    if r.get("code") == 0 and r.get("status") in ("conn_err", "remote_proto"):
        # Server might be down — check health and restart if needed
        if not health_check(client):
            print("  [server down — restarting]", flush=True)
            start_dev_server()
            # Wait for warmup
            time.sleep(3)
        r = probe(client, method, path, **kw)
    return r

def prewarm(client, ep):
    """Hit the endpoint once to trigger webpack compilation."""
    path = ep["path"]
    methods = ep["methods"]
    probe_method = "GET" if "GET" in methods else (methods[0] if methods else "GET")
    return probe(client, probe_method, path, headers=SAME_ORIGIN_HEADERS, timeout=90.0)

def stress_endpoint(ep, client):
    path = ep["path"]
    methods = ep["methods"]
    result = {
        "path": path,
        "domain": ep["domain"],
        "methods_declared": methods,
        "auth_kind": ep["auth_kind"],
        "validation": ep["validation"],
        "cases": {},
    }

    body_method = None
    for m in ("POST", "PATCH", "PUT", "DELETE"):
        if m in methods:
            body_method = m
            break
    probe_method = body_method or (methods[0] if methods else "GET")

    # T1 — no auth
    result["cases"]["T1_no_auth"] = probe_with_retry(client, probe_method, path)
    # T2 — invalid auth
    result["cases"]["T2_invalid_auth"] = probe_with_retry(
        client, probe_method, path,
        headers={
            **SAME_ORIGIN_HEADERS,
            "Cookie": "aurienta_session=bogus; aurienta_csrf=bogus",
            "Authorization": "Bearer bogus-token-12345",
            "X-CSRF-Token": "bogus",
        }
    )

    if body_method:
        result["cases"]["T3_empty_body"] = probe_with_retry(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS, json_body={}
        )
        result["cases"]["T4_malformed_body"] = probe_with_retry(
            client, body_method, path,
            headers={**SAME_ORIGIN_HEADERS, "Content-Type": "application/json"},
            raw_body=b'{"this is not valid json'
        )
        result["cases"]["T5_wrong_ct"] = probe_with_retry(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS, content_type="text/plain",
            raw_body=b"this is plain text, not JSON"
        )
        big = {"x": "A" * 10000}
        result["cases"]["T6_huge_payload"] = probe_with_retry(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS, json_body=big
        )
    else:
        for c in ("T3_empty_body", "T4_malformed_body", "T5_wrong_ct", "T6_huge_payload"):
            result["cases"][c] = {"skipped": "GET-only endpoint"}

    if ep["path_params"]:
        param_name = ep["path_params"][0]
        sqli_val = urllib.parse.quote("' OR '1'='1", safe="")
        malicious_path = path.replace(f"[{param_name}]", sqli_val, 1)
        m_get = "GET" if "GET" in methods else (methods[0] if methods else "GET")
        result["cases"]["T7_sql_injection"] = probe_with_retry(client, m_get, malicious_path)
        traversal_val = urllib.parse.quote("../../../../etc/passwd", safe="")
        malicious_path = path.replace(f"[{param_name}]", traversal_val, 1)
        result["cases"]["T8_path_traversal"] = probe_with_retry(client, m_get, malicious_path)
    else:
        result["cases"]["T7_sql_injection"] = {"skipped": "no path param"}
        result["cases"]["T8_path_traversal"] = {"skipped": "no path param"}

    return result

def main():
    inventory = json.loads(INVENTORY_PATH.read_text())
    chosen = json.loads(CHOSEN_PATH.read_text())
    by_path = {x["path"]: x for x in inventory}
    endpoints = []
    for path in chosen:
        if path in by_path:
            endpoints.append(by_path[path])
        else:
            print(f"WARNING: chosen path not in inventory: {path}", file=sys.stderr)

    # Reset output
    OUT_JSONL.unlink(missing_ok=True)

    # Ensure dev server running
    state, _ = start_dev_server()
    print(f"Dev server: {state}", flush=True)

    client = httpx.Client(follow_redirects=False, trust_env=False, timeout=45.0)

    # Phase 1: pre-warm each endpoint
    print("\n=== Phase 1: pre-warm ===", flush=True)
    prewarm_results = []
    for i, ep in enumerate(endpoints):
        # health check first
        if not health_check(client):
            print(f"  [{i+1}/{len(endpoints)}] SERVER DOWN before prewarm of {ep['path']}", flush=True)
            start_dev_server()
            time.sleep(3)
        r = prewarm(client, ep)
        prewarm_results.append({"path": ep["path"], "prewarm": r})
        print(f"  [{i+1}/{len(endpoints)}] prewarm {ep['path']:55s} -> {r.get('code')} ({r.get('ms')}ms)", flush=True)
        time.sleep(0.3)

    # Phase 2: stress matrix
    print("\n=== Phase 2: stress matrix ===", flush=True)
    for i, ep in enumerate(endpoints):
        if not health_check(client):
            print(f"  SERVER DOWN before stress of {ep['path']}", flush=True)
            start_dev_server()
            time.sleep(3)
        print(f"  [{i+1}/{len(endpoints)}] stress {ep['path']}", flush=True)
        r = stress_endpoint(ep, client)
        with OUT_JSONL.open("a") as f:
            f.write(json.dumps(r) + "\n")
        # brief summary
        cases = r["cases"]
        codes = " ".join(f"{k[0]}={v.get('code','-') if isinstance(v,dict) else 'S'}" for k, v in cases.items())
        print(f"      {codes}", flush=True)
        time.sleep(0.2)

    print(f"\nDone. Results: {OUT_JSONL}", flush=True)

if __name__ == "__main__":
    main()

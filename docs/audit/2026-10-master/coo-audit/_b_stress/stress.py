#!/usr/bin/env python3
"""B-API-STRESS: stress harness.

Runs a 6-case stress matrix against each chosen endpoint, plus optional
SQL injection / path traversal probes for path-param endpoints.

Cases per endpoint (6):
  T1  no_auth           — bare request, no cookie, no Origin/Referer header.
  T2  invalid_auth      — bogus session cookie `aurienta_session=bogus` + bogus
                          Authorization header.
  T3  empty_body        — POST/PATCH with empty JSON `{}` body and a same-origin
                          Origin/Referer header so CSRF middleware allows it through
                          (otherwise we'd just be re-testing CSRF, not the route
                          handler's auth+validation).
  T4  malformed_body    — POST/PATCH with body `{"this is not valid json`
                          (truncated/invalid JSON).
  T5  wrong_ct          — POST with `Content-Type: text/plain` and a JSON-looking
                          body. Endpoint should reject (400) rather than parse.
  T6  huge_payload      — 10KB JSON body (a single key with a 10000-char string
                          value) — should be handled gracefully (400 from Zod or
                          the endpoint's own size check), not 500.

For path-param endpoints, also run:
  T7  sql_injection     — replace the path param with `' OR '1'='1` (URL-encoded).
  T8  path_traversal    — replace the path param with `..%2F..%2F..%2Fetc%2Fpasswd`.

All requests are read-only probes. No DELETE/PUT/PATCH that mutates is ever
called with a real-looking body — for mutating routes we only do the negative
cases (empty body, malformed body, wrong ct, huge payload) which the endpoint
is expected to reject.
"""
import json, time, sys, httpx, urllib.parse
from pathlib import Path

BASE = "http://localhost:3000"
OUT_JSON = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_results.jsonl")
OUT_SUMMARY = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_summary.json")

# Same-origin headers that satisfy the CSRF middleware without needing the
# CSRF cookie double-submit (matches `host` header so the proxy.ts check passes).
SAME_ORIGIN_HEADERS = {
    "Origin": BASE,
    "Referer": BASE + "/",
    "Host": "localhost:3000",
}

def probe(client: httpx.Client, method: str, path: str, *, headers=None, json_body=None,
          raw_body=None, content_type=None, timeout=30.0) -> dict:
    """Send a probe and capture the response summary."""
    url = path if path.startswith("http") else BASE + path
    h = {"Host": "localhost:3000"}
    if headers:
        h.update(headers)
    if content_type:
        h["Content-Type"] = content_type
    try:
        if json_body is not None:
            r = client.request(method, url, headers=h, json=json_body, timeout=timeout)
        elif raw_body is not None:
            r = client.request(method, url, headers=h, content=raw_body, timeout=timeout)
        else:
            r = client.request(method, url, headers=h, timeout=timeout)
    except httpx.ReadTimeout:
        return {"code": 0, "status": "timeout", "ms": int(timeout*1000), "body": "",
                "err": "read_timeout"}
    except Exception as e:
        return {"code": 0, "status": "exception", "ms": 0, "body": "",
                "err": f"{type(e).__name__}: {e}"}
    body = r.text or ""
    return {
        "code": r.status_code,
        "status": r.reason_phrase,
        "ms": int(r.elapsed.total_seconds()*1000) if r.elapsed else 0,
        "body": body[:400].replace("\n", "\\n"),
        "err": "",
    }

def stress_endpoint(ep: dict, client: httpx.Client) -> dict:
    """Run the full stress matrix on one endpoint. ep = inventory item."""
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

    # Pick the method to use for stress tests.
    # Prefer POST (most common mutating verb) for body tests; otherwise PATCH.
    body_method = None
    for m in ("POST", "PATCH", "PUT", "DELETE"):
        if m in methods:
            body_method = m
            break
    # If no body method, use GET for all cases.
    probe_method = body_method or (methods[0] if methods else "GET")

    # T1 — no auth
    result["cases"]["T1_no_auth"] = probe(client, probe_method, path)

    # T2 — invalid auth (bogus session cookie + bogus bearer)
    result["cases"]["T2_invalid_auth"] = probe(
        client, probe_method, path,
        headers={
            **SAME_ORIGIN_HEADERS,
            "Cookie": "aurienta_session=bogus; aurienta_csrf=bogus",
            "Authorization": "Bearer bogus-token-12345",
            "X-CSRF-Token": "bogus",
        }
    )

    # T3 — empty body (only if there's a body method)
    if body_method:
        result["cases"]["T3_empty_body"] = probe(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS,
            json_body={}
        )
    else:
        result["cases"]["T3_empty_body"] = {"skipped": "GET-only endpoint"}

    # T4 — malformed body (raw bytes — invalid JSON)
    if body_method:
        result["cases"]["T4_malformed_body"] = probe(
            client, body_method, path,
            headers={**SAME_ORIGIN_HEADERS, "Content-Type": "application/json"},
            raw_body=b'{"this is not valid json'
        )
    else:
        result["cases"]["T4_malformed_body"] = {"skipped": "GET-only endpoint"}

    # T5 — wrong content-type (text/plain)
    if body_method:
        result["cases"]["T5_wrong_ct"] = probe(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS,
            content_type="text/plain",
            raw_body=b"this is plain text, not JSON"
        )
    else:
        result["cases"]["T5_wrong_ct"] = {"skipped": "GET-only endpoint"}

    # T6 — huge payload (10KB)
    if body_method:
        big = {"x": "A" * 10000}
        result["cases"]["T6_huge_payload"] = probe(
            client, body_method, path,
            headers=SAME_ORIGIN_HEADERS,
            json_body=big
        )
    else:
        result["cases"]["T6_huge_payload"] = {"skipped": "GET-only endpoint"}

    # T7 — SQL injection in path param (only if path has params)
    if ep["path_params"]:
        # Use first path param name, replace [param] with our malicious value
        param_name = ep["path_params"][0]
        # URL-encode the injection string
        sqli_val = urllib.parse.quote("' OR '1'='1", safe="")
        # Replace the FIRST [param] occurrence with the sqli value
        malicious_path = path.replace(f"[{param_name}]", sqli_val, 1)
        # Use GET if available (path-param injection usually tested via GET)
        m_get = "GET" if "GET" in methods else (methods[0] if methods else "GET")
        result["cases"]["T7_sql_injection"] = probe(client, m_get, malicious_path)
    else:
        result["cases"]["T7_sql_injection"] = {"skipped": "no path param"}

    # T8 — path traversal in path param
    if ep["path_params"]:
        param_name = ep["path_params"][0]
        # URL-encoded ../../../etc/passwd
        traversal_val = urllib.parse.quote("../../../../etc/passwd", safe="")
        malicious_path = path.replace(f"[{param_name}]", traversal_val, 1)
        m_get = "GET" if "GET" in methods else (methods[0] if methods else "GET")
        result["cases"]["T8_path_traversal"] = probe(client, m_get, malicious_path)
    else:
        result["cases"]["T8_path_traversal"] = {"skipped": "no path param"}

    return result

def main():
    inventory = json.loads(Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json").read_text())
    # Load the chosen representative endpoints
    chosen_path = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/chosen_30.json")
    chosen = json.loads(chosen_path.read_text())

    by_path = {x["path"]: x for x in inventory}
    endpoints = []
    for path in chosen:
        if path in by_path:
            endpoints.append(by_path[path])
        else:
            print(f"WARNING: chosen path not in inventory: {path}", file=sys.stderr)

    print(f"Stressing {len(endpoints)} endpoints x 8 cases = {len(endpoints)*8} probes")

    OUT_JSON.unlink(missing_ok=True)

    # Use a single client with persistent cookie jar so CSRF cookie persists
    client = httpx.Client(follow_redirects=False, trust_env=False)

    results = []
    for i, ep in enumerate(endpoints):
        print(f"[{i+1}/{len(endpoints)}] {ep['path']}")
        r = stress_endpoint(ep, client)
        results.append(r)
        with OUT_JSON.open("a") as f:
            f.write(json.dumps(r) + "\n")

    OUT_SUMMARY.write_text(json.dumps(results, indent=2))
    print(f"\nDone. Results: {OUT_JSON}")
    print(f"Summary: {OUT_SUMMARY}")

    # Quick verdict: % passing
    total_cases = 0
    expected_pass = 0
    for r in results:
        for k, v in r["cases"].items():
            if isinstance(v, dict) and "skipped" in v:
                continue
            total_cases += 1
            code = v.get("code", 0)
            # Expected: NOT 200 (no auth, bad input) and NOT 5xx crash, and not 0 (hang)
            if code in (400, 401, 403, 404, 405):
                expected_pass += 1
            elif code in (501, 503):
                expected_pass += 1  # fail-closed config errors are acceptable
            elif code == 200:
                # Some endpoints are public-by-design — accept 200 for those
                # We'll handle this in detailed analysis
                pass
    print(f"Quick verdict: {expected_pass}/{total_cases} = {100*expected_pass/total_cases:.1f}% pass (4xx/5xx, not hang)")

if __name__ == "__main__":
    main()

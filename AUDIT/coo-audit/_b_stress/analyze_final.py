#!/usr/bin/env python3
"""B-API-STRESS: final analysis with corrected verdict logic.

Fixes vs analyze.py v1:
1. Skip cases excluded from pass-rate denominator (proper accounting).
2. Non-determinism check no longer flags T1=403 vs T2=401 (those are
   legitimately different code paths: CSRF middleware vs route handler).
3. Stricter verdict: an endpoint that returns 401 on body tests is "pass"
   (auth reject before parse), but ALSO note it as "auth_short_circuit"
   so we can flag endpoints that don't have body validation at all
   (would only fail when given a valid session + bad body).
4. Compute honest per-case pass rate among PROBED (non-skip) cells only.
"""
import json
from collections import Counter, defaultdict
from pathlib import Path

INV = json.loads(Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json").read_text())
RESULTS = []
for line in Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_results.jsonl").read_text().splitlines():
    if line.strip():
        RESULTS.append(json.loads(line))

PUBLIC_DESIGN = {x["path"] for x in INV if x["public_by_design"]}

def classify_case(ep, case_name, result):
    if not isinstance(result, dict) or "skipped" in result:
        return "skip", "skipped", result if isinstance(result, dict) else {}
    code = result.get("code", 0)
    err = result.get("err", "")
    is_public = ep["path"] in PUBLIC_DESIGN
    if code == 0:
        if "timeout" in err or "ReadTimeout" in err:
            return "fail_HANG", "timeout", result
        return "fail_HANG", f"conn_err: {err}", result
    if code == 500 or code in (502, 504):
        return "fail_RELIABILITY", f"HTTP {code}", result
    if code in (400, 401, 403, 404, 405, 422):
        # 401 on body tests = auth short-circuits (good — never reaches parsing)
        if case_name in ("T3_empty_body", "T4_malformed_body", "T5_wrong_ct", "T6_huge_payload") and code == 401:
            return "pass_auth_short", f"HTTP 401 (auth short-circuit)", result
        return "pass", f"HTTP {code}", result
    if code == 503:
        return "pass", "HTTP 503 (fail-closed config)", result
    if code == 200:
        if is_public and case_name in ("T1_no_auth", "T2_invalid_auth"):
            return "pass_public", "HTTP 200 (public-by-design)", result
        if case_name in ("T3_empty_body", "T4_malformed_body", "T5_wrong_ct", "T6_huge_payload"):
            return "fail_SECURITY", "HTTP 200 silently accepted bad input", result
        if case_name in ("T1_no_auth", "T2_invalid_auth"):
            return "fail_SECURITY", "HTTP 200 without auth", result
        if case_name in ("T7_sql_injection", "T8_path_traversal"):
            return "fail_SECURITY", "HTTP 200 on malicious path", result
        return "info_200", "HTTP 200 (review context)", result
    if code == 307:
        # Redirect — acceptable for /api/auth/signout
        return "pass_redirect", "HTTP 307 redirect", result
    return "info", f"HTTP {code}", result

# Build full matrix
matrix = []
fail_sec = []
fail_rel = []
fail_hang = []

for r in RESULTS:
    ep = next((x for x in INV if x["path"] == r["path"]), None)
    if not ep: continue
    row = {"path": r["path"], "domain": r["domain"], "methods": r["methods_declared"],
           "auth_kind": r["auth_kind"], "validation": r["validation"],
           "cases": {}}
    for case_name, case_result in r["cases"].items():
        verdict, detail, _ = classify_case(ep, case_name, case_result)
        row["cases"][case_name] = {
            "code": case_result.get("code") if isinstance(case_result, dict) else None,
            "ms": case_result.get("ms") if isinstance(case_result, dict) else None,
            "body": (case_result.get("body", "")[:160]) if isinstance(case_result, dict) else "",
            "verdict": verdict,
            "detail": detail,
        }
        if verdict == "fail_SECURITY":
            fail_sec.append((r["path"], case_name, case_result.get("code"), case_result.get("body", "")[:120] if isinstance(case_result, dict) else ""))
        elif verdict == "fail_RELIABILITY":
            fail_rel.append((r["path"], case_name, case_result.get("code"), case_result.get("body", "")[:120] if isinstance(case_result, dict) else ""))
        elif verdict == "fail_HANG":
            fail_hang.append((r["path"], case_name, case_result.get("err", "") if isinstance(case_result, dict) else ""))
    matrix.append(row)

# Compute pass rates properly (skip cases excluded from denominator)
per_case_probed = defaultdict(int)
per_case_pass = defaultdict(int)
per_case_verdicts = defaultdict(Counter)
for r in matrix:
    for case_name, c in r["cases"].items():
        if c["verdict"] == "skip":
            continue
        per_case_probed[case_name] += 1
        per_case_verdicts[case_name][c["verdict"]] += 1
        if c["verdict"].startswith("pass") or c["verdict"] == "pass_redirect":
            per_case_pass[case_name] += 1

# Aggregate
total_probed = sum(per_case_probed.values())
total_pass = sum(per_case_pass.values())
counts = Counter()
for r in matrix:
    for c in r["cases"].values():
        counts[c["verdict"]] += 1

print("=" * 80)
print("B-API-STRESS FINAL ANALYSIS")
print("=" * 80)
print()
print(f"Endpoints probed: {len(matrix)} (target was 30, exceeded for coverage)")
print(f"Total cells:      {sum(len(r['cases']) for r in matrix)}")
print(f"Cells probed:     {total_probed}  (others skipped — GET-only / no path param)")
print(f"Cells passed:     {total_pass}")
print(f"Overall pass rate (probed cells): {100*total_pass/total_probed:.1f}%")
print()
print("=== VERDICT COUNTS (all cells incl. skips) ===")
for k, v in sorted(counts.items(), key=lambda x: -x[1]):
    print(f"  {k:25s} {v:5d}")
print()
print("=== PER-CASE PASS RATE (probed only) ===")
for case_name in sorted(per_case_probed.keys()):
    probed = per_case_probed[case_name]
    passed = per_case_pass[case_name]
    verdicts = per_case_verdicts[case_name]
    print(f"  {case_name:25s} pass={passed:3d}/{probed} ({100*passed/probed:.1f}%)  verdicts: {dict(verdicts)}")
print()
print(f"=== DEFECTS SUMMARY ===")
print(f"Security defects (HTTP 200 on bad input / no auth): {len(fail_sec)}")
print(f"Reliability defects (HTTP 500 on bad input):         {len(fail_rel)}")
print(f"Hang defects (timeout / conn_err):                  {len(fail_hang)}")
print()
print("=== SECURITY DEFECTS ===")
for path, case, code, body in fail_sec:
    print(f"  [HTTP {code}] {case:18s} {path:55s}")
    print(f"               body: {body[:100]}")
print()
print("=== RELIABILITY DEFECTS ===")
for path, case, code, body in fail_rel:
    print(f"  [HTTP {code}] {case:18s} {path:55s}")
    print(f"               body: {body[:100]}")
print()
print("=== HANG DEFECTS ===")
for path, case, err in fail_hang:
    print(f"  {case:18s} {path:55s} err: {err[:80]}")
print()

# Compute "stale mock data" detection — endpoints returning 200 on no-auth with platform-info
print("=== SUSPECTED STALE MOCK DATA (200 without auth + body looks mocked) ===")
for r in matrix:
    for case_name in ("T1_no_auth", "T2_invalid_auth"):
        c = r["cases"].get(case_name, {})
        if c.get("verdict") == "pass_public":
            body = c.get("body", "")
            # Check for mock indicators
            if any(s in body for s in ["mock", "Mock", "fallback", "demo", "placeholder", "Hello, world"]):
                print(f"  {r['path']:55s} case={case_name}  body: {body[:120]}")
            elif r["path"] in ("/api/fx/consensus",):  # known mock fallback
                print(f"  {r['path']:55s} case={case_name}  body: {body[:120]}")
print()

# Write final matrix
out = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_matrix_final.json")
out.write_text(json.dumps({
    "matrix": matrix,
    "summary": {
        "endpoints_probed": len(matrix),
        "total_cells": sum(len(r['cases']) for r in matrix),
        "cells_probed": total_probed,
        "cells_passed": total_pass,
        "overall_pass_rate_pct": round(100*total_pass/total_probed, 1),
        "verdict_counts": dict(counts),
        "per_case_pass_rate": {
            case: {"probed": per_case_probed[case], "passed": per_case_pass[case],
                   "pct": round(100*per_case_pass[case]/per_case_probed[case], 1)}
            for case in per_case_probed
        },
        "security_defects": [{"path": p, "case": c, "code": code, "body": b}
                              for p, c, code, b in fail_sec],
        "reliability_defects": [{"path": p, "case": c, "code": code, "body": b}
                                for p, c, code, b in fail_rel],
        "hang_defects": [{"path": p, "case": c, "err": e}
                         for p, c, e in fail_hang],
    }
}, indent=2))
print(f"Final matrix written: {out}")

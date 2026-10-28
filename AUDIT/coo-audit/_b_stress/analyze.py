#!/usr/bin/env python3
"""B-API-STRESS: analyze the JSONL stress results.

Compute, per case, the pass/fail/skip with proper per-endpoint policy:
- public-by-design GET endpoints: T1/T2 may legitimately return 200.
- public-by-design POST endpoints (auth/signin, register, oracle/consensus, etc.):
  T1 may legitimately return 200/400, T2 should reject if the bogus auth doesn't
  grant access (usually 401/403/400).
- protected endpoints: T1/T2 MUST be 4xx/5xx (no 200).
- Body tests (T3-T6): for mutating endpoints, expected 400 (validation) or 401
  (auth) — NOT 200 (silent accept) and NOT 500 (unhandled crash).
- T7/T8: expected 400/404 (Prisma safe — never 500 or SQL data leak).
"""
import json, sys
from collections import Counter, defaultdict
from pathlib import Path

INV = json.loads(Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/inventory.json").read_text())
RESULTS = []
for line in Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_results.jsonl").read_text().splitlines():
    if line.strip():
        RESULTS.append(json.loads(line))

PUBLIC_DESIGN = {x["path"] for x in INV if x["public_by_design"]}

def classify_case(ep, case_name, result):
    """Return one of: pass, fail_SECURITY, fail_RELIABILITY, fail_HANG, fail_NONDET, skip, info_200_public."""
    if not isinstance(result, dict) or "skipped" in result:
        return "skip", result.get("skipped", "?") if isinstance(result, dict) else "?"
    code = result.get("code", 0)
    err = result.get("err", "")
    is_public = ep["path"] in PUBLIC_DESIGN
    # Hang / connection failure
    if code == 0:
        if "timeout" in err or "ReadTimeout" in err:
            return "fail_HANG", f"timeout"
        return "fail_HANG", f"conn_err: {err}"
    # 500+ on negative input = reliability defect (or auth-bypass leak via 500)
    if code == 500:
        return "fail_RELIABILITY", f"HTTP 500 on {case_name}"
    if code == 502 or code == 504:
        return "fail_RELIABILITY", f"HTTP {code} on {case_name}"
    # 4xx is expected for negative inputs
    if code in (400, 401, 403, 404, 405, 422):
        return "pass", f"HTTP {code}"
    if code == 503:
        # 503 = config error (cron secret unset). Acceptable as fail-closed.
        return "pass", "HTTP 503 (fail-closed config error)"
    if code == 200:
        # 200 is acceptable for public-by-design on auth-skip tests only
        if is_public and case_name in ("T1_no_auth", "T2_invalid_auth"):
            return "info_200_public", "HTTP 200 public-by-design"
        # 200 on a body test = silent accept of bad input = security/reliability defect
        if case_name in ("T3_empty_body", "T4_malformed_body", "T5_wrong_ct", "T6_huge_payload"):
            return "fail_SECURITY", f"HTTP 200 silently accepted bad input"
        # 200 on no_auth for a protected endpoint = security defect
        if case_name in ("T1_no_auth", "T2_invalid_auth"):
            return "fail_SECURITY", f"HTTP 200 returned without auth"
        # 200 on path traversal / sqli = leak
        if case_name in ("T7_sql_injection", "T8_path_traversal"):
            return "fail_SECURITY", f"HTTP 200 on malicious path param"
        return "info_200_public", "HTTP 200 (review context)"
    return "info", f"HTTP {code}"

# Build full matrix
matrix = []
fail_sec = []
fail_rel = []
fail_hang = []
nondet = []

# Group by path for non-determinism check
by_path_cases = defaultdict(list)  # path -> list of (case, code)

for r in RESULTS:
    ep = next((x for x in INV if x["path"] == r["path"]), None)
    if not ep:
        continue
    row = {"path": r["path"], "domain": r["domain"], "methods": r["methods_declared"],
           "auth_kind": r["auth_kind"], "validation": r["validation"],
           "cases": {}}
    for case_name, case_result in r["cases"].items():
        verdict, detail = classify_case(ep, case_name, case_result)
        row["cases"][case_name] = {
            "code": case_result.get("code") if isinstance(case_result, dict) else None,
            "ms": case_result.get("ms") if isinstance(case_result, dict) else None,
            "body": (case_result.get("body", "")[:160]) if isinstance(case_result, dict) else "",
            "verdict": verdict,
            "detail": detail,
        }
        if verdict == "fail_SECURITY":
            fail_sec.append((r["path"], case_name, case_result.get("code"), case_result.get("body", "")[:120]))
        elif verdict == "fail_RELIABILITY":
            fail_rel.append((r["path"], case_name, case_result.get("code"), case_result.get("body", "")[:120]))
        elif verdict == "fail_HANG":
            fail_hang.append((r["path"], case_name, case_result.get("err", "")))
        by_path_cases[(r["path"], case_name)].append(case_result.get("code") if isinstance(case_result, dict) else 0)
    matrix.append(row)

# Non-determinism: same case called once per endpoint, so can't detect within
# the run. But: T1 and T2 are both "no auth" variants; if they return different
# codes for the same endpoint, that's a non-determinism signal.
nondet_count = 0
for r in RESULTS:
    t1 = r["cases"].get("T1_no_auth", {})
    t2 = r["cases"].get("T2_invalid_auth", {})
    if isinstance(t1, dict) and isinstance(t2, dict):
        if t1.get("code") != t2.get("code") and t1.get("code") and t2.get("code"):
            nondet.append((r["path"], t1.get("code"), t2.get("code")))
            nondet_count += 1

# Aggregate stats
total_cells = sum(len(r["cases"]) for r in matrix)
counts = Counter()
for r in matrix:
    for c in r["cases"].values():
        counts[c["verdict"]] += 1
print("=== VERDICT COUNTS ===")
for k, v in sorted(counts.items(), key=lambda x: -x[1]):
    pct = 100*v/total_cells if total_cells else 0
    print(f"  {k:25s} {v:5d}  ({pct:.1f}%)")
print(f"  TOTAL:                  {total_cells}")
print()
print(f"=== DEFECTS ===")
print(f"Security defects (HTTP 200 on bad input / no auth): {len(fail_sec)}")
print(f"Reliability defects (HTTP 500/502/504 on bad input): {len(fail_rel)}")
print(f"Hang defects (timeout / conn_err):                  {len(fail_hang)}")
print(f"Non-determinism (T1 vs T2 diverge):                 {nondet_count}")
print()
print("=== SECURITY DEFECTS (first 30) ===")
for path, case, code, body in fail_sec[:30]:
    print(f"  [{code}] {case:18s} {path:55s} body: {body[:80]}")
print()
print("=== RELIABILITY DEFECTS (first 30) ===")
for path, case, code, body in fail_rel[:30]:
    print(f"  [{code}] {case:18s} {path:55s} body: {body[:80]}")
print()
print("=== HANG DEFECTS (first 30) ===")
for path, case, err in fail_hang[:30]:
    print(f"  {case:18s} {path:55s} err: {err[:80]}")
print()
print("=== NON-DETERMINISM ===")
for path, c1, c2 in nondet[:20]:
    print(f"  {path:55s} T1={c1}  T2={c2}")
print()

# Per-case pass rate
print("=== PER-CASE PASS RATE ===")
per_case = defaultdict(lambda: Counter())
for r in matrix:
    for case_name, c in r["cases"].items():
        per_case[case_name][c["verdict"]] += 1
for case_name in sorted(per_case.keys()):
    c = per_case[case_name]
    total = sum(c.values())
    passed = c.get("pass", 0) + c.get("info_200_public", 0)
    print(f"  {case_name:25s} pass={passed:3d}/{total} ({100*passed/total:.1f}%)  fails: sec={c.get('fail_SECURITY',0)} rel={c.get('fail_RELIABILITY',0)} hang={c.get('fail_HANG',0)}")

# Write full matrix
out = Path("/home/z/my-project/AUDIT/coo-audit/_b_stress/stress_matrix.json")
out.write_text(json.dumps({
    "matrix": matrix,
    "summary": {
        "total_cells": total_cells,
        "verdict_counts": dict(counts),
        "security_defects": fail_sec,
        "reliability_defects": fail_rel,
        "hang_defects": fail_hang,
        "nondeterminism": nondet,
    }
}, indent=2))
print(f"\nFull matrix: {out}")

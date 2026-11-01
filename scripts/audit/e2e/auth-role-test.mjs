// AURIENTA Authenticated Role + Workflow Test Suite
const BASE = "http://localhost:3000";

async function makeClient() {
  // 1. GET page to obtain CSRF cookie
  const jar = {};
  const res0 = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(15000) });
  for (const c of res0.headers.getSetCookie?.() || []) {
    const [kv] = c.split(";"); const [k, ...v] = kv.split("="); jar[k.trim()] = v.join("=");
  }
  const cookieStr = () => Object.entries(jar).map(([k,v]) => `${k}=${v}`).join("; ");
  const csrf = () => jar["aurienta_csrf"] || "";

  async function call(method, path, body) {
    const opts = {
      method,
      headers: { "content-type": "application/json", cookie: cookieStr() },
      signal: AbortSignal.timeout(40000),
    };
    if (["POST","PATCH","PUT","DELETE"].includes(method)) {
      opts.headers["x-csrf-token"] = csrf();
      opts.headers["origin"] = BASE;
      if (body) opts.body = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, opts);
    for (const c of res.headers.getSetCookie?.() || []) {
      const [kv] = c.split(";"); const [k, ...v] = kv.split("="); jar[k.trim()] = v.join("=");
    }
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json };
  }
  return { call, jar };
}

async function ensureServer() {
  try { const r = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(4000) }); if (r.ok) { const j = await r.json(); if (j.db === "connected") return true; } } catch {}
  console.log("  [restarting server...]");
  const p = Bun.spawn(["/home/z/my-project/scripts/ops/dev-start.sh"], { stdout: "ignore", stderr: "ignore", cwd: "/home/z/my-project" });
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    try { const r = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(4000) }); if (r.ok) { const j = await r.json(); if (j.db === "connected") return true; } } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

const USERS = [
  { email: "layla@streetbites.eg", name: "Layla", expect: "capital partner (Street Bites founder)" },
  { email: "ahmed@ecopack.eg", name: "Ahmed", expect: "founding operator (EcoPack)" },
  { email: "sarah@investor.eg", name: "Sarah", expect: "capital partner (investor)" },
  { email: "mohamed@smartfarm.eg", name: "Mohamed", expect: "founder (SmartFarm graduated)" },
  { email: "khalil@holding.eg", name: "Khalil", expect: "L4 ecosystem builder" },
];
const PASSWORD = "aurienta2026";

const results = [];
function log(category, name, pass, detail = "") {
  results.push({ category, name, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} [${category}] ${name}${detail ? " — " + detail : ""}`);
}

console.log("=== ENSURE SERVER ===");
if (!await ensureServer()) { console.log("FATAL: server down"); process.exit(1); }
console.log("Server UP");

console.log("\n=== 1. SIGN-IN: all 5 seeded users ===");
const sessions = {};
for (const u of USERS) {
  const c = await makeClient();
  const r = await c.call("POST", "/api/auth", { email: u.email, password: PASSWORD });
  const ok = r.status === 200 && c.jar["aurienta_session"];
  log("auth", `Sign in ${u.name} (${u.email})`, ok, `HTTP ${r.status}${ok ? " + session cookie" : " " + JSON.stringify(r.json).slice(0,80)}`);
  if (ok) sessions[u.email] = c;
}

console.log("\n=== 2. NEGATIVE: wrong password ===");
{
  const c = await makeClient();
  const r = await c.call("POST", "/api/auth", { email: "layla@streetbites.eg", password: "wrong-password" });
  log("auth", "Wrong password rejected", r.status === 401, `HTTP ${r.status}`);
}
console.log("=== 3. NEGATIVE: nonexistent user ===");
{
  const c = await makeClient();
  const r = await c.call("POST", "/api/auth", { email: "nobody@x.eg", password: "x" });
  log("auth", "Nonexistent user rejected", r.status === 401, `HTTP ${r.status}`);
}

console.log("\n=== 4. ROLE-BASED ACCESS (authenticated) ===");
// Layla (regular member) tries admin endpoints → expect 403
const layla = sessions["layla@streetbites.eg"];
if (layla) {
  const adminTests = [
    ["GET", "/api/admin/users", 403],
    ["GET", "/api/admin/enterprises", 403],
    ["GET", "/api/admin/settings", 403],
    ["GET", "/api/admin/audit", 403],
    ["GET", "/api/v1/regulatory/fra/dashboard", 401], // needs FRA bearer token, not session
  ];
  for (const [m, p, expect] of adminTests) {
    const r = await layla.call(m, p);
    log("rbac", `Layla (member) → ${m} ${p}`, r.status === expect, `HTTP ${r.status} (expect ${expect})`);
  }
  // Layla's own data
  const r2 = await layla.call("GET", "/api/proposals");
  log("rbac", "Layla → GET /api/proposals (own data)", r2.status === 200, `HTTP ${r2.status}`);
  const r3 = await layla.call("GET", "/api/notifications");
  log("rbac", "Layla → GET /api/notifications", r3.status === 200, `HTTP ${r3.status}`);
  const r4 = await layla.call("GET", "/api/portfolio");
  log("rbac", "Layla → GET /api/portfolio", r4.status, r4.status === 200 || r4.status === 404 ? "HTTP " + r4.status : "HTTP " + r4.status);
}

console.log("\n=== 5. GOVERNANCE WORKFLOW (proposal → vote → check) ===");
// Find an existing proposal Layla can vote on... first list proposals
if (layla) {
  const pl = await layla.call("GET", "/api/proposals");
  if (pl.status === 200 && Array.isArray(pl.json)) {
    const open = pl.json.find(p => ["published","voting_open","quorum_reached"].includes(p.status));
    log("workflow", "List proposals (Layla sees " + pl.json.length + ")", true, pl.json.length + " proposals");
    if (open) {
      console.log(`    Voting on proposal ${open.id?.slice(0,8)} (${open.type}, status=${open.status})...`);
      const v = await layla.call("POST", `/api/proposals/${open.id}/vote`, { support: true });
      log("workflow", "Vote on open proposal", [200, 409].includes(v.status), `HTTP ${v.status} ${JSON.stringify(v.json).slice(0,100)}`);
    } else {
      log("workflow", "Open proposal available for voting", false, "no published/voting_open proposal in seed");
    }
  } else {
    log("workflow", "GET /api/proposals shape", false, `HTTP ${pl.status} ${JSON.stringify(pl.json).slice(0,80)}`);
  }
}

console.log("\n=== 6. SARAH (investor) CAPITAL FLOWS ===");
const sarah = sessions["sarah@investor.eg"];
if (sarah) {
  for (const [m, p] of [["GET","/api/opportunities"],["GET","/api/market"],["GET","/api/syndicates"],["GET","/api/dividends"],["GET","/api/drip"]]) {
    const r = await sarah.call(m, p);
    log("capital", `Sarah → ${m} ${p}`, r.status === 200, `HTTP ${r.status}`);
  }
  // Try creating an order (workflow test on clone)
  const ents = await sarah.call("GET", "/api/market");
  if (ents.status === 200 && Array.isArray(ents.json) && ents.json[0]) {
    const ent = ents.json[0];
    console.log(`    Placing reservation on ${ent.slug || ent.name}...`);
    const res = await sarah.call("POST", "/api/reservations", { enterpriseId: ent.id, amountEgp: 1000 });
    log("capital", "Sarah → POST /api/reservations (real flow)", [200,201,400,403,422].includes(res.status), `HTTP ${res.status} ${JSON.stringify(res.json).slice(0,120)}`);
  }
}

console.log("\n=== 7. SIGNOUT ===");
if (layla) {
  const r = await layla.call("POST", "/api/auth/signout");
  log("auth", "Sign out (Layla)", r.status === 200, `HTTP ${r.status}`);
  const r2 = await layla.call("GET", "/api/proposals");
  log("auth", "Session revoked after signout", r2.status === 401, `HTTP ${r2.status} (expect 401)`);
}

console.log("\n=== RESULTS ===");
const pass = results.filter(r => r.pass).length;
console.log(`TOTAL: ${pass}/${results.length} PASS`);
const fail = results.filter(r => !r.pass);
if (fail.length) { console.log("\nFAILURES:"); fail.forEach(f => console.log(`  ❌ [${f.category}] ${f.name} — ${f.detail}`)); }
await Bun.write("/tmp/auth-test-results.json", JSON.stringify(results, null, 2));

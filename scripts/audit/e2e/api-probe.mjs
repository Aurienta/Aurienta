// AURIENTA API Probe — batch mode: spawns dev server, probes N routes, exits
import { readdirSync, statSync, readFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";

const API_ROOT = "/home/z/my-project/src/app/api";
const BASE = "http://localhost:3000";
const OUT = "/tmp/api-probe-results.jsonl";
const BATCH = parseInt(process.env.BATCH || "60");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === "route.ts") {
      const src = readFileSync(p, "utf8");
      const methods = [...src.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\(/g)].map(m => m[1]);
      out.push({ path: p.replace(API_ROOT, "").replace("/route.ts", ""), methods, file: p });
    }
  }
  return out;
}
const routes = walk(API_ROOT);

const SUBS = { "[id]":"test-id-000","[slug]":"street-bites","[enterpriseId]":"ent-known","[matchId]":"m1","[distributionId]":"d1","[agreementId]":"a1","[allocationId]":"al1","[claimId]":"c1","[caseId]":"cs1","[proposalId]":"p1","[endorsementId]":"e1","[transactionId]":"t1","[inventoryId]":"i1","[orderId]":"o1","[poId]":"po1","[checkId]":"ck1","[taskId]":"tk1","[projectId]":"pj1","[resourceId]":"r1","[timesheetId]":"ts1","[assetId]":"as1","[advanceId]":"av1","[bondId]":"b1","[cid]":"bafytest","[userId]":"u1" };
const resolvePath = p => { let o = p; for (const [k,v] of Object.entries(SUBS)) o = o.split(k).join(v); return o; };

// ── Server lifecycle (child process) ──
let server = null;
async function startServer() {
  server = Bun.spawn(["/home/z/my-project/scripts/ops/dev-start.sh"], { stdout: "ignore", stderr: "ignore", cwd: "/home/z/my-project" });
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    try { const r = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(4000) }); if (r.ok || r.status === 503) { const j = await r.json().catch(()=>({})); if (j.db === "connected") return true; } } catch {}
    if (server.exitStatus !== null) { server = Bun.spawn(["/home/z/my-project/scripts/ops/dev-start.sh"], { stdout: "ignore", stderr: "ignore", cwd: "/home/z/my-project" }); }
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}
async function ensureServer() {
  try { const r = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(4000) }); if (r.ok) { const j = await r.json().catch(()=>({})); if (j.db === "connected") return true; } } catch {}
  return startServer();
}

async function probe(method, url) {
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    try {
      const opts = { method, headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(40000) };
      if (["POST","PUT","PATCH"].includes(method)) opts.body = JSON.stringify({ __audit_probe__: true });
      const res = await fetch(BASE + url, opts);
      let body = ""; try { body = JSON.stringify(await res.json()).slice(0, 200); } catch { body = "(non-json)"; }
      return { status: res.status, ms: Date.now() - t0, body };
    } catch (e) {
      if (i < 2) { await ensureServer(); continue; }
      return { status: 0, ms: Date.now() - t0, body: e.name === "TimeoutError" ? "TIMEOUT" : e.message.slice(0, 90) };
    }
  }
}

// resume
let done = new Set();
try { for (const l of readFileSync(OUT, "utf8").split("\n").filter(Boolean)) { try { const j = JSON.parse(l); done.add(j.method + " " + j.route); } catch {} } } catch {}
console.log(`Routes: ${routes.length} | already done: ${done.size} | batch: ${BATCH}`);

const up = await ensureServer();
console.log("Server:", up ? "UP" : "FAILED");
if (!up) process.exit(1);


let n = 0;
for (const r of routes) {
  if (n >= BATCH) break;
  const primary = r.methods.find(m => m !== "OPTIONS") || "GET";
  const url = "/api" + resolvePath(r.path);
  if (done.has(primary + " " + url)) continue;
  const res = await probe(primary, url);
  appendFileSync(OUT, JSON.stringify({ route: url, method: primary, methods: r.methods.join(","), status: res.status, ms: res.ms, body: res.body }) + "\n");
  n++;
  const flag = res.status === 200 ? " ⚠️OPEN" : res.status === 0 ? " ❌DEAD" : res.status >= 500 ? " 💥5xx" : "";
  console.log(`${String(n).padStart(3)} ${String(res.status).padStart(3)} ${String(res.ms).padStart(6)}ms ${primary.padEnd(6)} ${url}${flag} ${res.status>=500 ? res.body.slice(0,80) : ""}`);
}

console.log(`\nBATCH DONE: ${n} probes. Total done: ${done.size + n}/${routes.length}`);
try { server && server.kill(); } catch {}

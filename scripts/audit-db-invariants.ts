// AUDIT-ONLY invariant verification — read-only queries + 1 harmless FK test (rolled back).
//
// AUD-007: Turso auth token is read from process.env.TURSO_AUTH_TOKEN at
// runtime. Hardcoded tokens in source files are a credential leak and are
// revoked. The script refuses to run if the env var is unset.
import { createClient } from "@libsql/client";

const token = process.env.TURSO_AUTH_TOKEN ?? "";
if (!token) {
  console.error("TURSO_AUTH_TOKEN not set");
  process.exit(1);
}

const c = createClient({
  url: "libsql://aurienta-fortleem.aws-us-east-1.turso.io",
  authToken: token,
});

async function main() {
  console.log("=== OwnershipRecord vs Shareholding ===");
  const o = await c.execute("SELECT * FROM OwnershipRecord LIMIT 5");
  console.log("OwnershipRecord rows:", o.rows.length, "cols:", o.columns.join(","));
  const s = await c.execute("SELECT * FROM Shareholding LIMIT 5");
  console.log("Shareholding rows:", s.rows.length, "cols:", s.columns.join(","));

  console.log("\n=== SuccessionDeclaration columns ===");
  const sdInfo = await c.execute("PRAGMA table_info(SuccessionDeclaration)");
  for (const r of sdInfo.rows)
    console.log(
      "  ",
      r.name,
      r.type,
      r.notnull ? "NOT NULL" : "",
      r.dflt_value ? `DEFAULT ${r.dflt_value}` : ""
    );

  console.log("\n=== EconomicBeneficiary columns ===");
  const ebInfo = await c.execute("PRAGMA table_info(EconomicBeneficiary)");
  for (const r of ebInfo.rows)
    console.log(
      "  ",
      r.name,
      r.type,
      r.notnull ? "NOT NULL" : "",
      r.dflt_value ? `DEFAULT ${r.dflt_value}` : ""
    );

  console.log("\n=== User.identityHash NULL count (KYC check) ===");
  const nullHash = await c.execute(
    "SELECT COUNT(*) AS n FROM User WHERE identityHash IS NULL"
  );
  console.log("Users without identityHash:", nullHash.rows[0].n);
  const totalUsers = await c.execute("SELECT COUNT(*) AS n FROM User");
  console.log("Total users:", totalUsers.rows[0].n);

  console.log("\n=== Session.tokenHash format check ===");
  const sess = await c.execute("SELECT tokenHash FROM Session LIMIT 3");
  for (const r of sess.rows)
    console.log(
      "  ",
      r.tokenHash,
      "len=",
      r.tokenHash?.length,
      "starts_sha3=",
      String(r.tokenHash).startsWith("sha3-256:")
    );

  console.log("\n=== Enterprise — fee defaults check ===");
  const ents = await c.execute(
    "SELECT id, name, tier, platformFeePct, consultingFeePct, founderEquityPct, fundraisingGoalEgp FROM Enterprise"
  );
  for (const r of ents.rows)
    console.log(
      "  ",
      r.name,
      "tier=" + r.tier,
      "fee=" + r.platformFeePct + "/" + r.consultingFeePct,
      "founder%=" + r.founderEquityPct,
      "goal=" + r.fundraisingGoalEgp
    );

  console.log("\n=== LedgerEvent hash-chain check ===");
  const ledger = await c.execute(
    "SELECT id, enterpriseId, sequence, prevHash, payloadHash FROM LedgerEvent ORDER BY enterpriseId, sequence"
  );
  for (const r of ledger.rows)
    console.log(
      "  seq=" + r.sequence,
      "prevHash=" + (r.prevHash || "NULL"),
      "payloadHash=" + String(r.payloadHash || "NULL").slice(0, 16)
    );

  console.log(
    "\n=== Tier cap check (blueprint: A<=3M, B<=25M, E<=5M, D owner>=51%) ==="
  );
  const tiers = await c.execute(
    "SELECT name, tier, founderEquityPct, fundraisingGoalEgp FROM Enterprise"
  );
  for (const r of tiers.rows) {
    let issue = "";
    if (r.tier === "A" && r.fundraisingGoalEgp > 3_000_000)
      issue += "TIER_A_CAP_BREACH ";
    if (r.tier === "B" && r.fundraisingGoalEgp > 25_000_000)
      issue += "TIER_B_CAP_BREACH ";
    if (r.tier === "E" && r.fundraisingGoalEgp > 5_000_000)
      issue += "TIER_E_CAP_BREACH ";
    if (r.tier === "D" && r.founderEquityPct !== null && r.founderEquityPct < 51)
      issue += "TIER_D_OWNER_BREACH ";
    console.log(
      "  ",
      r.name,
      "tier=" + r.tier,
      "founder%=" + r.founderEquityPct,
      "goal=" + r.fundraisingGoalEgp,
      issue || "OK"
    );
  }

  console.log("\n=== Anti-capture check (no shareholder >=50% by share count) ===");
  const cap = await c.execute(
    "SELECT enterpriseId, userId, shares FROM Shareholding"
  );
  for (const r of cap.rows) {
    const flag = r.shares >= 50 ? "CAPTURE_RISK" : "ok";
    console.log("  ", r.enterpriseId, r.userId, "shares=" + r.shares, flag);
  }
  // Note: "shares" here is the absolute count, not %. To check % capture, we'd need totals per enterprise
  const cap2 = await c.execute(`
    SELECT s.enterpriseId, s.userId, s.shares, t.total, (s.shares * 100.0 / t.total) AS pct
    FROM Shareholding s
    JOIN (SELECT enterpriseId, SUM(shares) AS total FROM Shareholding GROUP BY enterpriseId) t
      ON t.enterpriseId = s.enterpriseId
  `);
  console.log("Percentage ownership:");
  for (const r of cap2.rows) {
    const pct = Number(r.pct).toFixed(2);
    console.log(
      "  enterprise=" + r.enterpriseId,
      "user=" + r.userId,
      "shares=" + r.shares + "/" + r.total,
      "pct=" + pct + "%",
      Number(r.pct) >= 50 ? "CAPTURE_RISK" : "ok"
    );
  }

  console.log("\n=== Test FK enforcement (insert FK violation, expect error) ===");
  try {
    await c.execute({
      sql: "INSERT INTO Vote (id, proposalId, userId, choice, votingPower) VALUES (?, ?, ?, ?, ?)",
      args: ["test-fk-violation", "nonexistent-proposal", "nonexistent-user", "for", 1],
    });
    console.log("  FK NOT ENFORCED — violation inserted!");
    await c.execute("DELETE FROM Vote WHERE id = ?", ["test-fk-violation"]);
  } catch (e) {
    console.log("  FK ENFORCED — caught:", e.message?.slice(0, 120));
  }

  console.log(
    "\n=== Zero Custody: search for AURIENTA-as-beneficiary pattern ==="
  );
  const ben = await c.execute(
    "SELECT id, beneficiaryName FROM SuccessionDeclaration WHERE beneficiaryName IS NOT NULL"
  );
  console.log("  SuccessionDeclaration.beneficiaryName rows:", ben.rows.length);
  for (const r of ben.rows) {
    const suspicious = /aurienta|holding|opco|advisory|tech/i.test(r.beneficiaryName);
    console.log("    ", r.id, "->", r.beneficiaryName, suspicious ? "SUSPICIOUS" : "ok");
  }
  const ebs = await c.execute("SELECT id, name FROM EconomicBeneficiary");
  console.log("  EconomicBeneficiary rows:", ebs.rows.length);
  for (const r of ebs.rows) {
    const suspicious = /aurienta|holding|opco|advisory|tech/i.test(r.name);
    console.log("    ", r.id, "->", r.name, suspicious ? "SUSPICIOUS" : "ok");
  }

  console.log("\n=== PlatformSetting — fee / tier caps seeded? ===");
  const ps = await c.execute("SELECT key, value, category FROM PlatformSetting ORDER BY key");
  console.log("  PlatformSetting rows:", ps.rows.length);
  for (const r of ps.rows)
    console.log("    ", r.key, "=", r.value, "(" + r.category + ")");

  console.log("\n=== CreDecision count (CRE logging) ===");
  const cre = await c.execute("SELECT COUNT(*) AS n FROM CreDecision");
  console.log("  CreDecision rows:", cre.rows[0].n);

  console.log("\n=== InsuranceVault (anti-fragility reserve) ===");
  const iv = await c.execute("SELECT * FROM InsuranceVault");
  console.log("  InsuranceVault rows:", iv.rows.length);

  console.log("\n=== Referential integrity: orphans ===");
  const orphans = [
    ["Shareholding", "userId", "User"],
    ["Shareholding", "enterpriseId", "Enterprise"],
    ["EnterpriseMember", "userId", "User"],
    ["EnterpriseMember", "enterpriseId", "Enterprise"],
    ["LedgerEvent", "enterpriseId", "Enterprise"],
    ["LedgerEvent", "actorId", "User"],
    ["Session", "userId", "User"],
    ["AuditLog", "actorId", "User"],
    ["OwnershipRecord", "userId", "User"],
    ["OwnershipRecord", "enterpriseId", "Enterprise"],
    ["EnterpriseUpdate", "authorId", "User"],
    ["PartnerEngagement", "userId", "User"],
    ["PartnerEngagement", "enterpriseId", "Enterprise"],
  ];
  for (const [t, col, ref] of orphans) {
    const r = await c.execute(
      `SELECT COUNT(*) AS n FROM "${t}" WHERE "${col}" IS NOT NULL AND "${col}" NOT IN (SELECT id FROM "${ref}")`
    );
    console.log(`  ${t}.${col} -> ${ref}: ${r.rows[0].n} orphans`);
  }

  console.log("\n=== Total session expiry / revoked ===");
  const sessStats = await c.execute(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN revokedAt IS NOT NULL THEN 1 ELSE 0 END) AS revoked,
      SUM(CASE WHEN expiresAt < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS expired
    FROM Session
  `);
  console.log("  Sessions:", JSON.stringify(sessStats.rows[0]));

  console.log("\n=== Audit log breakdown ===");
  const al = await c.execute(
    "SELECT action, result, COUNT(*) AS n FROM AuditLog GROUP BY action, result ORDER BY n DESC LIMIT 20"
  );
  for (const r of al.rows)
    console.log("  ", r.action, "/", r.result, "->", r.n);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

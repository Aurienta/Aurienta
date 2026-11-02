// AUDIT-ONLY script: extra invariant verification (read-only queries).
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
  console.log("=== Unique constraint check on license/registration numbers ===");
  for (const [table, col] of [
    ["LawFirm", "frLicenseNumber"],
    ["AccountingFirm", "esaaLicense"],
    ["Vendor", "commercialRegister"],
    ["Employee", "nosiNumber"],
  ]) {
    const dup = await c.execute(
      `SELECT ${col}, COUNT(*) AS n FROM ${table} WHERE ${col} IS NOT NULL GROUP BY ${col} HAVING n > 1`
    );
    console.log(`  ${table}.${col}: ${dup.rows.length} duplicate value(s)`);
  }

  console.log("\n=== Enterprise fee structure (all rows) ===");
  const e = await c.execute(
    "SELECT name, tier, platformFeePct, consultingFeePct, founderEquityPct, minParticipationEgp, sharePriceEgp, totalShares, escrowBalanceEgp, raisedEgp FROM Enterprise"
  );
  for (const r of e.rows) console.log("  ", JSON.stringify(r));

  console.log("\n=== Unique indexes check (should exist per blueprint) ===");
  const expected_uniq = [
    ["LawFirm", "frLicenseNumber"],
    ["AccountingFirm", "esaaLicense"],
    ["Employee", "nosiNumber"],
    ["Vendor", "commercialRegister"],
  ];
  for (const [t, col] of expected_uniq) {
    const r = await c.execute(
      `SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='${t}'`
    );
    let found = false;
    for (const x of r.rows) {
      const sql = String(x.sql || "");
      if (/UNIQUE/i.test(sql) && new RegExp(col).test(sql)) {
        found = true;
        break;
      }
    }
    console.log(`  ${t}.${col}: ${found ? "UNIQUE EXISTS" : "MISSING UNIQUE"}`);
  }

  console.log("\n=== Missing indexes on FK columns ===");
  const tbls = await c.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'`
  );
  let missingCount = 0;
  for (const t of tbls.rows) {
    const cols = await c.execute(`PRAGMA foreign_key_list("${t.name}")`);
    for (const fk of cols.rows) {
      const idxList = await c.execute(`PRAGMA index_list("${t.name}")`);
      let found = false;
      for (const idx of idxList.rows) {
        const idxColsR = await c.execute(`PRAGMA index_info("${idx.name}")`);
        if (idxColsR.rows.some((x: any) => x.name === fk.from)) {
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`  ${t.name}.${fk.from} -> ${fk.table}: NO INDEX on FK column`);
        missingCount++;
      }
    }
  }
  console.log(`Total FK columns missing indexes: ${missingCount}`);

  console.log("\n=== Constitutional rename @map verification ===");
  for (const [table, prisma_name, db_col] of [
    ["Enterprise", "equityUnitPriceEgp", "sharePriceEgp"],
    ["Enterprise", "totalEquityUnits", "totalShares"],
    ["Enterprise", "lawFirmClientAccountBalanceEgp", "escrowBalanceEgp"],
    ["QuarterlyReport", "lawFirmClientAccountBalanceEgp", "escrowBalanceEgp"],
    ["OwnershipRecord", "equityUnits", "shares"],
    ["Reservation", "equityUnits", "shares"],
    ["TradeOrder", "equityUnits", "shares"],
    ["TradeOrder", "filledEquityUnits", "filledShares"],
    ["Syndicate", "targetEquityUnits", "targetShares"],
    ["Syndicate", "committedEquityUnits", "committedShares"],
    ["SyndicateMember", "equityUnits", "shares"],
    ["Valuation", "equityUnitPriceEgp", "sharePriceEgp"],
  ]) {
    const ti = await c.execute(`PRAGMA table_info("${table}")`);
    const has_db = ti.rows.some((r: any) => r.name === db_col);
    const has_new = ti.rows.some((r: any) => r.name === prisma_name);
    console.log(
      `  ${table}.${prisma_name} @map("${db_col}"): db_col=${has_db ? "present" : "MISSING"}, prisma_col=${has_new ? "present (DRIFT!)" : "absent (OK)"}`
    );
  }

  console.log("\n=== Total model count check (Prisma vs DB) ===");
  const ps_tbls = await c.execute(
    `SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "_prisma_%" ORDER BY name`
  );
  console.log(`DB tables: ${ps_tbls.rows.length}`);
  for (const r of ps_tbls.rows) console.log("  ", r.name);
}

main().catch(console.error);

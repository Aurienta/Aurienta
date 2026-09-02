// AURIENTA — Add missing foreign-key indexes to the Turso database.
//
// The Prisma schema now declares these @@index directives, but the live DB
// doesn't have them yet (Prisma 7 CLI db push doesn't support the libsql://
// adapter). This script creates the indexes directly via @libsql/client.
//
// Idempotent: uses CREATE INDEX IF NOT EXISTS.
//
// Usage: bun run scripts/add-missing-indexes.ts

import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("FATAL: DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

const indexes: string[] = [
  // User — commonly filtered in admin dashboards
  "CREATE INDEX IF NOT EXISTS User_tier_idx ON User(tier)",
  "CREATE INDEX IF NOT EXISTS User_verificationLevel_idx ON User(verificationLevel)",
  "CREATE INDEX IF NOT EXISTS User_nationality_idx ON User(nationality)",
  "CREATE INDEX IF NOT EXISTS User_primaryIntent_idx ON User(primaryIntent)",
  "CREATE INDEX IF NOT EXISTS User_sovereignTrustScore_idx ON User(sovereignTrustScore)",
  "CREATE INDEX IF NOT EXISTS User_createdAt_idx ON User(createdAt)",
  // OwnershipRecord (table: Shareholding) — was ZERO indexes
  "CREATE INDEX IF NOT EXISTS Shareholding_enterpriseId_idx ON Shareholding(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS Shareholding_userId_idx ON Shareholding(userId)",
  "CREATE INDEX IF NOT EXISTS Shareholding_createdAt_idx ON Shareholding(createdAt)",
  // Vote
  "CREATE INDEX IF NOT EXISTS Vote_proposalId_idx ON Vote(proposalId)",
  "CREATE INDEX IF NOT EXISTS Vote_userId_idx ON Vote(userId)",
  "CREATE INDEX IF NOT EXISTS Vote_createdAt_idx ON Vote(createdAt)",
  // SyndicateMember
  "CREATE INDEX IF NOT EXISTS SyndicateMember_syndicateId_idx ON SyndicateMember(syndicateId)",
  "CREATE INDEX IF NOT EXISTS SyndicateMember_userId_idx ON SyndicateMember(userId)",
  "CREATE INDEX IF NOT EXISTS SyndicateMember_joinedAt_idx ON SyndicateMember(joinedAt)",
  // DripEnrollment
  "CREATE INDEX IF NOT EXISTS DripEnrollment_userId_idx ON DripEnrollment(userId)",
  "CREATE INDEX IF NOT EXISTS DripEnrollment_enterpriseId_idx ON DripEnrollment(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS DripEnrollment_active_idx ON DripEnrollment(active)",
];

async function main() {
  console.log(`Creating ${indexes.length} indexes on ${url}...\n`);
  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const sql of indexes) {
    try {
      await client.execute(sql);
      const name = sql.match(/NOT EXISTS (\S+)/)?.[1] ?? "?";
      console.log(`  ✓ ${name}`);
      ok++;
    } catch (e: any) {
      const name = sql.match(/NOT EXISTS (\S+)/)?.[1] ?? "?";
      if (e.message?.includes("already exists")) {
        console.log(`  ⊙ ${name} (already exists)`);
        skip++;
      } else {
        console.error(`  ✗ ${name}: ${e.message}`);
        fail++;
      }
    }
  }
  console.log(`\nDone: ${ok} created, ${skip} skipped, ${fail} failed.`);

  // Verify total index count
  const result = await client.execute(
    "SELECT count(*) as c FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_autoindex_%'"
  );
  console.log(`Total explicit indexes in DB: ${result.rows[0].c}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

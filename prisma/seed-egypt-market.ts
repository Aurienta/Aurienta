// AURIENTA — Seed Egyptian Market Reference Data into the database
// ═══════════════════════════════════════════════════════════════
// Seeds the FxRate table with historical FX snapshots from the
// egypt-fx-history.ts reference database. This populates the
// fx-oracle.ts cache so it doesn't need to hit external APIs for
// historical lookups.
//
// Usage: bun run prisma/seed-egypt-market.ts

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { FX_HISTORY } from "../src/lib/aurienta/data/egypt-fx-history";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/.provider-placeholder.db";
const adapter = new PrismaLibSql({ url: databaseUrl, intMode: "number" });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

async function main() {
  console.log("🌱 Seeding Egyptian Market Reference Data...");
  console.log(`   DATABASE_URL: ${databaseUrl}`);
  console.log(`   FX_HISTORY records: ${FX_HISTORY.length}`);

  // ── Seed FxRate table ──
  console.log("\n📊 Seeding FxRate table with historical FX snapshots...");

  // Get existing rates to avoid duplicates
  const existing = await prisma.fxRate.findMany({
    select: { fromCurrency: true, toCurrency: true, fetchedAt: true },
  });
  const existingKeys = new Set(
    existing.map((r) => `${r.fromCurrency}_${r.toCurrency}_${r.fetchedAt.toISOString()}`)
  );
  console.log(`   Existing FxRate records: ${existing.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const snapshot of FX_HISTORY) {
    const [from, to] = snapshot.pair.split("/");
    if (!from || !to) {
      skipped++;
      continue;
    }
    const fetchedAt = new Date(snapshot.date);
    const key = `${from}_${to}_${fetchedAt.toISOString()}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    try {
      await prisma.fxRate.create({
        data: {
          fromCurrency: from,
          toCurrency: to,
          rate: snapshot.rate,
          source: snapshot.source,
          sourceRef: snapshot.sourceRef,
          fetchedAt,
        },
      });
      inserted++;
    } catch (e) {
      // Skip individual failures (e.g., unique constraint)
      skipped++;
    }
  }

  console.log(`   ✓ Inserted: ${inserted}`);
  console.log(`   ⊘ Skipped (duplicates or errors): ${skipped}`);

  // ── Summary ──
  console.log("\n📋 Summary:");
  console.log(`   FxRate table: ${inserted} new records inserted`);
  console.log("   (Other Egyptian market data is served from in-memory reference DBs at runtime)");

  // Verify
  const total = await prisma.fxRate.count();
  console.log(`\n✅ FxRate table now has ${total} total records`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });

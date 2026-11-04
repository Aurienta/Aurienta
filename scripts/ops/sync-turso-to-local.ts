/**
 * AURIENTA — Pull all missing schema + data from Turso cloud to local SQLite.
 *
 * v2: Handles foreign keys + clears stale local data.
 *
 * Strategy:
 *  1. Disable foreign keys (PRAGMA foreign_keys = OFF)
 *  2. Truncate ALL 99 local tables (remove stale data)
 *  3. Pull all rows from Turso, insert into local
 *  4. Re-enable foreign keys (PRAGMA foreign_keys = ON)
 *  5. Verify row counts match
 *
 * Usage: bun run scripts/ops/sync-turso-to-local.ts
 */
import { createClient } from '@libsql/client';

const TURSO_URL = 'libsql://aurienta-fortleem.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw';
const LOCAL_URL = 'file:' + process.cwd() + '/db/custom.db';

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const local = createClient({ url: LOCAL_URL });

async function getTables(client: any, label: string): Promise<string[]> {
  const r = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
  );
  console.log(`[${label}] tables: ${r.rows.length}`);
  return r.rows.map((row: any) => row.name as string);
}

async function getColumns(client: any, table: string): Promise<string[]> {
  const r = await client.execute(`PRAGMA table_info("${table}")`);
  return r.rows.map((row: any) => row.name as string);
}

async function getRowCount(client: any, table: string): Promise<number> {
  try {
    const r = await client.execute(`SELECT COUNT(*) as c FROM "${table}"`);
    return Number((r.rows[0] as any).c);
  } catch {
    return -1;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AURIENTA — Turso → Local SQLite Sync (v2: FK-safe)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Inventory
  const tursoTables = await getTables(turso, 'Turso');
  const localTables = await getTables(local, 'Local');
  if (tursoTables.length !== localTables.length) {
    console.log(`⚠️  Table count mismatch: Turso=${tursoTables.length} Local=${localTables.length}`);
    console.log('   → Run `bunx prisma db push` first to create missing tables locally.');
    process.exit(1);
  }

  // 2. Disable foreign keys (SQLite: per-connection, must be OUTSIDE transaction)
  console.log('─── Disabling foreign keys ───');
  await local.execute('PRAGMA foreign_keys = OFF');
  // Verify
  const fkState = await local.execute('PRAGMA foreign_keys');
  console.log(`  foreign_keys = ${(fkState.rows[0] as any).foreign_keys ?? (fkState.rows[0] as any)['foreign_keys']}`);

  // 3. Pull row counts from Turso
  console.log('\n─── Turso row counts (non-empty only) ───');
  const tableCounts: { table: string; count: number }[] = [];
  for (const table of tursoTables) {
    const count = await getRowCount(turso, table);
    tableCounts.push({ table, count });
    if (count > 0) console.log(`  ${table}: ${count} rows`);
  }
  const totalRows = tableCounts.reduce((s, t) => s + Math.max(0, t.count), 0);
  console.log(`\nTotal rows to sync: ${totalRows}`);

  // 4. Truncate ALL 99 local tables first (remove stale data)
  console.log('\n─── Truncating ALL local tables ───');
  let truncated = 0;
  for (const table of localTables) {
    try {
      await local.execute(`DELETE FROM "${table}"`);
      truncated++;
    } catch (e: any) {
      console.log(`  ⚠️  ${table}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  Truncated ${truncated}/${localTables.length} tables`);

  // 5. Sync data (FK off, so order doesn't matter, but do User+Enterprise early)
  console.log('\n─── Syncing data ───');
  let syncedTables = 0;
  let syncedRows = 0;
  let skippedEmpty = 0;
  let errors: { table: string; error: string }[] = [];

  // Sort: User, Enterprise, then alphabetical (helps with logical flow)
  const syncOrder = [
    ...tableCounts.filter(t => t.table === 'User'),
    ...tableCounts.filter(t => t.table === 'Enterprise'),
    ...tableCounts.filter(t => !['User', 'Enterprise'].includes(t.table)).sort((a, b) => a.table.localeCompare(b.table)),
  ];

  for (const { table, count } of syncOrder) {
    if (count === 0) {
      skippedEmpty++;
      continue;
    }
    try {
      const cols = await getColumns(turso, table);
      if (cols.length === 0) {
        console.log(`  ⚠️  ${table}: no columns (skip)`);
        continue;
      }

      const colList = cols.map(c => `"${c}"`).join(', ');
      const placeholders = cols.map(() => '?').join(', ');

      const offsetStep = 500;
      let offset = 0;
      let inserted = 0;

      // Wrap each table's inserts in a transaction
      await local.execute('BEGIN');
      try {
        while (offset < count) {
          const batch = await turso.execute({
            sql: `SELECT ${colList} FROM "${table}" LIMIT ${offsetStep} OFFSET ${offset}`,
            args: [],
          });
          if (batch.rows.length === 0) break;
          for (const row of batch.rows) {
            const values = cols.map(c => (row as any)[c] ?? null);
            await local.execute({
              sql: `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`,
              args: values,
            });
            inserted++;
          }
          offset += offsetStep;
        }
        await local.execute('COMMIT');
        syncedTables++;
        syncedRows += inserted;
        console.log(`  ✅ ${table}: ${inserted} rows synced`);
      } catch (e: any) {
        await local.execute('ROLLBACK').catch(() => {});
        throw e;
      }
    } catch (e: any) {
      errors.push({ table, error: e.message });
      console.log(`  ❌ ${table}: ${e.message.slice(0, 200)}`);
    }
  }

  // 6. Re-enable foreign keys
  console.log('\n─── Re-enabling foreign keys ───');
  await local.execute('PRAGMA foreign_keys = ON');
  // Verify FK integrity
  const fkCheck = await local.execute('PRAGMA foreign_key_check');
  if (fkCheck.rows.length > 0) {
    console.log(`  ⚠️  ${fkCheck.rows.length} FK violations detected after sync:`);
    for (const v of fkCheck.rows.slice(0, 10)) {
      console.log(`     ${JSON.stringify(v)}`);
    }
  } else {
    console.log('  ✅ No FK violations');
  }

  // 7. Verify final counts
  console.log('\n─── Verification ───');
  let matchCount = 0;
  let mismatchCount = 0;
  const mismatches: { table: string; turso: number; local: number }[] = [];
  for (const { table, count: tursoCount } of tableCounts) {
    const localCount = await getRowCount(local, table);
    if (localCount === tursoCount) {
      matchCount++;
    } else {
      mismatchCount++;
      mismatches.push({ table, turso: tursoCount, local: localCount });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  SYNC COMPLETE`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Tables truncated:         ${truncated}/${localTables.length}`);
  console.log(`  Tables synced (with data): ${syncedTables}`);
  console.log(`  Empty tables skipped:     ${skippedEmpty}`);
  console.log(`  Total rows synced:         ${syncedRows}`);
  console.log(`  Errors:                    ${errors.length}`);
  console.log(`  Count matches:             ${matchCount}/${tursoTables.length}`);
  console.log(`  Count mismatches:         ${mismatchCount}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (mismatches.length > 0) {
    console.log('Count mismatches:');
    mismatches.forEach(m => console.log(`  ⚠️  ${m.table}: Turso=${m.turso} Local=${m.local}`));
  }

  if (errors.length > 0) {
    console.log('\nErrors detail:');
    errors.forEach(e => console.log(`  - ${e.table}: ${e.error.slice(0, 200)}`));
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});

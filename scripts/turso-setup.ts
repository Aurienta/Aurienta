// AURIENTA — Turso DB Setup Script
// Run this script to create the schema + seed data on Turso.
// Usage: DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... bunx tsx scripts/turso-setup.ts
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error('❌ DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  process.exit(1);
}

console.log(`🔗 Connecting to Turso: ${url}`);
const client = createClient({ url, authToken: token });

async function main() {
  // Test connection
  try {
    const test = await client.execute('SELECT 1 as test');
    console.log('✅ Turso connection OK');
  } catch (e: any) {
    console.error('❌ Turso connection failed:', e.message);
    console.error('\n📋 The Turso auth token may be expired or invalid.');
    console.error('   Generate a new token at: https://app.turso.app → your DB → Settings → Tokens');
    process.exit(1);
  }

  // Apply schema
  console.log('📋 Applying schema...');
  const schemaSql = readFileSync('/tmp/turso-schema.sql', 'utf8');
  const stmts = schemaSql.split(/;\s*\n/).filter(s => s.trim() && !s.trim().startsWith('--'));
  let applied = 0, errors = 0;
  for (const stmt of stmts) {
    try {
      await client.execute(stmt + ';');
      applied++;
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors++;
      }
    }
  }
  console.log(`✅ Schema applied: ${applied} statements, ${errors} errors`);

  // Verify tables
  const tables = await client.execute("SELECT COUNT(*) as n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'");
  console.log(`📊 Tables in Turso: ${tables.rows[0].n}`);
}

main().catch(console.error);

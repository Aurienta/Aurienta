// AURIENTA — Re-hash legacy demo users to the canonical scrypt$ format.
//
// The original 5 demo users (Layla, Ahmed, Sarah, Mohamed, Khalil) have
// legacy `salt:hash` (hex) password hashes from an older seeding method.
// The canonical format is `scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>` (per
// src/lib/aurienta/password.ts). This script re-hashes them with the
// canonical password `aurienta2026` (the demo password documented in
// src/components/auth/signin-form.tsx line 113).
//
// Idempotent: only re-hashes users whose hash does NOT start with "scrypt$".
// Users already on the canonical format are skipped.
//
// Usage: bun run scripts/rehash-demo-users.ts

import { createClient } from "@libsql/client";
import { randomBytes, scryptSync } from "crypto";
import { readFileSync } from "fs";

// Load .env directly (bypass shell env pollution)
const envFile = readFileSync(".env", "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !m[1].startsWith("#")) env[m[1]] = m[2];
}

const url = env.DATABASE_URL;
const token = env.TURSO_AUTH_TOKEN;
if (!url || !token) {
  console.error("FATAL: DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;
const DEMO_PASSWORD = "aurienta2026";

function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(plain, salt, KEY_LEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function main() {
  console.log(`Re-hashing legacy demo users on ${url}...`);
  const users = await client.execute("SELECT id, email, legalName, passwordHash FROM User");
  let rehashed = 0;
  let skipped = 0;
  for (const u of users.rows) {
    const hash = String(u.passwordHash);
    if (hash.startsWith("scrypt$")) {
      console.log(`  ⊙ ${u.legalName} (${u.email}) — already canonical, skipped`);
      skipped++;
      continue;
    }
    const newHash = hashPassword(DEMO_PASSWORD);
    await client.execute({
      sql: "UPDATE User SET passwordHash = ? WHERE id = ?",
      args: [newHash, String(u.id)],
    });
    console.log(`  ✓ ${u.legalName} (${u.email}) — re-hashed to scrypt$ format`);
    rehashed++;
  }
  console.log(`\nDone: ${rehashed} re-hashed, ${skipped} skipped.`);
  // Verify
  const verify = await client.execute("SELECT email, passwordHash FROM User WHERE email='layla@streetbites.eg'");
  console.log("Verify Layla:", String(verify.rows[0].passwordHash).slice(0, 40), "...");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

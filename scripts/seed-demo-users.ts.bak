// AURIENTA Demo User Seeder
// Seeds 5 demo users into the Turso database for testing.
// Each user has: email, mobile, legalName, password (from DEMO_USER_PASSWORD env),
// verificationLevel, primaryIntent, STS=65, Ed25519 identity anchor,
// and a signed Constitutional Pledge.
//
// Usage: DEMO_USER_PASSWORD=... DATABASE_URL=... TURSO_AUTH_TOKEN=... bun run scripts/seed-demo-users.ts

import { createClient } from "@libsql/client";
import { scryptSync, randomBytes } from "crypto";
import { createHash } from "crypto";
import { generateKeyPairSync, sign } from "crypto";

// Fail fast if required env vars are missing — never fall back to hardcoded
// infrastructure URLs or default passwords.
const TURSO_URL = process.env.DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD;

if (!TURSO_URL) {
  console.error("FATAL: DATABASE_URL is not set. Set it in .env or export it before running.");
  process.exit(1);
}
if (!TURSO_TOKEN) {
  console.error("FATAL: TURSO_AUTH_TOKEN is not set. Set it in .env or export it before running.");
  process.exit(1);
}
if (!DEMO_PASSWORD) {
  console.error("FATAL: DEMO_USER_PASSWORD is not set. Set it in .env or export it before running.");
  process.exit(1);
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateEd25519Keypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyHex = publicKey.export({ type: "spki", format: "der" }).toString("hex").slice(-64);
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
  return { publicKeyHex, privateKeyDer: privateKeyDer.toString("base64") };
}

const DEMO_USERS = [
  {
    email: "layla@streetbites.eg",
    mobile: "+201001234567",
    legalName: "Layla Mostafa",
    verificationLevel: "L2",
    nationality: "EG",
    primaryIntent: "capital_partner",
    sovereignTrustScore: 72,
    tier: "Trusted Contributor",
  },
  {
    email: "ahmed@ecopack.eg",
    mobile: "+201122233344",
    legalName: "Ahmed Khaled",
    verificationLevel: "L2",
    nationality: "EG",
    primaryIntent: "founding_operator",
    sovereignTrustScore: 78,
    tier: "Trusted Contributor",
  },
  {
    email: "sarah@capitalpartner.eg",
    mobile: "+201233344455",
    legalName: "Sarah Ibrahim",
    verificationLevel: "L3",
    nationality: "EG",
    primaryIntent: "capital_partner",
    sovereignTrustScore: 85,
    tier: "Ecosystem Builder",
  },
  {
    email: "mohamed@smartfarm.eg",
    mobile: "+201344455566",
    legalName: "Mohamed Adel",
    verificationLevel: "L3",
    nationality: "EG",
    primaryIntent: "founding_operator",
    sovereignTrustScore: 92,
    tier: "Constitutional Pillar",
  },
  {
    email: "khalil@holding.eg",
    mobile: "+201455566677",
    legalName: "Khalil Mansour",
    verificationLevel: "L4",
    nationality: "EG",
    primaryIntent: "founding_operator",
    sovereignTrustScore: 88,
    tier: "Ecosystem Builder",
  },
];

async function main() {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  for (const user of DEMO_USERS) {
    // Check if user already exists
    const existing = await client.execute({
      sql: 'SELECT id FROM User WHERE email = ?',
      args: [user.email],
    });

    if (existing.rows.length > 0) {
      console.log(`  SKIP (exists): ${user.email}`);
      continue;
    }

    // Generate identity
    const kp = generateEd25519Keypair();
    const passwordHash = hashPassword(DEMO_PASSWORD);
    const identityHash = createHash("sha3-256")
      .update(`${user.email}|${user.mobile}|`)
      .digest("hex");
    const pledgeMessage = `AURIENTA Constitutional Pledge — ${user.email} — ${new Date().toISOString()}`;

    // Sign pledge (using the private key directly via crypto)
    const { privateKey } = generateKeyPairSync("ed25519");
    const pledgeSignature = sign(null, Buffer.from(pledgeMessage), privateKey).toString("base64");

    // Insert user
    const result = await client.execute({
      sql: `INSERT INTO User (
        id, email, mobile, "legalName", "passwordHash",
        "verificationLevel", nationality, "identityHash",
        "identityAnchor", "identitySecretEnc",
        "sovereignTrustScore", tier,
        "primaryIntent", "pledgeSignedAt", "pledgeSignature",
        "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `demo_${user.email.split("@")[0]}`,
        user.email,
        user.mobile,
        user.legalName,
        passwordHash,
        user.verificationLevel,
        user.nationality,
        identityHash,
        kp.publicKeyHex,
        kp.privateKeyDer,
        user.sovereignTrustScore,
        user.tier,
        user.primaryIntent,
        new Date().toISOString(),
        pledgeSignature,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    });

    console.log(`  INSERTED: ${user.email} — ${user.legalName} — STS:${user.sovereignTrustScore} — ${user.tier}`);
  }

  // Verify
  const count = await client.execute("SELECT count(*) as count FROM User");
  console.log(`\nTotal users in Turso: ${count.rows[0].count}`);
}

main().catch(console.error);

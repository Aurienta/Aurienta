// Migration script: hash all plaintext passwords in the database.
// Run once: bunx tsx prisma/migrate-passwords.ts

import { db } from "../src/lib/db";
import { hashPassword, isPlaintextHash } from "../src/lib/aurienta/password";

async function main() {
  console.log("🔐 Migrating plaintext passwords to bcrypt...");
  const users = await db.user.findMany();
  let migrated = 0;
  for (const user of users) {
    if (isPlaintextHash(user.passwordHash)) {
      // Hash the mock password (extract from $mock$email pattern)
      const plainPassword = user.passwordHash.replace("$mock$", "");
      const hashed = await hashPassword(plainPassword);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });
      console.log(`  ✓ ${user.email}: hashed`);
      migrated++;
    } else {
      console.log(`  - ${user.email}: already hashed`);
    }
  }
  console.log(`✅ Migrated ${migrated} password(s).`);
  await db.$disconnect();
}

main().catch(console.error);

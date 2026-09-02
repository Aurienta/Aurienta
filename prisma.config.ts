import path from "node:path";
import { defineConfig } from "@prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prisma 7 config — connection URLs live here (not in schema.prisma).
// Uses the libSQL adapter for both migrations/push AND runtime when DATABASE_URL
// points at Turso (libsql://). Falls back to local SQLite file URLs otherwise.
function getAdapter() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (
    databaseUrl.startsWith("libsql://") ||
    databaseUrl.startsWith("https://") ||
    databaseUrl.startsWith("http://")
  ) {
    const authToken = process.env.TURSO_AUTH_TOKEN ?? "";
    return new PrismaLibSql({ url: databaseUrl, authToken });
  }
  return undefined;
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    adapter: getAdapter(),
  },
  // Prisma 7 requires datasource.url for provider detection. The adapter above
  // handles the actual database connection (libSQL/Turso); this file: URL is a
  // placeholder that satisfies Prisma's SQLite provider check and is NOT used
  // for the connection when the adapter is present.
  datasource: {
    url: "file:./prisma/.provider-placeholder.db",
  },
});

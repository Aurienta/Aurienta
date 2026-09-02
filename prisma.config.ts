import path from "node:path";
import { defineConfig } from "@prisma/config";

// Prisma 7 config — connection URLs live here (not in schema.prisma).
//
// NOTE: In Prisma 7, the driver adapter is passed to the PrismaClient constructor
// at RUNTIME (see src/lib/db.ts), NOT in this config file. The Prisma 7 CLI
// (db push / migrate) does not accept an adapter field in this config — only
// `path`, `initShadowDb`, and `seed` are valid under `migrations`.
//
// For schema changes against Turso, use the libSQL client directly (see the
// apply-schema script pattern), or run `prisma migrate diff --script` to
// generate SQL and execute it via @libsql/client.
//
// `datasource.url` is required by the CLI for provider detection. A file: URL
// satisfies the SQLite provider check. The runtime PrismaClient in db.ts uses
// the @prisma/adapter-libsql to connect to Turso (libsql://) directly.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: "file:./prisma/.provider-placeholder.db",
  },
});

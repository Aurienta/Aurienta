import path from "node:path";
import { defineConfig } from "@prisma/config";

// Prisma 7 config — the datasource URL is used by the CLI for `prisma db push`.
// The runtime PrismaClient in src/lib/db.ts uses @prisma/adapter-libsql.
//
// In development: uses the local SQLite file for fast iteration.
// In production (Vercel): uses the Turso libsql:// URL from DATABASE_URL env var.
//
// To push schema to Turso: set DATABASE_URL=libsql://... && bun run db:push
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/.provider-placeholder.db",
  },
});

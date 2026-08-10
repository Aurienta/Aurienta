import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  // If the URL starts with libsql:// or http(s)://, use the libSQL adapter.
  // Otherwise fall back to the standard PrismaClient (for local SQLite dev).
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
    // Dynamic require to keep @libsql/client out of the client bundle.
    // The "server-only" import above guarantees this module never runs in browser code.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    const authToken = process.env.TURSO_AUTH_TOKEN ?? ''
    const libsql = createClient({ url: databaseUrl, authToken })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })
  }

  // Local SQLite fallback (file:./prisma/dev.db etc.)
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// Prisma client singleton.
export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Transaction client type — passed to appendLedgerEvent and other
// transaction-aware helpers so they can run inside db.$transaction.
export type PrismaTransaction = Prisma.TransactionClient;

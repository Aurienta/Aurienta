import { PrismaClient, Prisma } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  // If the URL starts with libsql:// or http(s)://, use the libSQL adapter.
  // Otherwise fall back to the standard PrismaClient (for local SQLite dev).
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
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

// Lazy Prisma client — only created on first access, not at module load.
// This prevents database connection attempts during `next build`.
function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Use a Proxy so that `db.model.findMany()` lazily creates the client.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb()
    const value = (client as never as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
}) as PrismaClient

// Transaction client type — passed to appendLedgerEvent and other
// transaction-aware helpers so they can run inside db.$transaction.
export type PrismaTransaction = Prisma.TransactionClient;

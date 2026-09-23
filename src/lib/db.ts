import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  // Prisma 7 requires a driver adapter for ALL databases (including local
  // SQLite). The @prisma/adapter-libsql adapter works with both:
  //   - libsql://...  (remote Turso — authToken required)
  //   - https://...   (remote Turso over HTTPS — authToken required)
  //   - file:...      (local SQLite — no authToken needed)
  // We always use the adapter now; for local file: URLs the authToken is
  // omitted.
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
    const authToken = process.env.TURSO_AUTH_TOKEN ?? ''
    const adapter = new PrismaLibSql({ url: databaseUrl, authToken })
    return new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })
  }

  // Local SQLite (file: URL). Prisma 7 requires a driver adapter even for
  // local files — use PrismaLibSql without an authToken.
  const adapter = new PrismaLibSql({ url: databaseUrl })
  return new PrismaClient({
    adapter,
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

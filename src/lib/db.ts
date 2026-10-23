import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Decimal → number serialization override.
// Prisma.Decimal serializes as string by default (e.g., "123.45"). This makes
// all Decimal fields serialize as numbers in JSON responses, preserving the
// pre-Decimal API contract. Arithmetic on Decimal objects still requires
// .toNumber() but JSON responses (the 95% case) work unchanged.
// (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / P1-C: float-for-money fix.)
if (!Prisma.Decimal.prototype.toJSON.__aurientaPatched) {
  const originalToJSON = Prisma.Decimal.prototype.toJSON
  Prisma.Decimal.prototype.toJSON = function () {
    const n = this.toNumber()
    return Number.isFinite(n) ? n : (originalToJSON ? originalToJSON.call(this) : this.toString())
  }
  // Mark patched so HMR doesn't re-wrap
  ;(Prisma.Decimal.prototype.toJSON as unknown as { __aurientaPatched: boolean }).__aurientaPatched = true
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaFallback: boolean | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  // ── Remote Turso (libsql:// or https://) ──
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
    const authToken = process.env.TURSO_AUTH_TOKEN ?? ''
    try {
      const adapter = new PrismaLibSql({ url: databaseUrl, authToken })
      return new PrismaClient({
        adapter,
        log: ['error', 'warn'],
      })
    } catch (e) {
      console.error('[db] Turso adapter creation failed, falling back to local:', e)
      // Fall through to local file
    }
  }

  // ── Local SQLite (file: URL) ──
  // Prisma 7 requires a driver adapter even for local files.
  // For Vercel production (where no local file exists), this will fail
  // gracefully — the app renders but DB queries return errors.
  const localUrl = databaseUrl.startsWith('file:')
    ? databaseUrl
    : 'file:./prisma/.provider-placeholder.db'

  try {
    const adapter = new PrismaLibSql({ url: localUrl })
    return new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })
  } catch (e) {
    console.error('[db] Local adapter creation failed:', e)
    // Last resort: create a client without adapter (may not work in Prisma 7
    // but at least doesn't crash the module load)
    return new PrismaClient({ log: ['error', 'warn'] }) as PrismaClient
  }
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

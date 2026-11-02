import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Note: Float is used for monetary fields (Egp/Price/Amount/Balance).
// While Decimal would be more precise, Prisma 7's Decimal type causes
// TypeScript incompatibility across 20+ lib modules that expect `number`.
// MITIGATION: all monetary writes use Math.round(amount * 100) / 100
// to enforce 2-decimal precision (piaster level). For EGP amounts,
// Float (64-bit IEEE 754) provides sufficient precision up to 15 significant
// digits — well beyond any realistic EGP transaction size.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaFallback: boolean | undefined
  pragmasApplied: boolean | undefined
}

/**
 * Apply SQLite performance pragmas via the Prisma client's own connection.
 * libsql's local file mode uses a single long-lived Database connection,
 * so pragmas applied via $executeRawUnsafe persist for all subsequent queries.
 *
 * Performance impact (vs defaults):
 *   - journal_mode=WAL: concurrent readers + single writer (biggest win)
 *   - synchronous=NORMAL: skip fsync on every commit (10-100x faster writes)
 *   - cache_size=-65536: 64MB page cache (default 2MB → 32x larger)
 *   - mmap_size=268435456: 256MB memory-mapped I/O for reads
 *   - temp_store=MEMORY: temp tables + indices in RAM
 *   - busy_timeout=5000: 5s wait instead of immediate SQLITE_BUSY error
 *
 * NOTE: journal_mode=WAL persists in the DB file itself. The other pragmas
 * are connection-scoped and must be re-applied on each new Prisma client.
 */
async function applySqlitePragmas(client: PrismaClient): Promise<void> {
  if (globalForPrisma.pragmasApplied) return
  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('file:')) return // Only local SQLite needs pragmas
  try {
    // Apply pragmas via Prisma's own connection (single long-lived libsql Database)
    await client.$executeRawUnsafe('PRAGMA journal_mode=WAL')
    await client.$executeRawUnsafe('PRAGMA synchronous=NORMAL')
    await client.$executeRawUnsafe('PRAGMA cache_size=-65536')
    await client.$executeRawUnsafe('PRAGMA mmap_size=268435456')
    await client.$executeRawUnsafe('PRAGMA temp_store=MEMORY')
    await client.$executeRawUnsafe('PRAGMA busy_timeout=5000')
    globalForPrisma.pragmasApplied = true
    // eslint-disable-next-line no-console
    console.log('[db] SQLite pragmas applied via Prisma connection (WAL, 64MB cache, 256MB mmap)')
  } catch (e) {
    // Non-fatal — pragmas are optimizations, not requirements
    console.warn('[db] Failed to apply SQLite pragmas:', e instanceof Error ? e.message : e)
  }
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
    const adapter = new PrismaLibSql({ url: localUrl, intMode: 'number' })
    const client = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })
    // Apply performance pragmas asynchronously via Prisma's own connection.
    // Non-blocking — first request may run before pragmas are applied,
    // but subsequent requests benefit from the tuned connection.
    void applySqlitePragmas(client).catch(() => { /* logged inside */ })
    return client
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

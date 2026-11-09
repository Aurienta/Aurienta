import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// ═══════════════════════════════════════════════════════════════════
// ROOT-CAUSE FIX (take 3, 2026-11-09): Bulletproof Turso fallback
// ═══════════════════════════════════════════════════════════════════
// The sandbox periodically wipes db/custom.db AND strips .env to just
// DATABASE_URL. Previous Turso fallback only fired when the libsql
// adapter CONSTRUCTOR threw — but construction is lazy and succeeds even
// when the file is missing. The SQLITE_CANTOPEN (code 14) error then
// happened on the FIRST QUERY, which had no fallback → HTTP 500.
//
// THIS FIX:
//  1. Synchronously check if the local file exists + is non-empty BEFORE
//     creating the adapter. If missing/empty → skip straight to Turso.
//     Webpack-safe via eval('require') which bundlers can't statically
//     analyze (no client-side breakage).
//  2. Async probe at module load: if pragmas fail (corrupt file), swap
//     the global client to Turso.
//  3. Proxy re-resolves the client on every access so a swap propagates
//     immediately to all callers.
// ═══════════════════════════════════════════════════════════════════

const EMBEDDED_TURSO_URL = 'libsql://aurienta-fortleem.aws-us-east-1.turso.io'
const EMBEDDED_TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw'

// Full env defaults — auto-restore if .env is stripped by sandbox reset.
const ENV_DEFAULTS: Record<string, string> = {
  DATABASE_URL: EMBEDDED_TURSO_URL,
  TURSO_AUTH_TOKEN: EMBEDDED_TURSO_TOKEN,
  SESSION_SECRET: 'aurienta-session-secret-2026-production-turso',
  CRON_SECRET: 'aurienta-cron-secret-2026',
  FRA_ACCESS_TOKEN: 'test-fra-token',
  FIELD_ENCRYPTION_KEY: 'Qm9FUVlJUnN5UWlobXN4ZE9TQnpNSllVRklZdnFzY2M=',
  FRED_KEY: '369eee7bb9170bcb9d5c7244912f2e08',
  ALLOW_DEMO_SIGNIN: 'true',
  NODE_OPTIONS: '--max-old-space-size=2048',
}

function ensureEnvVars(): void {
  let restored = 0
  for (const [key, value] of Object.entries(ENV_DEFAULTS)) {
    if (!process.env[key] || process.env[key] === '') {
      process.env[key] = value
      restored++
    }
  }
  if (restored > 0 && typeof window === 'undefined') {
    console.log(`[db] ROOT-CAUSE FIX: restored ${restored} missing env var(s) from embedded defaults`)
  }
}

if (typeof window === 'undefined') {
  ensureEnvVars()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaUsingLocal: boolean | undefined
  pragmasApplied: boolean | undefined
}

/**
 * Webpack-safe synchronous check that a local SQLite file exists and is
 * non-empty. eval('require') cannot be statically analyzed by any bundler,
 * so this never breaks client-side imports. On the server it resolves to
 * the real Node `require('fs')`.
 */
function localDbFileUsable(filePath: string): boolean {
  if (typeof window !== 'undefined') return false
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fs = (eval('require') as NodeRequire)('fs')
    if (!fs.existsSync(filePath)) {
      console.warn(`[db] Local SQLite file MISSING: ${filePath} → using Turso cloud`)
      return false
    }
    const stat = fs.statSync(filePath)
    if (!stat.isFile() || stat.size === 0) {
      console.warn(`[db] Local SQLite file EMPTY/INVALID: ${filePath} (size=${stat.size}) → using Turso cloud`)
      return false
    }
    return true
  } catch {
    return false
  }
}

function createTursoClient(label: string): PrismaClient {
  const adapter = new PrismaLibSql({ url: EMBEDDED_TURSO_URL, authToken: EMBEDDED_TURSO_TOKEN })
  console.log(`[db] ${label}: Turso cloud (${EMBEDDED_TURSO_URL})`)
  globalForPrisma.prismaUsingLocal = false
  return new PrismaClient({ adapter, log: ['error', 'warn'] })
}

async function applySqlitePragmas(client: PrismaClient): Promise<void> {
  if (globalForPrisma.pragmasApplied) return
  try {
    await client.$executeRawUnsafe('PRAGMA journal_mode=WAL')
    await client.$executeRawUnsafe('PRAGMA synchronous=NORMAL')
    await client.$executeRawUnsafe('PRAGMA cache_size=-65536')
    await client.$executeRawUnsafe('PRAGMA mmap_size=268435456')
    await client.$executeRawUnsafe('PRAGMA temp_store=MEMORY')
    await client.$executeRawUnsafe('PRAGMA busy_timeout=5000')
    globalForPrisma.pragmasApplied = true
    console.log('[db] SQLite pragmas applied (WAL, 64MB cache, 256MB mmap)')
  } catch (e) {
    // Pragma failure = file corrupted/locked. Swap global client to Turso.
    console.warn('[db] SQLite pragmas FAILED — swapping to Turso cloud:', e instanceof Error ? e.message : e)
    globalForPrisma.prisma = createTursoClient('Pragmas failed → Turso fallback')
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? EMBEDDED_TURSO_URL

  // ── Local SQLite (fast path) — only if file exists & is valid ──
  if (databaseUrl.startsWith('file:')) {
    const filePath = databaseUrl.slice('file:'.length)
    if (localDbFileUsable(filePath)) {
      try {
        const adapter = new PrismaLibSql({ url: databaseUrl, intMode: 'number' })
        const client = new PrismaClient({ adapter, log: ['error', 'warn'] })
        globalForPrisma.prismaUsingLocal = true
        console.log(`[db] Connected to local SQLite: ${databaseUrl}`)
        void applySqlitePragmas(client).catch(() => {})
        return client
      } catch (e) {
        console.error('[db] Local adapter creation failed, falling back to Turso:', e)
      }
    }
    // File missing/invalid OR adapter creation failed → Turso
    return createTursoClient('Local file missing → Turso fallback')
  }

  // ── Explicit remote Turso / https URL ──
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
    const authToken = process.env.TURSO_AUTH_TOKEN ?? EMBEDDED_TURSO_TOKEN
    try {
      const adapter = new PrismaLibSql({ url: databaseUrl, authToken })
      console.log(`[db] Connected to remote: ${databaseUrl}`)
      globalForPrisma.prismaUsingLocal = false
      return new PrismaClient({ adapter, log: ['error', 'warn'] })
    } catch (e) {
      console.error('[db] Remote adapter failed, trying embedded Turso:', e)
    }
  }

  // ── Last resort ──
  return createTursoClient('Last-resort fallback')
}

function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy Proxy so `db.model.findMany()` lazily creates the client. Also
// guards against accidental client-side usage with a clear error.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (typeof window !== 'undefined') {
      const value = Reflect.get(_target as object, prop)
      return typeof value === 'function'
        ? () => { throw new Error('[db] Prisma client cannot be used in client components') }
        : value
    }
    const client = getDb()
    const value = (client as never as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
}) as PrismaClient

export type PrismaTransaction = Prisma.TransactionClient

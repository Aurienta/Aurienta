import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma client singleton.
// NOTE: query logging is disabled because it floods stdout and causes
// OOM in memory-constrained sandbox environments. Enable only for local
// debugging with `log: ['query']`.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Transaction client type — passed to appendLedgerEvent and other
// transaction-aware helpers so they can run inside db.$transaction.
export type PrismaTransaction = Prisma.TransactionClient;

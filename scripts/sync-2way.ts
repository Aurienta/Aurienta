import { createClient } from '@libsql/client'

// ═══════════════════════════════════════════════════════════════════
// 2-WAY SYNC: local SQLite ↔ Turso cloud (last-write-wins)
// ═══════════════════════════════════════════════════════════════════
// Strategy per table (by primary key):
//  - Row only on one side → INSERT into the other side
//  - Row on both sides:
//    • If table has `updatedAt` → newer timestamp wins (UPDATE the older side)
//    • Else → compare full-row content hash:
//        - if identical → skip
//        - if different → CONFLICT: cloud wins by default (logged), local overwritten
//  - NO deletes (safety: prevents accidental data loss from one-side wipes)
//
// Safe to run anytime. Idempotent. Wraps each side in a transaction.
// ═══════════════════════════════════════════════════════════════════

const TURSO_URL = 'libsql://aurienta-fortleem.aws-us-east-1.turso.io'
const TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw'
const LOCAL_URL = 'file:/home/z/my-project/db/custom.db'

interface TableSchema {
  name: string
  columns: string[]
  pkColumns: string[]
  hasUpdatedAt: boolean
}

async function getSchema(client: ReturnType<typeof createClient>, table: string): Promise<TableSchema> {
  const colsRes = await client.execute(`PRAGMA table_info("${table}")`)
  const columns: string[] = []
  const pkColumns: string[] = []
  for (const r of colsRes.rows) {
    const name = r.name as string
    const pk = Number(r.pk)
    columns.push(name)
    if (pk > 0) pkColumns.push(name)
  }
  // Fallback: if no PK declared, use rowid
  if (pkColumns.length === 0) pkColumns.push('rowid')
  return { name: table, columns, pkColumns, hasUpdatedAt: columns.includes('updatedAt') }
}

function rowHash(row: Record<string, unknown>, columns: string[]): string {
  // Stable JSON hash of row content (column order normalized)
  const parts: string[] = []
  for (const c of columns) {
    const v = row[c]
    if (v === undefined || v === null) parts.push(`${c}:=NULL`)
    else parts.push(`${c}:=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
  }
  return parts.join('|')
}

function compareTimestamps(a: unknown, b: unknown): number {
  // Returns: 1 if a newer, -1 if b newer, 0 if equal
  const ta = a == null ? '' : String(a)
  const tb = b == null ? '' : String(b)
  if (ta === tb) return 0
  return ta > tb ? 1 : -1 // ISO-8601 strings compare lexicographically
}

async function syncTable(
  turso: ReturnType<typeof createClient>,
  local: ReturnType<typeof createClient>,
  schema: TableSchema
): Promise<{ upToCloud: number; downToLocal: number; updatesUp: number; updatesDown: number; conflicts: number; skipped: number }> {
  const t = schema.name
  const cols = schema.columns
  const pk = schema.pkColumns
  const colList = cols.map((c) => `"${c}"`).join(', ')
  const placeholders = cols.map(() => '?').join(', ')
  const wherePk = pk.map((c) => `"${c}"=?`).join(' AND ')

  const result = { upToCloud: 0, downToLocal: 0, updatesUp: 0, updatesDown: 0, conflicts: 0, skipped: 0 }

  // Fetch all rows from both sides
  const [localRes, cloudRes] = await Promise.all([
    local.execute(`SELECT ${colList} FROM "${t}"`),
    turso.execute(`SELECT ${colList} FROM "${t}"`),
  ])

  const localMap = new Map<string, Record<string, unknown>>()
  const cloudMap = new Map<string, Record<string, unknown>>()
  const keyOf = (row: Record<string, unknown>) => pk.map((c) => String(row[c] ?? 'NULL')).join('|')

  for (const row of localRes.rows) localMap.set(keyOf(row as Record<string, unknown>), row as Record<string, unknown>)
  for (const row of cloudRes.rows) cloudMap.set(keyOf(row as Record<string, unknown>), row as Record<string, unknown>)

  const allKeys = new Set([...localMap.keys(), ...cloudMap.keys()])

  // Batch INSERTs/UPDATEs per side in a transaction
  const upStmts: { sql: string; args: unknown[] }[] = []
  const downStmts: { sql: string; args: unknown[] }[] = []

  for (const key of allKeys) {
    const l = localMap.get(key)
    const c = cloudMap.get(key)

    if (l && !c) {
      // Only in local → INSERT into cloud
      upStmts.push({
        sql: `INSERT OR IGNORE INTO "${t}" (${colList}) VALUES (${placeholders})`,
        args: cols.map((col) => (l[col] === undefined ? null : l[col])),
      })
      result.upToCloud++
    } else if (c && !l) {
      // Only in cloud → INSERT into local
      downStmts.push({
        sql: `INSERT OR IGNORE INTO "${t}" (${colList}) VALUES (${placeholders})`,
        args: cols.map((col) => (c[col] === undefined ? null : c[col])),
      })
      result.downToLocal++
    } else if (l && c) {
      // In both — compare
      if (schema.hasUpdatedAt) {
        const cmp = compareTimestamps(l.updatedAt, c.updatedAt)
        if (cmp === 0) { result.skipped++; continue }
        if (cmp === 1) {
          // local newer → UPDATE cloud
          const setClause = cols.map((col) => `"${col}"=?`).join(', ')
          upStmts.push({
            sql: `UPDATE "${t}" SET ${setClause} WHERE ${wherePk}`,
            args: [...cols.map((col) => (l[col] === undefined ? null : l[col])), ...pk.map((p) => l[p])],
          })
          result.updatesUp++
        } else {
          // cloud newer → UPDATE local
          const setClause = cols.map((col) => `"${col}"=?`).join(', ')
          downStmts.push({
            sql: `UPDATE "${t}" SET ${setClause} WHERE ${wherePk}`,
            args: [...cols.map((col) => (c[col] === undefined ? null : c[col])), ...pk.map((p) => c[p])],
          })
          result.updatesDown++
        }
      } else {
        // No updatedAt — compare full row hash
        const lh = rowHash(l, cols)
        const ch = rowHash(c, cols)
        if (lh === ch) { result.skipped++; continue }
        // Conflict: cloud wins (safer default for shared data)
        const setClause = cols.map((col) => `"${col}"=?`).join(', ')
        downStmts.push({
          sql: `UPDATE "${t}" SET ${setClause} WHERE ${wherePk}`,
          args: [...cols.map((col) => (c[col] === undefined ? null : c[col])), ...pk.map((p) => c[p])],
        })
        result.conflicts++
      }
    }
  }

  // Execute batches in transactions
  if (upStmts.length > 0) {
    await turso.batch(upStmts.map((s) => ({ sql: s.sql, args: s.args as never })))
  }
  if (downStmts.length > 0) {
    await local.batch(downStmts.map((s) => ({ sql: s.sql, args: s.args as never })))
  }

  return result
}

async function main() {
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
  const local = createClient({ url: LOCAL_URL })

  const tablesRes = await local.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'"
  )
  const tables = tablesRes.rows.map((r) => r.name as string)
  console.log(`[sync-2way] Starting 2-way sync for ${tables.length} tables at ${new Date().toISOString()}`)

  let totalUp = 0, totalDown = 0, totalUpdUp = 0, totalUpdDown = 0, totalConf = 0, totalSkip = 0
  const conflicts: string[] = []

  for (const t of tables) {
    try {
      const schema = await getSchema(local, t)
      const r = await syncTable(turso, local, schema)
      totalUp += r.upToCloud; totalDown += r.downToLocal
      totalUpdUp += r.updatesUp; totalUpdDown += r.updatesDown
      totalConf += r.conflicts; totalSkip += r.skipped
      if (r.upToCloud || r.downToLocal || r.updatesUp || r.updatesDown || r.conflicts) {
        console.log(`  ${t}: ↑${r.upToCloud} ↓${r.downToLocal} upd↑${r.updatesUp} upd↓${r.updatesDown} conf${r.conflicts} skip${r.skipped}`)
        if (r.conflicts) conflicts.push(t)
      }
    } catch (e) {
      console.error(`  ${t}: ERROR — ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log('---')
  console.log(`[sync-2way] DONE at ${new Date().toISOString()}`)
  console.log(`  Inserts local→cloud: ${totalUp}`)
  console.log(`  Inserts cloud→local: ${totalDown}`)
  console.log(`  Updates local→cloud: ${totalUpdUp}`)
  console.log(`  Updates cloud→local: ${totalUpdDown}`)
  console.log(`  Conflicts (cloud won): ${totalConf}${conflicts.length ? ' in ' + conflicts.join(', ') : ''}`)
  console.log(`  Unchanged (skipped):  ${totalSkip}`)
  await turso.close(); await local.close()
}

main().catch((e) => { console.error('[sync-2way] FATAL:', e); process.exit(1) })

import { createClient } from '@libsql/client'

const TURSO_URL = 'libsql://aurienta-fortleem.aws-us-east-1.turso.io'
const TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw'
const LOCAL_URL = 'file:/home/z/my-project/db/custom.db'

async function main() {
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
  const local = createClient({ url: LOCAL_URL })
  await local.execute('PRAGMA foreign_keys=OFF')

  const tablesRes = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'"
  )
  const tables = tablesRes.rows.map((r) => r.name as string)
  console.log(`Found ${tables.length} tables to sync`)

  let totalRows = 0
  for (const table of tables) {
    const colsRes = await local.execute(`PRAGMA table_info("${table}")`)
    const cols = colsRes.rows.map((r) => r.name as string)
    if (cols.length === 0) {
      console.log(`  ${table}: no columns (skipped)`)
      continue
    }
    const rowsRes = await turso.execute(`SELECT * FROM "${table}"`)
    await local.execute(`DELETE FROM "${table}"`)
    if (rowsRes.rows.length === 0) {
      console.log(`  ${table}: 0 rows`)
      continue
    }
    const colList = cols.map((c) => `"${c}"`).join(', ')
    const placeholders = cols.map(() => '?').join(', ')
    for (const row of rowsRes.rows) {
      const values = cols.map((c) => (row[c] === undefined ? null : row[c]))
      await local.execute({ sql: `INSERT OR IGNORE INTO "${table}" (${colList}) VALUES (${placeholders})`, args: values as any[] })
    }
    totalRows += rowsRes.rows.length
    console.log(`  ${table}: ${rowsRes.rows.length} rows synced`)
  }
  await local.execute('PRAGMA foreign_keys=ON')
  console.log(`DONE. Total rows synced: ${totalRows}`)
  await turso.close()
  await local.close()
}
main().catch((e) => { console.error(e); process.exit(1) })

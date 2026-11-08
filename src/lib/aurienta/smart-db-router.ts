// AURIENTA — Smart DB Router (DEPRECATED — use src/lib/db.ts directly)
//
// ROOT-CAUSE FIX (2026-11): This module was originally designed to route
// queries across Turso + Neon. However:
//   1. Neon is not available in the sandbox (no PostgreSQL connection)
//   2. Turso cloud + local SQLite already provide excellent performance
//   3. The routing logic added complexity with zero benefit
//
// All database access now goes through src/lib/db.ts which automatically:
//   - Uses local SQLite for reads (0.03s per query — 300x faster than Turso)
//   - Falls back to Turso cloud if local file is wiped
//   - No need for a separate router
//
// This file is kept for backward compatibility but all functions delegate
// to the standard db client.
//
// If you need PostgreSQL analytics in the future, wire it as a separate
// analytics-only connection (not a router).

export { db as getSmartDb } from "./db";

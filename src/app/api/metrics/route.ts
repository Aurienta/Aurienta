import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-process counters (reset on restart). For production, replace with
// a proper metrics registry (prom-client) once the observability stack
// (Workstream 4) is installed.
const STARTED_AT = Date.now();
let requestCount = 0;
export function incrementRequestCount() { requestCount++; }

/**
 * GET /api/metrics
 * Prometheus-format metrics endpoint.
 * Scraped by Prometheus for Grafana dashboards + alerting.
 *
 * NOTE: This is a minimal implementation. Full implementation (prom-client)
 * is Workstream 4 — installed when the observability stack is provisioned.
 */
export async function GET(_req: NextRequest) {
  let userCount = 0;
  let enterpriseCount = 0;
  let ledgerCount = 0;
  let sessionCount = 0;

  try {
    [userCount, enterpriseCount, ledgerCount, sessionCount] = await Promise.all([
      db.user.count(),
      db.enterprise.count(),
      db.ledgerEvent.count(),
      db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    ]);
  } catch {
    // If DB is down, still report uptime + request count
  }

  const uptimeSeconds = (Date.now() - STARTED_AT) / 1000;

  const metrics = [
    `# HELP aurenta_uptime_seconds Time since process start`,
    `# TYPE aurenta_uptime_seconds counter`,
    `aurenta_uptime_seconds ${uptimeSeconds}`,
    ``,
    `# HELP aurenta_users_total Total number of registered users`,
    `# TYPE aurenta_users_total gauge`,
    `aurenta_users_total ${userCount}`,
    ``,
    `# HELP aurenta_enterprises_total Total number of enterprises`,
    `# TYPE aurenta_enterprises_total gauge`,
    `aurenta_enterprises_total ${enterpriseCount}`,
    ``,
    `# HELP aurenta_ledger_events_total Total ledger events`,
    `# TYPE aurenta_ledger_events_total gauge`,
    `aurenta_ledger_events_total ${ledgerCount}`,
    ``,
    `# HELP aurenta_active_sessions_total Active (non-revoked, non-expired) sessions`,
    `# TYPE aurenta_active_sessions_total gauge`,
    `aurenta_active_sessions_total ${sessionCount}`,
    ``,
    `# HELP aurenta_http_requests_total Total HTTP requests since start`,
    `# TYPE aurenta_http_requests_total counter`,
    `aurenta_http_requests_total ${requestCount}`,
    ``,
    `# HELP aurenta_build_info Build information`,
    `# TYPE aurenta_build_info gauge`,
    `aurenta_build_info{version="1.0",phase="production-hardening"} 1`,
  ].join("\n");

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// AURIENTA structured logger — JSON to stdout for production observability.
// Levels: debug < info < warn < error.  Silent below LOG_LEVEL (default "info").
// Each line is a single JSON object so a log shipper (Loki, Datadog, CloudWatch)
// can ingest it without parsing.

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ENV_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

function shouldLog(level: LogLevel) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[ENV_LEVEL];
}

function write(level: LogLevel, msg: string, fields?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "aurienta",
    env: process.env.NODE_ENV ?? "development",
    ...fields,
  };
  // Errors go to stderr, everything else to stdout — convention.
  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(JSON.stringify(record) + "\n");
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => write("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => write("error", msg, fields),
};

/** Wrap an async function — logs duration + success/failure, re-throws. */
export async function withTiming<T>(
  op: string,
  fn: () => Promise<T>,
  fields?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(op, { ...fields, ms: Date.now() - start, ok: true });
    return result;
  } catch (e) {
    logger.error(op, {
      ...fields,
      ms: Date.now() - start,
      ok: false,
      err: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

// Node.js-only instrumentation — loaded via dynamic import from instrumentation.ts
// so that `process.on` calls don't break Edge Runtime evaluation.

export function registerNodeHandlers() {
  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("[FATAL] Unhandled Promise Rejection:", reason);
    // In production, forward to an observability backend (Sentry/Datadog/Logflare)
    // once integrated. For now, the structured log line is captured by Vercel.
  });

  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("[FATAL] Uncaught Exception:", error);
    // Do NOT re-throw — let the serverless runtime restart the process.
    // Re-throwing here would crash the worker without a clean response.
  });

  // eslint-disable-next-line no-console
  console.log("[instrumentation] Global error handlers registered.");
}

registerNodeHandlers();

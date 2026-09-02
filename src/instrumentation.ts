// Next.js instrumentation hook — auto-loaded once on server startup.
// Registers global handlers for unhandled promise rejections and uncaught
// exceptions so they are logged (and forwarded to observability in prod)
// instead of being silently swallowed.
//
// The Node.js-only error handlers are loaded via dynamic import so this file
// itself is Edge-compatible (it doesn't reference `process.on` at the top
// level, which would break Edge Runtime evaluation).
//
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only register on the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Dynamic import keeps the `process.on` calls out of the Edge-evaluated
  // module graph.
  await import("./instrumentation-node");
}

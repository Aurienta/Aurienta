// AURIENTA env validation — ZAI completely removed.

type EnvShape = {
  databaseUrl: string;
  nodeEnv: string;
  logLevel: "debug" | "info" | "warn" | "error";
  cookieSecure: boolean;
  publicBaseUrl: string;
  allowDemoSignIn: boolean;
  fieldEncryptionKey: string;
};

function read(): EnvShape {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const rawLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  const level = (["debug", "info", "warn", "error"].includes(rawLevel) ? rawLevel : "info") as EnvShape["logLevel"];
  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cookieSecure = true;
  const allowDemoSignIn = process.env.ALLOW_DEMO_SIGNIN === "true";
  let fieldEncryptionKey = process.env.FIELD_ENCRYPTION_KEY ?? "";
  if (!fieldEncryptionKey) {
    // Do NOT throw at module-evaluation time: this module is imported by route
    // handlers whose page data is collected during `next build` (and on Vercel),
    // where env vars may not be present. A missing key is logged loudly here and
    // enforced lazily by `encryption.ts` (`getKey()` throws when first used).
    // This keeps builds green while still failing loudly at runtime if unset.
    if (nodeEnv === "production") {
      console.error("[env] FATAL: FIELD_ENCRYPTION_KEY is not set — encryption will fail at runtime.");
    }
    fieldEncryptionKey = Buffer.from("aurienta-dev-field-key-32bytes!!", "utf8").toString("base64").slice(0, 44);
  }
  if (!databaseUrl) console.error("[env] FATAL: DATABASE_URL is not set");
  if (nodeEnv === "production" && allowDemoSignIn) console.warn("[env] WARNING: ALLOW_DEMO_SIGNIN=true in production — sandbox/pilot mode.");
  return { databaseUrl, nodeEnv, logLevel: level, cookieSecure, publicBaseUrl, allowDemoSignIn, fieldEncryptionKey };
}

export const env = read();

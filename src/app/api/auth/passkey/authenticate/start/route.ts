// Passkey authentication — start.
//
// Generates WebAuthn authentication options. No auth required — this is the
// passwordless signin flow. The browser passes the returned options to
// `startAuthentication()` from @simplewebauthn/browser.
//
// Optional `email` body field: when provided, the allowCredentials list is
// scoped to that user's registered passkeys (better UX — the browser
// highlights the right credential). When omitted, the browser shows all
// passkeys the user has for this RP ID.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getRpConfig,
  generateAuthenticationOptionsForCredentials,
  listCredentialsForEmail,
} from "@/lib/aurienta/passkey";
import { setChallengeCookie } from "@/lib/aurienta/passkey-challenge";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { logger } from "@/lib/aurienta/logger";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(254).optional(),
});

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = clientIp(req);

  // ── Rate-limit (DB-backed — AUD-030 / AUD-031) ──
  // Passkey ceremonies are replay-able: an attacker could spam /start to
  // consume server CPU and pollute challenge cookies. 15/min/IP.
  const rl = await limiters.passkeyDb(ip);
  if (!rl.allowed) {
    logger.warn("passkey authenticate/start rate-limited", { ip, resetAt: rl.resetAt });
    return rateLimitedResponse(rl.resetAt);
  }

  let parsed: z.infer<typeof bodySchema>;
  // FIX (COO-AUDIT P2): distinguish empty body (valid) from malformed JSON (invalid)
  const rawBody = await req.text();
  if (rawBody.trim() === "") {
    parsed = {};
  } else {
    try {
      parsed = bodySchema.parse(JSON.parse(rawBody));
    } catch {
      return NextResponse.json(
        { error: "Bad request — invalid JSON body. Expected: { email?: string }" },
        { status: 400 }
      );
    }
  }

  // If email provided, scope allowCredentials to that user. If the email
  // doesn't match a real user we still return options (with empty
  // allowCredentials) so the response shape doesn't leak whether the email
  // exists.
  let allowCredentials: { id: string; transports?: string[] }[] = [];
  if (parsed.email) {
    const email = parsed.email.trim().toLowerCase();
    const { credentials } = await listCredentialsForEmail(email);
    allowCredentials = credentials.map((c) => ({ id: c.id, transports: c.transports }));
  }

  const host = req.headers.get("host");
  const rpConfig = getRpConfig(host);
  const options = await generateAuthenticationOptionsForCredentials(
    allowCredentials,
    rpConfig
  );

  await setChallengeCookie(options.challenge);
  logger.info("passkey authenticate start", { ip, scoped: !!parsed.email });

  return NextResponse.json({ options });
}, "POST /api/auth/passkey/authenticate/start");

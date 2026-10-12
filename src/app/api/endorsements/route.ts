// /api/endorsements — Constitutional Endorsement API.
//
// GET  — list the current user's endorsements (active + resolved).
// POST — create a new endorsement. Body: { enterpriseId, stakeSts }.
//
// Reputation-as-collateral, NOT financial staking. The CRE policy
// (enforceConstitutionalEndorsement) gates creation; on denial the response
// is 400 with the verdict's reason + policy + decisionToken so the client
// can surface them.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import {
  createEndorsement,
  listEndorsementsByUser,
  ENDORSEMENT_STAKE_CAP,
  DenialError,
} from "@/lib/aurienta/constitutional-endorsement";

// ── Zod schema ──
const createSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  stakeSts: z.number().int().min(1).max(ENDORSEMENT_STAKE_CAP),
});

// ── GET /api/endorsements ──
// Returns the current user's endorsements, newest-first (active before resolved).
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const endorsements = await listEndorsementsByUser(user.id);
  return NextResponse.json({ endorsements });
}, "GET /api/endorsements");

// ── POST /api/endorsements ──
// Body: { enterpriseId, stakeSts (1..15) }
// On CRE denial returns 400 with { error, policy, decisionToken, reason }.
// On success returns 200 with { endorsement, verdict }.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        message: parsed.error.issues[0]?.message ?? "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const { endorsement, verdict } = await createEndorsement({
      endorserId: user.id,
      enterpriseId: parsed.data.enterpriseId,
      stakeSts: parsed.data.stakeSts,
    });
    return NextResponse.json({ endorsement, verdict }, { status: 200 });
  } catch (e) {
    if (e instanceof DenialError) {
      // CRE denial — return the verdict so the client can display policy +
      // decisionToken + reason verbatim.
      await audit({
        actorId: user.id,
        action: "endorsement.create.denied",
        target: `enterprise:${parsed.data.enterpriseId}`,
        result: "denied",
        reason: e.verdict.reason,
        metadata: {
          policy: e.verdict.policy,
          stakeSts: parsed.data.stakeSts,
        },
      });
      return NextResponse.json(
        {
          error: e.message,
          reason: e.verdict.reason,
          policy: e.verdict.policy,
          decisionToken: e.verdict.decisionToken,
        },
        { status: 400 }
      );
    }
    // Re-throw other errors (resource-not-found, db errors) — withErrorHandler
    // translates them.
    throw e;
  }
}, "POST /api/endorsements");

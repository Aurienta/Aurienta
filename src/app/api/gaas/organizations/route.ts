// AURIENTA GaaS API — /api/gaas/organizations
// ═══════════════════════════════════════════════════════════════════
//  GET  : list the current user's GaaS organizations
//  POST : register a new GaaS organization
//
// Pure technology infrastructure — AURIENTA does not manage funds,
// securities, or custody. Subscription pricing only.
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  listOrganizations,
  registerOrganization,
  type SubscriptionPlan,
} from "@/lib/aurienta/gaas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "cooperative",
  "ngo",
  "family_office",
  "dao",
  "other",
]);
const ALLOWED_PLANS = new Set<SubscriptionPlan>(["free", "standard", "enterprise"]);

// ── GET /api/gaas/organizations ──
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");
  try {
    const orgs = await listOrganizations({
      id: user.id,
      email: user.email,
      isAurientaRep,
    });
    return NextResponse.json({ organizations: orgs });
  } catch (e) {
    logger.error("[GET /api/gaas/organizations] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to list organizations" },
      { status: 500 }
    );
  }
}

// ── POST /api/gaas/organizations ──
// Body: { name, type, contactEmail, subscriptionPlan }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  let body: {
    name?: unknown;
    type?: unknown;
    contactEmail?: unknown;
    subscriptionPlan?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const contactEmail =
    typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const subscriptionPlan =
    typeof body.subscriptionPlan === "string" ? body.subscriptionPlan : "standard";

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Name must be 2–120 characters" },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Invalid organization type" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json(
      { error: "Invalid contact email" },
      { status: 400 }
    );
  }
  if (!ALLOWED_PLANS.has(subscriptionPlan as SubscriptionPlan)) {
    return NextResponse.json(
      { error: "Invalid subscription plan" },
      { status: 400 }
    );
  }

  try {
    const org = await registerOrganization({
      name,
      type: type as "cooperative" | "ngo" | "family_office" | "dao" | "other",
      contactEmail,
      subscriptionPlan: subscriptionPlan as SubscriptionPlan,
    });

    await audit({
      actorId: user.id,
      action: "gaas.organization.register",
      target: `gaas_org:${org.id}`,
      result: "allowed",
      metadata: {
        organizationId: org.id,
        slug: org.slug,
        type: org.type,
        subscriptionPlan: org.subscriptionPlan,
        monthlyFeeEgp: org.monthlyFeeEgp,
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "An organization with that slug already exists" },
        { status: 409 }
      );
    }
    logger.error("[POST /api/gaas/organizations] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to register organization" },
      { status: 500 }
    );
  }
}

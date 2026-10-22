import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { configureIntegration, switchToNative, listIntegrations, ERP_PROVIDERS, type ErpProvider } from "@/lib/aurienta/erp-integration";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list integrations + available providers
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const enterpriseId = new URL(req.url).searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });

  // Check membership
  const isMember = user.memberships?.some((m: any) => m.enterpriseId === enterpriseId);
  if (!isMember && user.primaryIntent !== "aurienta_rep") {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const integrations = await listIntegrations(enterpriseId);

  return NextResponse.json({
    integrations,
    providers: Object.entries(ERP_PROVIDERS).map(([key, val]) => ({
      id: key,
      ...val,
    })),
  });
});

// POST — configure or switch integration
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { enterpriseId, provider, name, config, syncDirection, syncInterval, modules, creEnforcementEnabled, fieldMapping } = body;

  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

  // Check membership (manager+ only)
  const membership = user.memberships?.find((m: any) => m.enterpriseId === enterpriseId);
  if (!membership && user.primaryIntent !== "aurienta_rep") {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  if (!["manager", "founding_operator", "board_member", "company_owner"].includes(membership?.role || "") && user.primaryIntent !== "aurienta_rep") {
    return NextResponse.json({ error: "Requires manager+ role" }, { status: 403 });
  }

  let integration;

  if (provider === "native") {
    integration = await switchToNative(enterpriseId);
  } else {
    integration = await configureIntegration(enterpriseId, {
      provider: provider as ErpProvider,
      name: name || ERP_PROVIDERS[provider as ErpProvider]?.label || "External ERP",
      config: config || {},
      syncDirection: syncDirection || "bidirectional",
      syncInterval: syncInterval || "hourly",
      modules: modules || ["projects", "tasks", "inventory", "procurement", "assets", "production", "quality", "timesheets"],
      creEnforcementEnabled: creEnforcementEnabled !== false,
      fieldMapping: fieldMapping || {},
    });
  }

  return NextResponse.json({ integration });
});

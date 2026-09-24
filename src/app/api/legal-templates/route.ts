import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/legal-templates
// Lists all available legal templates (metadata only — no content).
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { listTemplates } = await import("@/lib/aurienta/legal-templates");
  const templates = listTemplates();
  return NextResponse.json({
    total: templates.length,
    templates,
  });
});

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { referenceCache, cacheAside } from "@/lib/aurienta/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/legal-templates
// Lists all available legal templates (metadata only — no content).
// PERFORMANCE: Template catalog is static (defined in legal-templates.ts).
// Cache the metadata list for 5 min — avoids re-running listTemplates()
// (which iterates 20+ template definitions) on every request.
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const result = await cacheAside(referenceCache, "legal-templates:list", async () => {
    const { listTemplates } = await import("@/lib/aurienta/legal-templates");
    const templates = listTemplates();
    return {
      total: templates.length,
      templates,
    };
  }, 300_000);
  return NextResponse.json(result, {
    headers: {
      // Static reference data — cache aggressively in browser/CDN
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Cache": "aurienta-reference",
    },
  });
});

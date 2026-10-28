import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/legal-templates/[id]/render
// Renders a legal template with the provided variables.
// Body: { variables: { "enterpriseName": "...", "founderName": "...", ... } }
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // FIX (COO-AUDIT P2): safe body parse — return 400 on malformed JSON instead of 500
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Bad request — JSON body required with { variables: {...} }" },
      { status: 400 }
    );
  }
  const variables = body.variables ?? {};

  const { renderTemplate } = await import("@/lib/aurienta/legal-templates");

  try {
    const rendered = renderTemplate(id, variables);
    return NextResponse.json({
      templateId: id,
      rendered,
      renderedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 400 }
    );
  }
});

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
  const body = await req.json();
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

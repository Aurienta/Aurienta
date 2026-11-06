import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { createDocument, getDocumentsForUser, signDocument, hashDocument, DOCUMENT_TEMPLATES } from "@/lib/aurienta/e-signature";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const docs = await getDocumentsForUser(user.id);
  return NextResponse.json({ documents: docs, templates: DOCUMENT_TEMPLATES });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const documentHash = hashDocument(body.body || "");
  const result = await createDocument({
    title: body.title,
    body: body.body,
    templateId: body.templateId,
    createdBy: user.id,
    signerEmails: body.signerEmails || [],
  });
  return NextResponse.json(result);
});

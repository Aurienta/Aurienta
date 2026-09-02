import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { mockCid, mockHash } from "@/lib/aurienta/ai";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { parseBody, skillEquitySchema } from "@/lib/aurienta/validation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// Constants for the 2-year tenure rule
const TENURE_REQUIRED_MONTHS = 24;
const VALID_CREDENTIAL_TYPES = [
  "certification",
  "degree",
  "training_course",
  "professional_license",
];

// Helper: compute full months between two dates (floor).
function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  // If the day-of-month hasn't been reached yet, subtract one.
  if (to.getDate() < from.getDate()) return Math.max(0, months - 1);
  return Math.max(0, months);
}

// POST /api/skill-equity
// Body:
//   { employeeId, credentialType, credentialName, issuer, credentialId?, issueDate, documentName, documentMime, documentSizeBytes }
// Server re-fetches the Employee, computes tenureMonths from hireDate, enforces ≥24,
// generates a mock CID + hash for the uploaded document, creates a SkillEquityClaim
// with status "pending".
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await parseBody(req, skillEquitySchema);
  if (body instanceof NextResponse) return body;
  const {
    employeeId,
    credentialType,
    credentialName,
    issuer,
    credentialId,
    issueDate,
    documentName,
  } = body;

  // ── Required fields ──
  // (parseBody + skillEquitySchema already enforce required fields, type, and
  // length constraints. We keep an explicit guard for clarity.)
  if (!employeeId || !credentialType || !credentialName || !issuer || !issueDate || !documentName) {
    return NextResponse.json(
      {
        error:
          "employeeId, credentialType, credentialName, issuer, issueDate, and documentName are required.",
      },
      { status: 400 }
    );
  }

  // Note: parseBody + skillEquitySchema already validates credentialType is in
  // the allowed enum and that documentMime / documentSizeBytes are well-formed.
  // The legacy guards below are kept as defence-in-depth.

  if (!VALID_CREDENTIAL_TYPES.includes(credentialType)) {
    return NextResponse.json(
      { error: `credentialType must be one of: ${VALID_CREDENTIAL_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate the document (PDF/JPG/PNG) — schema enforces mime enum, this is a redundant guard.
  const mime = body.documentMime;
  if (!["application/pdf", "image/jpeg", "image/png"].includes(mime)) {
    return NextResponse.json(
      { error: "Document must be a PDF, JPG, or PNG.", code: "invalid_document" },
      { status: 400 }
    );
  }
  const sizeBytes = Math.floor(Number(body.documentSizeBytes) || 0);
  if (sizeBytes <= 0) {
    return NextResponse.json(
      { error: "Document file is empty.", code: "invalid_document" },
      { status: 400 }
    );
  }
  if (sizeBytes > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Document exceeds the 20 MB ceiling.", code: "invalid_document" },
      { status: 400 }
    );
  }

  // Validate issue date
  const issueDateParsed = new Date(issueDate);
  if (Number.isNaN(issueDateParsed.getTime())) {
    return NextResponse.json(
      { error: "issueDate is not a valid date." },
      { status: 400 }
    );
  }
  if (issueDateParsed.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "issueDate cannot be in the future." },
      { status: 400 }
    );
  }

  // ── Load the Employee record and verify ownership ──
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { enterprise: { select: { id: true, name: true, tier: true, slug: true } } },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employment record not found." }, { status: 404 });
  }
  if (employee.userId !== user.id) {
    return NextResponse.json(
      { error: "This employment record belongs to another partner." },
      { status: 403 }
    );
  }

  // ── TENURE ENFORCEMENT (server-side, fail-secure) ──
  const tenureMonths = monthsBetween(employee.hireDate, new Date());
  if (tenureMonths < TENURE_REQUIRED_MONTHS) {
    return NextResponse.json(
      {
        error: `Not eligible: ${TENURE_REQUIRED_MONTHS} months of continuous employment required (you have ${tenureMonths} months).`,
        code: "tenure_not_met",
        requiredMonths: TENURE_REQUIRED_MONTHS,
        tenureMonths,
      },
      { status: 403 }
    );
  }

  // ── Mock IPFS upload + SHA3-256 hash of the document ──
  const documentCid = mockCid();
  const documentHash = mockHash();

  const claim = await db.skillEquityClaim.create({
    data: {
      employeeId: employee.id,
      userId: user.id,
      enterpriseId: employee.enterpriseId,
      tenureMonths,
      tenureVerified: true,
      credentialType,
      credentialName: String(credentialName).trim().slice(0, 200),
      issuer: String(issuer).trim().slice(0, 200),
      credentialId: credentialId ? String(credentialId).trim().slice(0, 120) : null,
      issueDate: issueDateParsed,
      documentCid,
      documentName: String(documentName).slice(0, 200),
      documentHash,
      status: "pending",
    },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, slug: true } },
    },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId: employee.enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "skill_equity_claim_submitted",
        claimId: claim.id,
        userId: user.id,
        credentialType,
        credentialName: claim.credentialName,
        issuer: claim.issuer,
        tenureMonths,
        documentCid,
        documentHash,
        note:
          `Skill-to-Equity claim submitted. Tenure verified at ${tenureMonths} months ` +
          `(≥ ${TENURE_REQUIRED_MONTHS} required). Document pinned to IPFS. Awaiting board review + AI assessment.`,
      },
      actorId: user.id,
    });
  });

  return NextResponse.json({ claim }, { status: 201 });
}, "POST /api/skill-equity");

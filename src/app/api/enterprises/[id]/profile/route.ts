import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { logger } from "@/lib/aurienta/logger";
import {
  buildViewerContext,
  sanitizeEmployeeListForViewer,
  type ViewerContext,
} from "@/lib/aurienta/transparency";

export const runtime = "nodejs";

// PATCH /api/enterprises/[id]/profile
// Updates the extended enterprise profile fields (institutional due-diligence).
// Only the founding operator or company owner can update the profile.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: enterpriseId } = await params;

    // Verify the enterprise exists
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, founderId: true, slug: true },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    // Only the founding operator or company owner can update the profile
    const isFounder = enterprise.founderId === user.id;
    const membership = user.memberships.find(
      (m) => m.enterpriseId === enterpriseId && (m.role === "founding_operator" || m.role === "company_owner")
    );

    if (!isFounder && !membership) {
      return NextResponse.json(
        { error: "Only the Founding Operator or Company Owner can update the enterprise profile" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Extract only allowed profile fields — never accept arbitrary fields
    const allowedFields = [
      "website", "logoUrl", "mission", "vision", "problem", "solution",
      "productService", "targetMarket", "revenueModel", "currentCustomers",
      "pitchDeckUrl", "founderVideoUrl", "githubUrl", "linkedinUrl",
      "twitterUrl", "founderBio", "founderStatement", "founderRequest",
    ];

    const updateData: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (field in body) {
        const value = body[field];
        // Sanitize: strings only, max 5000 chars, null allowed
        if (value === null || (typeof value === "string" && value.length <= 5000)) {
          updateData[field] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update the enterprise profile AND record the ledger event in a single
    // transaction. appendLedgerEvent requires a PrismaTransaction client (tx)
    // because it calls tx.ledgerEvent.findFirst + tx.ledgerEvent.create to
    // maintain the hash-chain integrity. Passing `undefined` would crash at
    // runtime. (P1-1 fix — CTO/COO audit finding.)
    const updated = await db.$transaction(async (tx) => {
      const enterprise = await tx.enterprise.update({
        where: { id: enterpriseId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          logoUrl: true,
          mission: true,
          vision: true,
          problem: true,
          solution: true,
          productService: true,
          targetMarket: true,
          revenueModel: true,
          currentCustomers: true,
          pitchDeckUrl: true,
          founderVideoUrl: true,
          githubUrl: true,
          linkedinUrl: true,
          twitterUrl: true,
          founderBio: true,
          founderStatement: true,
          founderRequest: true,
          evidenceLevel: true,
          submissionStatus: true,
        },
      });

      // Record the profile update on the immutable ledger (same tx)
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "profile_updated",
        payload: { fields: Object.keys(updateData), updatedBy: user.id },
        actorId: user.id,
      });

      return enterprise;
    });

    logger.info("Enterprise profile updated", {
      enterpriseId,
      fields: Object.keys(updateData),
      userId: user.id,
    });

    return NextResponse.json({ enterprise: updated });
  } catch (error) {
    logger.error("Enterprise profile update failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update enterprise profile" },
      { status: 500 }
    );
  }
}

// GET /api/enterprises/[id]/profile
// Returns the extended enterprise profile for institutional due-diligence.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: enterpriseId } = await params;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        sector: true,
        tier: true,
        stage: true,
        legalForm: true,
        // Core constitutional fields
        fundraisingGoalEgp: true,
        raisedEgp: true,
        equityUnitPriceEgp: true,
        totalEquityUnits: true,
        founderEquityPct: true,
        lawFirmClientAccountBalanceEgp: true,
        graduationReadiness: true,
        healthScore: true,
        healthRating: true,
        nosiCompliantPct: true,
        policeClearanceValid: true,
        consultingOptOut: true,
        status: true,
        // Extended profile
        website: true,
        logoUrl: true,
        mission: true,
        vision: true,
        problem: true,
        solution: true,
        productService: true,
        targetMarket: true,
        revenueModel: true,
        currentCustomers: true,
        pitchDeckUrl: true,
        founderVideoUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        founderBio: true,
        founderStatement: true,
        founderRequest: true,
        evidenceLevel: true,
        submissionStatus: true,
        // Relations
        founder: { select: { id: true, legalName: true, sovereignTrustScore: true } },
        ownershipRecords: { select: { id: true, equityUnits: true, avgPriceEgp: true, userId: true } },
        employees: { select: { id: true, userId: true, position: true, department: true, employmentType: true, compensationBand: true, monthlySalaryEgp: true, nosiStatus: true, keyPerson: true, equityConversionPct: true, hireDate: true } },
        documents: { select: { id: true, documentType: true, title: true, description: true, fileUrl: true, fileName: true, evidenceLevel: true, verificationStatus: true, visibilityClass: true, uploadedAt: true } },
        milestones: { select: { id: true, title: true, description: true, amountEgp: true, status: true, dueAt: true, releasedAt: true } },
        _count: { select: { ownershipRecords: true, employees: true, proposals: true, ledgerEvents: true } },
      },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    // ── AURIENTA Transparency Authorization (§8.6.2) ──
    // Determine the viewer's role in this enterprise, then sanitize the
    // employee list so that protected personal data (NOSI number, national ID,
    // exact salary for non-managers) is never exposed to viewers who lack
    // constitutional authority to see it. See src/lib/aurienta/transparency.ts.
    let viewer: ViewerContext | null = buildViewerContext(
      user.memberships,
      user.id,
      enterpriseId,
    );
    if (!viewer) {
      // The viewer is authenticated but has no membership in this enterprise
      // (e.g. a Capital Partner browsing the Enterprise Registry). They still
      // see the public Employee Registry — positions, departments, hire dates —
      // but no salary or band data. Treat them as an external capital_partner
      // whose enterpriseId deliberately does not match, so canSeeExactSalary
      // and canSeeSalaryBand both return false for non-managers.
      viewer = {
        role: "capital_partner",
        userId: user.id,
        enterpriseId: "__external_viewer__",
        isBoardMember: false,
        isManager: false,
      };
    }

    const sanitizedEmployees = sanitizeEmployeeListForViewer(
      enterprise.employees.map((e) => ({
        ...e,
        // Employee.status is not currently a DB column; default to "active"
        // so the sanitized output's required `status` field is populated.
        status: "active",
      })),
      viewer,
    );

    return NextResponse.json({
      enterprise: { ...enterprise, employees: sanitizedEmployees },
    });
  } catch (error) {
    logger.error("Enterprise profile fetch failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch enterprise profile" },
      { status: 500 }
    );
  }
}

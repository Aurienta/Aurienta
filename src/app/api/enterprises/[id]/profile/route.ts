import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { logger } from "@/lib/aurienta/logger";

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

    // Update the enterprise profile
    const updated = await db.enterprise.update({
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

    // Record the profile update on the immutable ledger
    await appendLedgerEvent(undefined, {
      enterpriseId,
      eventType: "profile_updated",
      payload: { fields: Object.keys(updateData), updatedBy: user.id },
      actorId: user.id,
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
        employees: { select: { id: true, position: true, department: true, employmentType: true, compensationBand: true, monthlySalaryEgp: true, nosiStatus: true, keyPerson: true, equityConversionPct: true, hireDate: true } },
        documents: { select: { id: true, documentType: true, title: true, description: true, fileUrl: true, fileName: true, evidenceLevel: true, verificationStatus: true, visibilityClass: true, uploadedAt: true } },
        milestones: { select: { id: true, title: true, description: true, amountEgp: true, status: true, dueAt: true, releasedAt: true } },
        _count: { select: { ownershipRecords: true, employees: true, proposals: true, ledgerEvents: true } },
      },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    return NextResponse.json({ enterprise });
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

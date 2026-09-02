// AURIENTA Expenses Budget vs Actual API — Blueprint §8.14
// Provides the Constitutional Expenses Dashboard data:
// - Summary cards (total expenses current month/quarter, budget utilization, pending approvals)
// - Budget vs actual by category
// - Category breakdown with approval status
// - Aggregated salary expenses (for non-board shareholders)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { aggregateExpensesByCategory, getVisibleExpenseCategories } from "@/lib/aurienta/transparency";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/expenses/budget?enterpriseId=xxx&period=month|quarter
// Returns the budget-vs-actual dashboard data per blueprint §8.14.3
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  const period = url.searchParams.get("period") ?? "month"; // month or quarter

  if (!enterpriseId) {
    return NextResponse.json({ error: "enterpriseId is required" }, { status: 400 });
  }

  // Must be a member of the enterprise
  const membership = user.memberships.find((m) => m.enterpriseId === enterpriseId);
  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }

  const isBoard = membership.role === "board_member" ||
    membership.role === "founding_operator" ||
    membership.role === "company_owner";

  // Calculate date range
  const now = new Date();
  let periodStart: Date;
  if (period === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    periodStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Fetch expenses in the period
  const expenses = await db.expense.findMany({
    where: {
      enterpriseId,
      createdAt: { gte: periodStart },
    },
    select: {
      id: true,
      category: true,
      description: true,
      vendor: true,
      amountEgp: true,
      status: true,
      createdAt: true,
      approver1Id: true,
      submittedById: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // ── Summary Cards (§8.14.3a) ──
  const approvedExpenses = expenses.filter((e) => e.status === "approved");
  const totalMonth = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amountEgp, 0);

  const totalQuarter = expenses
    .filter((e) => e.createdAt >= periodStart)
    .reduce((s, e) => s + e.amountEgp, 0);

  const pendingApprovals = expenses.filter((e) =>
    ["pending", "dual_signature_pending", "pending_board"].includes(e.status)
  ).length;

  // ── Budget vs Actual by Category (§8.14.3b) ──
  // Budget is stored per-category. For now, we compute actuals by category.
  // Budget values can be added to the Enterprise model or a separate Budget model.
  const categoryActuals = aggregateExpensesByCategory(
    expenses.map((e) => ({ category: e.category, amountEgp: e.amountEgp, status: e.status }))
  );

  // ── Category Breakdown ──
  // For board members: show all individual expense line items
  // For non-board: aggregate salary/payroll categories, show individual for others
  const visibleCategories = getVisibleExpenseCategories(membership.role as any, isBoard);

  const expenseLineItems = expenses
    .filter((e) => {
      // Board sees everything
      if (isBoard) return true;
      // Non-board: salary/payroll categories are aggregated, not shown individually
      const salaryLike = ["salaries", "payroll", "salaries_wages"].includes(
        e.category.toLowerCase()
      );
      return !salaryLike;
    })
    .map((e) => ({
      id: e.id,
      category: e.category,
      description: e.description,
      vendor: e.vendor,
      amountEgp: e.amountEgp,
      status: e.status,
      createdAt: e.createdAt,
      isMySubmission: e.submittedById === user.id,
    }));

  // ── Budget utilization ──
  // Since we don't have a Budget model yet, we estimate quarterly budget
  // as 25% of the enterprise's annual operating budget (if available).
  // For now, use a placeholder derived from fundraising goal.
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { fundraisingGoalEgp: true, raisedEgp: true, monthlyBurnEgp: true },
  });

  const estimatedQuarterlyBudget = enterprise?.monthlyBurnEgp
    ? enterprise.monthlyBurnEgp * 3
    : enterprise
    ? Math.round((enterprise.fundraisingGoalEgp / 12) * 3)
    : 0;

  const budgetUtilizationPct =
    estimatedQuarterlyBudget > 0
      ? Math.round((totalQuarter / estimatedQuarterlyBudget) * 100)
      : 0;

  // Budget status: 🟢 ≤80%, 🟡 80-100%, 🔴 >100%
  const budgetStatus =
    budgetUtilizationPct <= 80 ? "ok" : budgetUtilizationPct <= 100 ? "warning" : "over_budget";

  return NextResponse.json({
    ok: true,
    period: {
      type: period,
      start: periodStart,
      end: now,
    },
    summary: {
      totalMonth,
      totalQuarter,
      pendingApprovals,
      estimatedQuarterlyBudget,
      budgetUtilizationPct,
      budgetStatus,
    },
    categoryActuals,
    expenseLineItems,
    isBoard,
    visibleCategories,
  });
}, "GET /api/expenses/budget");

// AURIENTA Constitutional Transparency Authorization Library
//
// Implements the §8.6.2 AURIENTA Transparency Rules and §8.14.2 Expense
// Transparency rules from the Master Blueprint. Every employee/expense record
// that flows to a viewer MUST be passed through this library before being
// serialised in an API response.
//
// The model is tier/role-aware: a Capital Partner sees salary BANDS only (and
// exact salary for managers per the Labour Law exception), the Constitutional
// Council (board) sees everything, the Law Firm Rep sees contract details for
// notarisation, etc. Protected personal data (NOSI number, national ID, home
// address, phone, medical) is NEVER exposed outside the board / self.
//
// All functions are PURE and DETERMINISTIC — given the same inputs they always
// return the same output, which makes the sanitization behaviour fully
// testable. No DB access, no I/O, no side effects.

// ─────────────────────────────────────────────────────────────────────────────
// VIEWER ROLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constitutional role hierarchy for transparency purposes. These map 1:1 to the
 * EnterpriseMember.role values stored in the database.
 */
export type ViewerRole =
  | "capital_partner"      // Capital Partner — sees bands + aggregated data
  | "founding_operator"    // Founding Operator — sees exact for their enterprise
  | "company_owner"        // Company Owner — same as founding_operator
  | "manager"              // Manager — sees exact for direct reports + aggregated
  | "board_member"         // Constitutional Council — sees everything
  | "law_firm_rep"         // Law Firm Rep — sees contract details for notarisation
  | "accounting_firm_rep"  // Accounting Firm Rep — sees financial details for audit
  | "aurienta_rep"         // AURIENTA Rep — platform operator, sees aggregated
  | "university_rep"       // University Rep — sees limited public data
  | "workforce_partner";   // Workforce Partner — sees their own data only

/**
 * Viewer context passed to every transparency function. Built by the API route
 * from the authenticated user's memberships in the target enterprise.
 */
export interface ViewerContext {
  role: ViewerRole;
  userId: string;
  enterpriseId: string;
  isBoardMember: boolean;
  isManager: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSE CATEGORIES (§8.14.2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical blueprint expense categories (§8.14.2). Categories the database
 * stores in short codes (e.g. "payroll", "rent", "marketing") are mapped to
 * these canonical labels via {@link canonicalizeExpenseCategory}.
 */
export const EXPENSE_CATEGORIES = [
  "salaries",                  // Salaries & wages
  "payroll",                   // alias for salaries
  "law_firm_legal_fees",       // Law firm & legal fees
  "office_rent_utilities",     // Office rent & utilities
  "amenities",                 // Amenities
  "marketing_advertising",     // Marketing & advertising
  "software_subscriptions",    // Software & subscriptions
  "travel_transportation",     // Travel & transportation
  "equipment_maintenance",     // Equipment & maintenance
  "training_development",      // Training & development
  "insurance",                 // Insurance
  "taxes_licenses",            // Taxes & licenses
  "miscellaneous_contingency", // Miscellaneous / contingency
  // Legacy short codes kept for backwards compatibility with existing rows.
  "legal",
  "rent",
  "utilities",
  "supplies",
  "logistics",
  "r_and_d",
  "other",
] as const;

/**
 * Categories whose individual line items are restricted to the board (and
 * aggregated totals only for shareholders). Per §8.14.2: "Salaries & wages |
 * Board only (shareholders see aggregated total)".
 */
export const SALARY_LIKE_CATEGORIES = new Set<string>([
  "salaries",
  "payroll",
  "salary",
  "wages",
  "wage",
]);

/**
 * Categories visible to ALL shareholders (line items, not just aggregated).
 * Everything that is NOT salary-like is visible to capital partners.
 */
export const SHAREHOLDER_VISIBLE_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (c) => !SALARY_LIKE_CATEGORIES.has(c),
);

/**
 * Normalise an arbitrary category string from the DB to a canonical key for
 * comparison. Lowercases, trims, and replaces spaces/dashes with underscores.
 */
export function canonicalizeExpenseCategory(category: string): string {
  return String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/&/g, "and");
}

/** True if the category (in any spelling) is salary-like and therefore restricted. */
export function isSalaryLikeCategory(category: string): boolean {
  return SALARY_LIKE_CATEGORIES.has(canonicalizeExpenseCategory(category));
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY VISIBILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if a viewer can see the EXACT monthly salary of an employee.
 *
 * Per §8.6.2:
 * - Constitutional Council (board) sees everything.
 * - Founding Operator / Company Owner sees exact for their own enterprise.
 * - Manager sees exact for their own enterprise (direct reports + reports).
 * - Accounting Firm Rep sees exact for audit purposes (same enterprise).
 * - Law Firm Rep sees exact for contract / escrow compliance (same enterprise).
 * - Capital Partner sees exact salary ONLY for managers (Labour Law exception
 *   for senior executives) — never for non-managerial employees.
 *
 * Returns false for university_rep, aurienta_rep, and workforce_partner (these
 * never see exact salary of others; workforce_partner sees their own via the
 * self-check in {@link sanitizeEmployeeForViewer}).
 */
export function canSeeExactSalary(
  viewerRole: ViewerRole,
  viewerEnterpriseId: string,
  targetEnterpriseId: string,
  targetIsManager: boolean,
): boolean {
  // Board sees everything.
  if (viewerRole === "board_member") return true;

  // Roles that see exact salary ONLY within their own enterprise.
  const sameEnterprise = viewerEnterpriseId === targetEnterpriseId;
  if (!sameEnterprise) {
    // Capital Partner still sees managers' exact salary cross-enterprise
    // (Labour Law exception is public information for senior executives).
    return viewerRole === "capital_partner" && targetIsManager;
  }

  switch (viewerRole) {
    case "founding_operator":
    case "company_owner":
    case "manager":
    case "accounting_firm_rep":
    case "law_firm_rep":
      return true;
    case "capital_partner":
      // Within own enterprise, capital partner still only sees managers' exact.
      return targetIsManager;
    case "workforce_partner":
    case "aurienta_rep":
    case "university_rep":
    default:
      return false;
  }
}

/**
 * Determine if a viewer can see the salary BAND (e.g. "10,000–15,000 EGP") of
 * an employee. Per §8.6.2 the band is visible to all shareholders within the
 * same enterprise; non-managerial exact amounts are restricted to board + AI
 * Salary Engine.
 *
 * Returns false for workforce_partner (they only see their own data, handled
 * separately via the self-check), aurienta_rep, and university_rep — these do
 * not see individual employee bands.
 */
export function canSeeSalaryBand(
  viewerRole: ViewerRole,
  viewerEnterpriseId: string,
  targetEnterpriseId: string,
): boolean {
  if (viewerEnterpriseId !== targetEnterpriseId) return false;
  switch (viewerRole) {
    case "capital_partner":
    case "founding_operator":
    case "company_owner":
    case "manager":
    case "board_member":
    case "law_firm_rep":
    case "accounting_firm_rep":
      return true;
    case "workforce_partner":
    case "aurienta_rep":
    case "university_rep":
    default:
      return false;
  }
}

/**
 * Determine if a viewer can see aggregated workforce metrics (headcount, total
 * payroll, NOSI compliance %, turnover). Per §8.6.2 shareholders see total
 * contributions and compliance status. Returns true for any role within the
 * same enterprise, plus aurienta_rep (platform-wide aggregated oversight) and
 * university_rep (limited public data — aggregate only).
 */
export function canSeeWorkforceMetrics(
  viewerRole: ViewerRole,
  viewerEnterpriseId: string,
  targetEnterpriseId: string,
): boolean {
  // Platform operators see aggregated metrics for oversight.
  if (viewerRole === "aurienta_rep") return true;
  // University reps see limited public data — aggregate workforce metrics only.
  if (viewerRole === "university_rep") return true;
  // Everyone else must be in the same enterprise.
  if (viewerEnterpriseId !== targetEnterpriseId) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitized employee record — only the fields the viewer is permitted to see.
 * Protected personal data (nosiNumber, userId, nationalId, home address, phone,
 * medical) is NEVER included.
 */
export type SanitizedEmployee = {
  id: string;
  position: string;
  department: string;
  hireDate: string;       // ISO date
  employmentType: string;
  compensationBand?: string;   // only if canSeeSalaryBand
  monthlySalaryEgp?: number;   // only if canSeeExactSalary
  nosiStatus: string;          // compliance status (not the number)
  keyPerson: boolean;
  equityConversionPct?: number; // only if canSeeExactSalary or self
  status: string;
  // NEVER exposed: nosiNumber, userId, nationalId, home address, phone, medical
};

/**
 * Input shape for {@link sanitizeEmployeeForViewer}. Mirrors the Prisma Employee
 * model fields relevant to transparency. Pass any superset (the function only
 * reads the documented fields).
 */
export interface EmployeeRecord {
  id: string;
  userId: string;
  position: string;
  department: string;
  hireDate: Date;
  employmentType: string;
  compensationBand: string;
  monthlySalaryEgp: number;
  nosiStatus: string;
  nosiNumber?: string | null;
  keyPerson: boolean;
  equityConversionPct: number;
  // Optional: employee status. Defaults to "active" if absent.
  status?: string;
  // Optional: whether this employee holds a manager role. If absent, the
  // function derives it from the position/department using a heuristic
  // (case-insensitive match against MANAGER_TITLE_KEYWORDS).
  isManager?: boolean;
}

/** Position keywords that mark an employee as a manager for salary-visibility purposes. */
export const MANAGER_TITLE_KEYWORDS = [
  "manager",
  "director",
  "head",
  "chief",
  "ceo",
  "cfo",
  "coo",
  "cto",
  "cmo",
  "cofounder",
  "vp",
  "vice president",
  "lead",
  "principal",
  "founder",
  "owner",
  "president",
  "general manager",
  "gm",
];

/** Heuristic: does this position title look managerial? */
export function isManagerialTitle(position: string): boolean {
  const p = String(position ?? "").toLowerCase();
  return MANAGER_TITLE_KEYWORDS.some((kw) => p.includes(kw));
}

/**
 * Filter an employee record based on viewer role. Returns a sanitized employee
 * object with only the fields the viewer is allowed to see.
 *
 * Behaviour:
 * - Strips `nosiNumber` and `userId` ALWAYS — protected personal data.
 * - If the viewer IS the employee (matching userId), they see their own full
 *   data including exact salary, band, and equity conversion %.
 * - Otherwise: includes `monthlySalaryEgp` only if `canSeeExactSalary`;
 *   includes `compensationBand` only if `canSeeSalaryBand`; includes
 *   `equityConversionPct` only if `canSeeExactSalary`.
 */
export function sanitizeEmployeeForViewer(
  employee: EmployeeRecord,
  viewer: ViewerContext,
): SanitizedEmployee {
  // Self-access: workforce partners (and anyone) see their own full record.
  const isSelf = employee.userId === viewer.userId;

  const targetIsManager =
    employee.isManager ?? isManagerialTitle(employee.position);

  const seeExact = isSelf || canSeeExactSalary(
    viewer.role,
    viewer.enterpriseId,
    viewer.enterpriseId, // target enterprise = viewer's enterprise (single-row case)
    targetIsManager,
  );
  const seeBand = isSelf || canSeeSalaryBand(
    viewer.role,
    viewer.enterpriseId,
    viewer.enterpriseId,
  );

  const sanitized: SanitizedEmployee = {
    id: employee.id,
    position: employee.position,
    department: employee.department,
    hireDate: employee.hireDate instanceof Date
      ? employee.hireDate.toISOString()
      : new Date(employee.hireDate).toISOString(),
    employmentType: employee.employmentType,
    nosiStatus: employee.nosiStatus,
    keyPerson: employee.keyPerson,
    status: employee.status ?? "active",
  };

  if (seeBand) {
    sanitized.compensationBand = employee.compensationBand;
  }
  if (seeExact) {
    sanitized.monthlySalaryEgp = employee.monthlySalaryEgp;
    sanitized.equityConversionPct = employee.equityConversionPct;
  }

  return sanitized;
}

/**
 * Filter a list of employees for a viewer. Applies {@link sanitizeEmployeeForViewer}
 * to each row. The viewer's `enterpriseId` is used as the target enterprise for
 * the per-row visibility check — callers fetching employees for a specific
 * enterprise should set `viewer.enterpriseId` to that enterprise's id (the API
 * route typically resolves the user's most-privileged membership in the target
 * enterprise and builds the ViewerContext from that).
 */
export function sanitizeEmployeeListForViewer(
  employees: EmployeeRecord[],
  viewer: ViewerContext,
): SanitizedEmployee[] {
  return employees.map((e) => sanitizeEmployeeForViewer(e, viewer));
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSE SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitized expense record. When `amountEgp` is present the viewer can see the
 * individual line item; when absent the viewer only sees aggregated totals
 * (handled separately by {@link aggregateExpensesByCategory}).
 */
export type SanitizedExpense = {
  id: string;
  category: string;
  description: string;
  vendor: string;
  amountEgp?: number;        // only if viewer can see line items for this category
  status: string;
  createdAt: string;
  approver1Id?: string;
} | {
  id: string;
  category: string;
  description: string;
  vendor: string;
  amountEgp: number;
  status: string;
  createdAt: string;
  approver1Id?: string;
};

/**
 * Determine which expense categories a viewer can see line items for.
 *
 * Per §8.14.2:
 * - Board members see ALL categories.
 * - Capital Partners see all categories EXCEPT salary-like categories
 *   (they see aggregated totals only for those).
 * - Managers see all categories except "salaries" for OTHER departments
 *   (we don't know the viewer's department here, so we exclude salaries
 *   conservatively — managers in their own department see aggregated only).
 * - Other enterprise roles see all categories except salary-like.
 * - AURIENTA Rep / University Rep see only non-salary categories.
 */
export function getVisibleExpenseCategories(
  viewerRole: ViewerRole,
  isBoardMember: boolean,
): string[] {
  // Board sees everything.
  if (isBoardMember || viewerRole === "board_member") {
    return [...EXPENSE_CATEGORIES];
  }
  // Everyone else: exclude salary-like categories (line items).
  return SHAREHOLDER_VISIBLE_CATEGORIES.slice();
}

/**
 * Filter an expense for a viewer. Returns null if the viewer cannot see this
 * expense's line items at all (e.g. a non-board capital partner requesting a
 * salary-category expense — they should see aggregated totals only, not the
 * individual line).
 *
 * For non-salary categories, returns the expense with `amountEgp` visible.
 */
export function sanitizeExpenseForViewer(
  expense: {
    id: string;
    category: string;
    description: string;
    vendor: string;
    amountEgp: number;
    status: string;
    createdAt: Date;
    approver1Id?: string | null;
  },
  viewer: {
    role: ViewerRole;
    isBoardMember: boolean;
  },
): SanitizedExpense | null {
  // Board sees everything.
  if (viewer.isBoardMember || viewer.role === "board_member") {
    return {
      id: expense.id,
      category: expense.category,
      description: expense.description,
      vendor: expense.vendor,
      amountEgp: expense.amountEgp,
      status: expense.status,
      createdAt: expense.createdAt instanceof Date
        ? expense.createdAt.toISOString()
        : new Date(expense.createdAt).toISOString(),
      approver1Id: expense.approver1Id ?? undefined,
    };
  }

  // Non-board viewers cannot see individual salary line items — they see
  // aggregated totals only (handled by the API route via aggregateExpensesByCategory).
  if (isSalaryLikeCategory(expense.category)) {
    return null;
  }

  // All other categories: visible to all enterprise members / shareholders.
  return {
    id: expense.id,
    category: expense.category,
    description: expense.description,
    vendor: expense.vendor,
    amountEgp: expense.amountEgp,
    status: expense.status,
    createdAt: expense.createdAt instanceof Date
      ? expense.createdAt.toISOString()
      : new Date(expense.createdAt).toISOString(),
    approver1Id: expense.approver1Id ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSE AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate expenses by category. Used to give shareholders aggregated totals
 * for salary-like categories (which they cannot see individual line items for).
 *
 * Returns one row per category with the total amount, line count, and the
 * count of approved lines (status === "approved").
 */
export function aggregateExpensesByCategory(
  expenses: Array<{ category: string; amountEgp: number; status: string }>,
): Array<{ category: string; totalEgp: number; count: number; approvedCount: number }> {
  const buckets = new Map<
    string,
    { category: string; totalEgp: number; count: number; approvedCount: number }
  >();

  for (const exp of expenses) {
    const cat = String(exp.category ?? "other");
    const bucket = buckets.get(cat) ?? {
      category: cat,
      totalEgp: 0,
      count: 0,
      approvedCount: 0,
    };
    bucket.totalEgp += Number(exp.amountEgp) || 0;
    bucket.count += 1;
    if (exp.status === "approved") bucket.approvedCount += 1;
    buckets.set(cat, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.category.localeCompare(b.category),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEWER CONTEXT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Role priority for picking the "most privileged" role a user holds in an
 * enterprise. Lower index = higher privilege. Used by {@link buildViewerContext}
 * when a user has multiple memberships in the same enterprise.
 */
const ROLE_PRIORITY: ViewerRole[] = [
  "board_member",
  "company_owner",
  "founding_operator",
  "accounting_firm_rep",
  "law_firm_rep",
  "manager",
  "capital_partner",
  "workforce_partner",
  "aurienta_rep",
  "university_rep",
];

/**
 * Build a {@link ViewerContext} from a user's memberships in a target
 * enterprise. Picks the most privileged role the user holds in that enterprise.
 *
 * If the user has no membership in the target enterprise, returns null — the
 * API route should treat this as a 403 (the viewer is not a Constitutional
 * Partner of this enterprise).
 *
 * AURIENTA Reps and University Reps are platform-wide roles and may have a
 * membership row in any enterprise for oversight purposes. If no membership
 * row exists but the user's primaryIntent matches one of these platform roles,
 * the caller can synthesise a viewer context with an empty enterpriseId and
 * the appropriate role — that path is handled by the API route, not here.
 */
export function buildViewerContext(
  memberships: Array<{
    enterpriseId: string;
    role: string;
    boardSeat?: boolean;
  }>,
  userId: string,
  targetEnterpriseId: string,
): ViewerContext | null {
  const relevant = memberships.filter(
    (m) => m.enterpriseId === targetEnterpriseId,
  );
  if (relevant.length === 0) return null;

  // Pick the most privileged role.
  let best: { role: string; boardSeat: boolean } | null = null;
  let bestPriority = Number.POSITIVE_INFINITY;
  for (const m of relevant) {
    const priority = ROLE_PRIORITY.indexOf(m.role as ViewerRole);
    const effPriority = priority === -1 ? Number.POSITIVE_INFINITY : priority;
    if (effPriority < bestPriority) {
      bestPriority = effPriority;
      best = { role: m.role, boardSeat: m.boardSeat ?? false };
    }
  }

  if (!best) return null;

  return {
    role: best.role as ViewerRole,
    userId,
    enterpriseId: targetEnterpriseId,
    isBoardMember: best.boardSeat || best.role === "board_member",
    isManager: best.role === "manager",
  };
}

/**
 * Build a viewer context for a platform-wide operator (AURIENTA Rep or
 * University Rep) who is acting in an oversight capacity rather than as a
 * member of the target enterprise. Returns a ViewerContext with the given
 * role and the target enterprise id (so cross-enterprise visibility checks
 * still gate correctly).
 */
export function buildOperatorViewerContext(
  role: "aurienta_rep" | "university_rep",
  userId: string,
  targetEnterpriseId: string,
): ViewerContext {
  return {
    role,
    userId,
    enterpriseId: targetEnterpriseId,
    isBoardMember: false,
    isManager: false,
  };
}

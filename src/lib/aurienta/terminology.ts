// AURIENTA Constitutional Terminology Dictionary
// The single source of truth for approved and forbidden terminology.
// Every developer, AI prompt, UI label, and document must use approved terms.

export const APPROVED_TERMS: Record<string, { forbidden: string[]; note: string }> = {
  "Capital Partner": { forbidden: ["investor", "backer", "funder"], note: "A person who provides capital to an enterprise" },
  "Capital Participation": { forbidden: ["investment", "investing", "invest"], note: "The act of providing capital to an enterprise" },
  "Capital Formation": { forbidden: ["fundraising", "funding", "raising capital"], note: "The process of an enterprise accepting capital" },
  "Equity Units": { forbidden: ["shares", "stock", "tokens"], note: "Constitutional ownership units" },
  "Enterprise": { forbidden: ["startup", "project", "company"], note: "A constitutionally governed productive entity" },
  "Founding Operator": { forbidden: ["founder", "entrepreneur", "CEO"], note: "The person who constitutes the enterprise" },
  "Law Firm Client Account": { forbidden: ["escrow", "escrow vault", "trust account"], note: "Where capital is held by the law firm under Lawyers' Code Art. 47" },
  "Constitutional Holdings": { forbidden: ["portfolio"], note: "A Capital Partner's ownership across enterprises" },
  "Enterprise Registry": { forbidden: ["market", "marketplace", "exchange"], note: "Where Equity Units are listed and traded" },
  "Constitutional Partner": { forbidden: ["user", "customer", "client"], note: "Any participant in the constitutional ecosystem" },
  "Constitutional Infrastructure": { forbidden: ["constitutional infrastructure", "app", "software", "system"], note: "What AURIENTA is — not a platform, but infrastructure" },
  "Graduation": { forbidden: ["exit", "IPO", "liquidity event"], note: "When an enterprise becomes sovereign" },
  "Constitutional Runtime Engine": { forbidden: ["backend", "server", "API"], note: "The enforcement core (CRE)" },
  "Brain AI": { forbidden: ["chatbot", "assistant", "AI tool"], note: "The institutional intelligence layer" },
  "Constitutional Charter": { forbidden: ["terms of service", "user agreement"], note: "The governing document of each enterprise" },
  "Capital Participation Goal": { forbidden: ["fundraising goal", "funding target"], note: "The target amount of capital an enterprise seeks" },
  "Capital Participated": { forbidden: ["raised", "funds raised"], note: "The amount of capital an enterprise has accepted" },
  "Equity Unit Price": { forbidden: ["share price", "stock price"], note: "The constitutional price per equity unit (CPP)" },
  "Constitutional Workspace": { forbidden: ["dashboard", "user portal"], note: "The partner's workspace within the infrastructure" },
  "Structural Trust": { forbidden: ["trust", "confidence"], note: "The constitutional trust model — trust by architecture, not by promise" },
};

// Automated validation patterns for CI/CD integration
export const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bescrow\b/gi,
  /\bfundrais\w*/gi,
  /\binvestor\b/gi,
  /\binvestment\b/gi,
  /\bstartup\b/gi,
  /\bshareholder\b/gi,
  /\bcrowdfunding\b/gi,
  /\bbacker\b/gi,
  /\bdonate\b/gi,
  /\bmarketplace\b/gi,
];

/** Validate text against the constitutional terminology standard. */
export function validateTerminology(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  }
  return { valid: violations.length === 0, violations };
}

/** Get the approved term for a forbidden term. */
export function getApprovedTerm(forbidden: string): string | null {
  for (const [approved, info] of Object.entries(APPROVED_TERMS)) {
    if (info.forbidden.some(f => f.toLowerCase() === forbidden.toLowerCase())) {
      return approved;
    }
  }
  return null;
}

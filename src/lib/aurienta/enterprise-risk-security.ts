// AURIENTA Enterprise Risk, Security, Compliance & Institutional Readiness System
// ═══════════════════════════════════════════════════════════════
// This file is the single source of truth for AURIENTA's enterprise
// risk management, internal controls, cybersecurity, compliance,
// business continuity, disaster recovery, AI governance, and
// institutional readiness.
//
// Aligned with: NIST CSF 2.0, ISO 27001, ISO 22301, ISO 31000,
// ISO 42001 (AI), SOC 2, CIS Controls, OWASP ASVS.
//
// DO NOT modify without Founder approval + Risk Committee review.
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 1 — Enterprise Risk Register v2.0 (28 risks)
// ═══════════════════════════════════════════════════════════════

export type EnterpriseRisk = {
  id: string;
  category: string;
  risk: string;
  owner: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  velocity: "Slow" | "Moderate" | "Fast";
  earlyWarning: string;
  mitigation: string;
  residualRisk: "Low" | "Medium" | "High";
  recoveryPlan: string;
  riskAppetite: "Low" | "Medium" | "High";
  boardReporting: string;
};

export const ENTERPRISE_RISK_REGISTER: EnterpriseRisk[] = [
  { id: "R-001", category: "Strategic", risk: "Competitor replicates the constitutional model", owner: "Founder", likelihood: "Medium", impact: "High", velocity: "Slow", earlyWarning: "Competitor launches similar governance model", mitigation: "Open-source CRE as global standard; brand moat; first-mover advantage", residualRisk: "Medium", recoveryPlan: "Accelerate open-source strategy; differentiate through Brain AI", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-002", category: "Strategic", risk: "Regulatory classification as exchange/broker", owner: "Founder", likelihood: "Medium", impact: "Critical", velocity: "Moderate", earlyWarning: "Regulator inquiry about secondary market", mitigation: "Position as governance infrastructure; FRA no-action letter; avoid exchange terminology", residualRisk: "High", recoveryPlan: "Suspend secondary market; reposition; obtain legal opinion", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-003", category: "Operational", risk: "SQLite corruption — data loss", owner: "Operations (CTO)", likelihood: "Low", impact: "Critical", velocity: "Fast", earlyWarning: "Database query errors; file size anomalies", mitigation: "Daily backups; migrate to PostgreSQL; 5-copy retention", residualRisk: "Medium", recoveryPlan: "Restore from backup; rebuild from ledger hash chain", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-004", category: "Operational", risk: "Founder unavailable for extended period", owner: "Founder", likelihood: "Low", impact: "High", velocity: "Fast", earlyWarning: "Founder health issues; travel restrictions", mitigation: "Delegation matrix; decision playbooks; key-person insurance $5M; succession plan", residualRisk: "Medium", recoveryPlan: "Activate emergency succession; COO assumes operations", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-005", category: "Technology", risk: "All 5 AI providers unavailable simultaneously", owner: "Operations (CTO)", likelihood: "Low", impact: "High", velocity: "Fast", earlyWarning: "Multiple provider errors in 24h", mitigation: "5-provider redundancy; graceful fallback; CRE continues without AI", residualRisk: "Low", recoveryPlan: "AI enters read-only mode; human review activated", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-006", category: "Technology", risk: "CRE vulnerability discovered", owner: "Operations (CTO)", likelihood: "Low", impact: "Critical", velocity: "Fast", earlyWarning: "Security researcher report; anomalous CRE denials", mitigation: "Code review; security audits; bug bounty; Ed25519 signatures", residualRisk: "Low", recoveryPlan: "Emergency CRE patch; ledger verification; partner notification", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-007", category: "Cyber", risk: "Supply chain attack via npm dependency", owner: "Operations (CTO)", likelihood: "Medium", impact: "High", velocity: "Fast", earlyWarning: "npm advisory; anomalous package behavior", mitigation: "Dependency audit; lockfile; minimal dependencies; SCA scanning", residualRisk: "Medium", recoveryPlan: "Revert to clean lockfile; audit all dependencies; rebuild", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-008", category: "Cyber", risk: "Credential compromise — admin account takeover", owner: "Security Committee", likelihood: "Medium", impact: "Critical", velocity: "Fast", earlyWarning: "Anomalous login patterns; failed MFA attempts", mitigation: "Session-based auth; CSRF; rate limiting; MFA (when implemented); IP monitoring", residualRisk: "Medium", recoveryPlan: "Revoke all sessions; rotate keys; forensic investigation", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-009", category: "Privacy", risk: "PDPL violation — personal data exposed", owner: "Holding Group Legal", likelihood: "Medium", impact: "High", velocity: "Fast", earlyWarning: "PDPC inquiry; partner complaint; data access anomaly", mitigation: "AES-256-GCM encryption; PDPL compliance; data minimization; anonymized public data", residualRisk: "Low", recoveryPlan: "Breach notification within 72h; remediation plan; legal defense", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-010", category: "AI", risk: "Brain AI produces biased or harmful output", owner: "AI Ethics Committee", likelihood: "Medium", impact: "High", velocity: "Moderate", earlyWarning: "Bias audit findings; partner complaints about AI output", mitigation: "5-provider consensus; prompt injection defense; quarterly bias audit; human review for critical decisions", residualRisk: "Medium", recoveryPlan: "Disable AI feature; review prompts; retrain with corrected context", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-011", category: "AI", risk: "Prompt injection attack bypasses UNTRUSTED delimiters", owner: "AI Ethics Committee", likelihood: "Low", impact: "High", velocity: "Fast", earlyWarning: "AI output containing system prompt content; constitutional hash leakage", mitigation: "UNTRUSTED delimiters; guard instructions; output filtering; conservative system prompt", residualRisk: "Low", recoveryPlan: "Disable affected AI endpoint; review all recent artifacts; strengthen delimiters", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-012", category: "Legal", risk: "PDPL enforcement action for data breach", owner: "Holding Group Legal", likelihood: "Medium", impact: "High", velocity: "Moderate", earlyWarning: "PDPC inquiry; partner complaint", mitigation: "AES-256-GCM; PDPL compliance; data minimization; audit trail", residualRisk: "Low", recoveryPlan: "Breach notification; remediation; legal defense", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-013", category: "Regulatory", risk: "Egyptian government restricts AURIENTA operations", owner: "Founder", likelihood: "Low", impact: "Critical", velocity: "Moderate", earlyWarning: "Regulatory pressure; unfavorable policy signals", mitigation: "FRA no-action letter; government engagement; Oracle Mirror protocol", residualRisk: "Medium", recoveryPlan: "Activate Oracle Mirror; relocate operations; legal challenge", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-014", category: "Financial", risk: "Revenue model self-liquidates (enterprises graduate)", owner: "Founder", likelihood: "Medium", impact: "High", velocity: "Slow", earlyWarning: "Graduation rate exceeds new enterprise formation rate", mitigation: "CAaaS revenue; certification; SWF; alumni network membership", residualRisk: "Medium", recoveryPlan: "Accelerate post-graduation revenue streams", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-015", category: "Financial", risk: "Insufficient capital to sustain operations", owner: "Founder", likelihood: "Medium", impact: "Critical", velocity: "Moderate", earlyWarning: "Runway <6 months; declining enterprise formation", mitigation: "Founder capitalization; revenue diversification; Sovereign Wealth Fund", residualRisk: "Medium", recoveryPlan: "Emergency capital raise; cost reduction; strategic partnership", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-016", category: "Reputation", risk: "Enterprise fraud damages AURIENTA reputation", owner: "Founder", likelihood: "Medium", impact: "High", velocity: "Fast", earlyWarning: "Whistleblower report; anomaly detection; CRE denial spike", mitigation: "CRE enforcement; KYC; police clearance; milestone-gated releases", residualRisk: "Medium", recoveryPlan: "Freeze enterprise; investigate; partner notification; legal action", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-017", category: "Vendor", risk: "Third-party service (cloud, AI provider) outage", owner: "Operations (CTO)", likelihood: "Medium", impact: "Medium", velocity: "Fast", earlyWarning: "Provider status page; latency spikes", mitigation: "Multi-provider redundancy; fallback chains; graceful degradation", residualRisk: "Low", recoveryPlan: "Switch to backup provider; communicate with partners", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-018", category: "Partner", risk: "Law firm insolvency — client funds at risk", owner: "Advisory", likelihood: "Low", impact: "Critical", velocity: "Moderate", earlyWarning: "Law firm financial distress; license review", mitigation: "Multi-firm redundancy; 100M EGP insurance; bankruptcy-remote accounts", residualRisk: "Low", recoveryPlan: "Transfer funds to alternate law firm within 7 days; partner notification", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-019", category: "Country", risk: "Egyptian devaluation/capital controls", owner: "Founder", likelihood: "Medium", impact: "Medium", velocity: "Moderate", earlyWarning: "EGP volatility; CBE policy changes", mitigation: "Diversify to GCC; diaspora bridge; multi-currency readiness", residualRisk: "Medium", recoveryPlan: "Accelerate GCC expansion; hedge exposure", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-020", category: "Cloud", risk: "Cloud provider region outage", owner: "Operations (CTO)", likelihood: "Low", impact: "High", velocity: "Fast", earlyWarning: "Provider status page; monitoring alerts", mitigation: "Multi-region deployment (when implemented); backup strategy", residualRisk: "Medium", recoveryPlan: "Failover to alternate region; restore from backup", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-021", category: "Infrastructure", risk: "Single-server failure — platform unavailable", owner: "Operations (CTO)", likelihood: "Medium", impact: "High", velocity: "Fast", earlyWarning: "Server health metrics; memory pressure", mitigation: "Docker healthcheck; backup strategy; monitoring (when implemented)", residualRisk: "High", recoveryPlan: "Restart server; restore from backup; deploy to alternate server", riskAppetite: "Medium", boardReporting: "Monthly" },
  { id: "R-022", category: "Supply Chain", risk: "Open-source dependency becomes unmaintained", owner: "Operations (CTO)", likelihood: "Medium", impact: "Medium", velocity: "Slow", earlyWarning: "Package last publish >12 months; security advisories", mitigation: "Dependency monitoring; minimal dependencies; fork critical packages", residualRisk: "Low", recoveryPlan: "Replace dependency; fork if necessary; patch vulnerabilities", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-023", category: "Business Continuity", risk: "Extended platform outage (>24h)", owner: "Operations (CTO)", likelihood: "Low", impact: "Critical", velocity: "Fast", earlyWarning: "Multiple system failures; cascade effects", mitigation: "Oracle Mirror protocol; BCP; DR plan; monitoring", residualRisk: "Medium", recoveryPlan: "Activate BCP; Oracle Mirror hard-copy governance; restore infrastructure", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-024", category: "Disaster Recovery", risk: "Data loss — backup corruption", owner: "Operations (CTO)", likelihood: "Low", impact: "Critical", velocity: "Fast", earlyWarning: "Backup verification failures; storage anomalies", mitigation: "5-copy retention; immutable ledger hash chain; off-site backups", residualRisk: "Low", recoveryPlan: "Rebuild from ledger hash chain; verify chain integrity; restore from oldest valid backup", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-025", category: "Fraud", risk: "Enterprise founder submits fraudulent milestone evidence", owner: "Audit Committee", likelihood: "Medium", impact: "High", velocity: "Moderate", earlyWarning: "EVE confidence <70%; anomaly detection; whistleblower report", mitigation: "AI evidence verification; accountant gate; dual-signature; CRE enforcement", residualRisk: "Medium", recoveryPlan: "Freeze enterprise; investigate; recover funds from law firm; legal action", riskAppetite: "Low", boardReporting: "Monthly" },
  { id: "R-026", category: "Insider Threat", risk: "Privileged employee misuses access", owner: "Security Committee", likelihood: "Low", impact: "High", velocity: "Moderate", earlyWarning: "Anomalous data access; privilege escalation attempts", mitigation: "RBAC; audit logging; least privilege; session revocation; background checks", residualRisk: "Low", recoveryPlan: "Revoke access; forensic investigation; legal action; partner notification", riskAppetite: "Low", boardReporting: "Quarterly" },
  { id: "R-027", category: "Third-party AI", risk: "AI provider changes terms or discontinues service", owner: "AI Ethics Committee", likelihood: "Medium", impact: "Medium", velocity: "Slow", earlyWarning: "Provider pricing changes; API deprecation notices", mitigation: "5-provider redundancy; no exclusive provider relationship; abstraction layer", residualRisk: "Low", recoveryPlan: "Switch to alternate provider; update routing; negotiate new terms", riskAppetite: "Medium", boardReporting: "Quarterly" },
  { id: "R-028", category: "IP", risk: "Competitor copies CRE or Brain AI implementation", owner: "Holding Group", likelihood: "Medium", impact: "Medium", velocity: "Slow", earlyWarning: "Competitor product with similar features; patent filing by competitor", mitigation: "Open-source CRE (commoditize the standard); trademark registration; patent key processes", residualRisk: "Low", recoveryPlan: "Enforce trademarks; differentiate through Brain AI + partner network", riskAppetite: "Medium", boardReporting: "Quarterly" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 2 — Enterprise Control Framework (30 controls)
// ═══════════════════════════════════════════════════════════════

export type Control = {
  id: string;
  domain: string;
  control: string;
  owner: string;
  frequency: string;
  evidence: string;
  automation: "Manual" | "Semi-Automated" | "Automated";
  testingProcedure: string;
  failureResponse: string;
};

export const ENTERPRISE_CONTROLS: Control[] = [
  { id: "C-01", domain: "Financial", control: "Dual signature for expenses 1-10% of capital", owner: "CRE", frequency: "Every transaction", evidence: "LedgerEvent + AuditLog", automation: "Automated", testingProcedure: "Verify CRE enforcement on sample of 10 expenses", failureResponse: "CRE blocks transaction; manual review by Audit Committee" },
  { id: "C-02", domain: "Financial", control: "Board approval for expenditures >10% of capital", owner: "Board Member", frequency: "Per transaction", evidence: "Proposal + Vote + LedgerEvent", automation: "Semi-Automated", testingProcedure: "Verify proposal exists for all >10% expenses", failureResponse: "Freeze expense; require board vote" },
  { id: "C-03", domain: "Technology", control: "Code review required for all merges to main", owner: "Operations (CTO)", frequency: "Every merge", evidence: "Git commit history", automation: "Semi-Automated", testingProcedure: "Verify all main branch commits have review approval", failureResponse: "Revert commit; mandatory review session" },
  { id: "C-04", domain: "Engineering", control: "Lint + tests pass before deployment", owner: "Operations (CTO)", frequency: "Every deployment", evidence: "CI/CD log (when active)", automation: "Automated", testingProcedure: "Verify 0 lint errors + 54/54 tests pass", failureResponse: "Block deployment; fix errors" },
  { id: "C-05", domain: "Deployment", control: "CTO or Founder approval for production deploys", owner: "Operations (CTO)", frequency: "Every deployment", evidence: "AuditLog", automation: "Manual", testingProcedure: "Verify approval record for each deploy", failureResponse: "Rollback; investigate unauthorized deploy" },
  { id: "C-06", domain: "AI", control: "AI Ethics Committee review for new AI features", owner: "AI Ethics Committee", frequency: "Per new feature", evidence: "Committee minutes", automation: "Manual", testingProcedure: "Verify committee approval for each new AI endpoint", failureResponse: "Block feature; full review" },
  { id: "C-07", domain: "AI", control: "Prompt injection defense (UNTRUSTED delimiters)", owner: "Operations (CTO)", frequency: "Every AI call", evidence: "AiArtifact payload", automation: "Automated", testingProcedure: "Verify userContext delimiters in 10 sample artifacts", failureResponse: "Disable AI endpoint; review all prompts" },
  { id: "C-08", domain: "Data", control: "AES-256-GCM encryption for PII at rest", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Schema review + encryption module", automation: "Automated", testingProcedure: "Verify nationalIdLast4 is encrypted in DB", failureResponse: "Encrypt all PII; investigate exposure" },
  { id: "C-09", domain: "Partners", control: "License verification for law firms + accounting firms", owner: "Advisory", frequency: "On onboarding + annual", evidence: "Partner registry + license docs", automation: "Manual", testingProcedure: "Verify FRA/ESAA license for each partner firm", failureResponse: "Suspend partner; require re-verification" },
  { id: "C-10", domain: "Legal", control: "Constitutional terminology in all legal documents", owner: "Holding Group Legal", frequency: "Per document", evidence: "Document review log", automation: "Manual", testingProcedure: "Run terminology validator on legal docs", failureResponse: "Revise document; legal review" },
  { id: "C-11", domain: "Compliance", control: "PDPL compliance — no personal data on public pages", owner: "Compliance Committee", frequency: "Continuous", evidence: "Code review + page audit", automation: "Semi-Automated", testingProcedure: "Verify all public pages use anonymized data", failureResponse: "Remove personal data; PDPL breach assessment" },
  { id: "C-12", domain: "Operations", control: "Session revocation on sign-out + admin suspend", owner: "Operations", frequency: "Per session", evidence: "Session table + AuditLog", automation: "Automated", testingProcedure: "Verify revoked sessions cannot access platform", failureResponse: "Force-revoke all sessions; investigate" },
  { id: "C-13", domain: "Brand", control: "Constitutional terminology in all public materials", owner: "Operations (Communications)", frequency: "Per publication", evidence: "Publication log", automation: "Manual", testingProcedure: "Run terminology validator on public pages", failureResponse: "Correct terminology; review process" },
  { id: "C-14", domain: "IP", control: "All source code owned by Holding Group", owner: "Holding Group", frequency: "Continuous", evidence: "IP register + git ownership", automation: "Manual", testingProcedure: "Verify git ownership + IP register", failureResponse: "Legal action; IP transfer" },
  { id: "C-15", domain: "Cloud", control: "Cloud provider security configuration review", owner: "Operations (CTO)", frequency: "Quarterly", evidence: "Security review report", automation: "Manual", testingProcedure: "Verify cloud config against CIS benchmarks", failureResponse: "Remediate; security review" },
  { id: "C-16", domain: "Cybersecurity", control: "Rate limiting on all state-changing endpoints", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Rate limit config + logs", automation: "Automated", testingProcedure: "Verify rate limit headers on API responses", failureResponse: "Investigate abuse; tighten limits" },
  { id: "C-17", domain: "Cybersecurity", control: "CSRF protection (same-origin + double-submit)", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Middleware config", automation: "Automated", testingProcedure: "Verify POST without Origin/CSRF token is rejected", failureResponse: "Investigate bypass; strengthen middleware" },
  { id: "C-18", domain: "Cybersecurity", control: "Ed25519 cryptographic signing for all CRE decisions", owner: "CRE", frequency: "Every decision", evidence: "LedgerEvent creDecisionToken", automation: "Automated", testingProcedure: "Verify signature on 10 sample ledger events", failureResponse: "Investigate unsigned events; re-sign" },
  { id: "C-19", domain: "Identity", control: "Password hashing (scrypt N=16384 + timingSafeEqual)", owner: "Operations (CTO)", frequency: "Continuous", evidence: "password.ts module", automation: "Automated", testingProcedure: "Verify all user passwordHash fields start with 'scrypt$'", failureResponse: "Force password reset; investigate plaintext" },
  { id: "C-20", domain: "Access", control: "RBAC on all admin pages (requireRole)", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Code review + redirect tests", automation: "Automated", testingProcedure: "Verify non-admin users redirected from admin pages", failureResponse: "Fix RBAC; investigate access" },
  { id: "C-21", domain: "Change Management", control: "Constitutional changes require 75% supermajority", owner: "Constitutional Committee", frequency: "Per change", evidence: "Vote record + LedgerEvent", automation: "Semi-Automated", testingProcedure: "Verify vote threshold for constitutional amendments", failureResponse: "Block change; require proper vote" },
  { id: "C-22", domain: "Source Code", control: "Git branch protection on main (when CI/CD active)", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Git config", automation: "Semi-Automated", testingProcedure: "Verify direct pushes to main are blocked", failureResponse: "Revert unauthorized push; review" },
  { id: "C-23", domain: "Production Releases", control: "Production deploys require CTO approval", owner: "Operations (CTO)", frequency: "Per deploy", evidence: "Approval record + AuditLog", automation: "Manual", testingProcedure: "Verify approval for each production deploy", failureResponse: "Rollback; investigate unauthorized deploy" },
  { id: "C-24", domain: "Secrets", control: "API keys stored in .env, never in source code", owner: "Operations (CTO)", frequency: "Continuous", evidence: "Code review + .gitignore", automation: "Manual", testingProcedure: "Verify no API keys in git history", failureResponse: "Rotate keys; purge history" },
  { id: "C-25", domain: "Backups", control: "Daily backup with 5-copy retention", owner: "Operations (CTO)", frequency: "Daily", evidence: "Backup log + file listing", automation: "Semi-Automated", testingProcedure: "Verify backup file exists and is restorable", failureResponse: "Manual backup; investigate script failure" },
  { id: "C-26", domain: "Vendor Onboarding", control: "Vendor risk assessment before onboarding", owner: "Operations (COO)", frequency: "Per vendor", evidence: "Vendor assessment form", automation: "Manual", testingProcedure: "Verify assessment for each vendor >10K EGP", failureResponse: "Reject vendor; require assessment" },
  { id: "C-27", domain: "Audit Logging", control: "Every state-changing action logged to immutable ledger", owner: "CRE", frequency: "Every action", evidence: "LedgerEvent hash chain", automation: "Automated", testingProcedure: "Verify hash chain integrity via verifyLedgerChain()", failureResponse: "Investigate chain break; rebuild from last valid event" },
  { id: "C-28", domain: "Evidence Retention", control: "All evidence retained for 10 years", owner: "Holding Group Legal", frequency: "Continuous", evidence: "Retention policy + IPFS CIDs", automation: "Manual", testingProcedure: "Verify evidence older than 1 year is still accessible", failureResponse: "Recover from backup; investigate deletion" },
  { id: "C-29", domain: "Government", control: "All government communications through Advisory", owner: "Advisory", frequency: "Per communication", evidence: "Communication log + AuditLog", automation: "Manual", testingProcedure: "Verify all gov communications have Advisory approval", failureResponse: "Review process; legal assessment" },
  { id: "C-30", domain: "Business Continuity", control: "Oracle Mirror protocol documented + tested annually", owner: "Operations (CTO)", frequency: "Annual", evidence: "Test report + documentation", automation: "Manual", testingProcedure: "Verify Oracle Mirror test was conducted in past 12 months", failureResponse: "Conduct emergency test; update protocol" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 3 — Three Lines of Defense
// ═══════════════════════════════════════════════════════════════

export const THREE_LINES_OF_DEFENSE = {
  firstLine: {
    name: "First Line — Operations (Own and Manage Risk)",
    entities: ["AURIENTA Operations", "Engineering", "Product", "Business Operations", "Regional Companies"],
    responsibilities: ["Day-to-day risk management", "Control execution", "Issue identification and remediation", "Self-assessment", "Compliance with policies"],
  },
  secondLine: {
    name: "Second Line — Oversight (Monitor and Challenge)",
    entities: ["Compliance Committee", "Risk Committee", "Security Committee", "AI Ethics Committee"],
    responsibilities: ["Policy development", "Risk framework maintenance", "Monitoring and testing", "Advisory and guidance", "Regulatory liaison", "Independent challenge of First Line"],
  },
  thirdLine: {
    name: "Third Line — Independent Assurance",
    entities: ["Audit Committee", "Holding Group Oversight", "Future External Auditors"],
    responsibilities: ["Independent audit", "Control testing", "Assurance to Founder and Board", "Audit findings and recommendations", "Follow-up on remediation", "External audit liaison"],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 4 — Internal Audit Framework
// ═══════════════════════════════════════════════════════════════

export const INTERNAL_AUDIT_FRAMEWORK = {
  annualPlan: "Risk-based annual audit plan covering: financial controls (Q1), technology/CRE (Q2), compliance/PDPL (Q3), governance/operations (Q4)",
  quarterlyPlan: "Each quarter: 5-10 control tests + 1 thematic review + follow-up on prior findings",
  controlTesting: "Sample-based testing of 30 enterprise controls; minimum 3 samples per control; documented test procedures",
  evidenceCollection: "Automated: LedgerEvent hash chain, AuditLog entries, AiArtifact payloads. Manual: Committee minutes, approval records, review logs",
  findings: { severity: ["Critical (immediate remediation)", "High (30-day remediation)", "Medium (90-day remediation)", "Low (next cycle)"] },
  remediation: "Findings assigned to control owner; remediation plan with deadline; monthly status review by Audit Committee",
  brainAiSupport: "Brain AI assists auditors by: searching AiArtifacts for anomalies, summarizing governance decisions, verifying ledger chain integrity, generating audit narratives",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 5 — Cybersecurity Framework (NIST CSF 2.0 + ISO 27001)
// ═══════════════════════════════════════════════════════════════

export const CYBERSECURITY_FRAMEWORK = {
  standard: "NIST CSF 2.0 + ISO 27001 + CIS Controls v8",
  functions: {
    govern: ["Cybersecurity governance aligned with enterprise governance v1.0", "Risk Committee oversees cyber risk", "Security Committee manages day-to-day"],
    identify: ["Asset inventory (code, data, infrastructure)", "Risk assessment (28 enterprise risks)", "Supply chain risk management"],
    protect: ["Access control (RBAC, sessions, CSRF)", "Data security (AES-256-GCM, Ed25519)", "Protective technology (CRE enforcement, rate limiting)", "Awareness training (when team grows)"],
    detect: ["Continuous monitoring (when Sentry/Prometheus implemented)", "Anomaly detection (Brain AI anomaly endpoint)", "Audit logging (immutable ledger)"],
    respond: ["Incident response plan (when SOC established)", "Communication plan (Founder + partners)", "Mitigation (freeze enterprise, revoke sessions, disable AI)"],
    recover: ["RTO: 4 hours for critical systems", "RPO: 24 hours (daily backup)", "Oracle Mirror protocol for constitutional continuity"],
  },
  currentMaturity: 2, // Level 1-5
  targetMaturity: 4, // Target by Year 2
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 6 — Compliance Framework
// ═══════════════════════════════════════════════════════════════

export const COMPLIANCE_FRAMEWORK = [
  { framework: "PDPL (Egypt Law 151/2020)", currentMaturity: 3, targetMaturity: 5, applicableControls: "Data encryption, anonymized public data, consent management, data subject rights", gap: "PDPC licensing, formal data retention policy, DPIA", evidence: "encryption.ts, anonymized public pages, terminology.ts" },
  { framework: "ISO 27001", currentMaturity: 2, targetMaturity: 5, applicableControls: "Access control, cryptography, operations security, logging", gap: "ISMS documentation, risk treatment plan, SOC, formal policies", evidence: "RBAC, AES-256-GCM, Ed25519, AuditLog, rate-limit.ts" },
  { framework: "SOC 2 Type II", currentMaturity: 1, targetMaturity: 5, applicableControls: "Security, availability, confidentiality", gap: "Continuous monitoring, formal control testing, external auditor", evidence: "CRE policies, hash chain, session management" },
  { framework: "ISO 22301 (BCM)", currentMaturity: 1, targetMaturity: 4, applicableControls: "Business continuity, disaster recovery", gap: "BCP documentation, DR testing, RTO/RPO measurement", evidence: "Oracle Mirror page, backup script" },
  { framework: "ISO 31000 (Risk)", currentMaturity: 3, targetMaturity: 5, applicableControls: "Risk management framework", gap: "Formal risk register approval, quarterly review", evidence: "RISK_REGISTER (28 risks)" },
  { framework: "ISO 42001 (AI)", currentMaturity: 2, targetMaturity: 4, applicableControls: "AI governance, model management, bias monitoring", gap: "Formal AI policy, model registry, bias testing methodology", evidence: "AI Ethics Committee, 5-provider consensus, prompt injection defense" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 7+8 — Business Continuity & Disaster Recovery
// ═══════════════════════════════════════════════════════════════

export const BCP_DR = {
  businessContinuityPlan: {
    rto: "4 hours for critical systems (CRE, auth, ledger); 24 hours for non-critical (AI, dashboard)",
    rpo: "24 hours (daily backup); 0 minutes for ledger (hash chain is append-only)",
    alternativeOperations: "Oracle Mirror protocol — enterprises continue using hard-copy constitutions; CRE code archived with neutral foundation",
    crisisCommunications: "Within 48 hours: partners notified via email + dashboard banner; within 72 hours: regulators notified; within 7 days: public statement",
    emergencyLeadership: "COO (when appointed) or Executive Committee assumes operational authority; Constitutional decisions suspended until Founder recovers or Council activates",
    annualTesting: "Annual BCP test: simulate 24h platform outage; verify Oracle Mirror activation; verify partner communication; verify data recovery",
  },
  disasterRecovery: {
    infrastructure: "Restore from Docker image + .next/standalone; rebuild on alternate server within 4 hours",
    database: "Restore from latest backup (daily, 5-copy retention); verify ledger hash chain integrity via verifyLedgerChain()",
    secrets: "Rotate all API keys (Gemini, OpenAI, Groq, HuggingFace, OpenRouter); rotate FIELD_ENCRYPTION_KEY (requires re-encrypting all PII)",
    brainAi: "Brain AI is stateless — restart with new provider keys; AiArtifact table restored from DB backup; continuous learning resumes from restored artifacts",
    cre: "CRE is deterministic — restart with same code; ledger hash chain verified; no state to recover",
    identity: "Session table restored from DB; active sessions may need re-authentication; Ed25519 keypairs are in DB (encrypted)",
    runbooks: "See scripts/backup.sh for backup; see verifyLedgerChain() for ledger verification; see Oracle Mirror page for constitutional continuity",
  },
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 10 — AI Governance
// ═══════════════════════════════════════════════════════════════

export const AI_GOVERNANCE = {
  modelApproval: "New AI endpoints require AI Ethics Committee review + Founder approval. Model prompt, task kind, and consensus mode are documented.",
  providerOnboarding: "New AI providers require: security review, API key management review, latency test, fallback chain update, Founder approval.",
  providerRemoval: "Provider removal requires: routing chain update, AiArtifact audit (no orphaned provider references), Founder approval.",
  consensusMonitoring: "Brain AI tracks: provider response rate, fallback rate, consensus agreement rate, synthesis quality. Monthly review by AI Ethics Committee.",
  biasMonitoring: "Quarterly bias audit: Brain AI tested with standardized prompts for gender, nationality, sector, and tier bias. Results reviewed by AI Ethics Committee.",
  hallucinationMonitoring: "AiArtifact payloads track fellBack flag. Hallucination rate = fellBack artifacts / total. Target: <1%.",
  promptGovernance: "System prompt is non-overridable (CONSTITUTIONAL_SYSTEM_PROMPT). User content via userContext (UNTRUSTED delimiters). Prompt changes require CTO + Founder approval.",
  fallbackPolicy: "If all 5 providers fail, Brain AI returns [AI_FALLBACK] message. CRE continues independently. AI Ethics Committee notified.",
  humanOverride: "AI cannot override CRE. For critical decisions (feasibility, graduation, milestone release), human review is required. AI recommends; CRE enforces; humans decide.",
  auditTrail: "Every AI call persisted to AiArtifact with: systemPrompt, userMessage, userContext, provider, model, tokens, latency, fellBack, error. Retained for 10 years.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 11 — Enterprise Data Governance
// ═══════════════════════════════════════════════════════════════

export const DATA_GOVERNANCE = {
  classification: [
    { level: "Restricted", examples: "API keys, FIELD_ENCRYPTION_KEY, Ed25519 private keys", encryption: "AES-256-GCM + .env", access: "Founder + CTO only" },
    { level: "Confidential", examples: "Partner PII (email, mobile, nationalIdLast4), enterprise financials", encryption: "AES-256-GCM (PII only)", access: "Authenticated partners + role-based" },
    { level: "Internal", examples: "AuditLog entries, AiArtifact payloads, ledger events", encryption: "At rest (SQLite file)", access: "Authenticated partners" },
    { level: "Public", examples: "Enterprise registry, transparency pages, trust dashboard", encryption: "None (public by design)", access: "No authentication required" },
  ],
  retention: { default: "10 years", auditLogs: "10 years", aiArtifacts: "10 years", ledgerEvents: "Indefinite (immutable)", sessions: "7 days after expiry", deletedPartners: "Anonymized after 30 days" },
  residency: "All data stored in Egypt (SQLite on local server). When migrated to cloud: Egypt North region (AWS Bahrain) for data sovereignty compliance.",
  crossBorder: "No personal data transferred outside Egypt. Anonymized aggregate data may be shared for regulatory reporting. Diaspora partner data stored in Egypt.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 15 — Certification Roadmap
// ═══════════════════════════════════════════════════════════════

export const CERTIFICATION_ROADMAP = [
  { certification: "SOC 2 Type II", currentMaturity: 1, targetMaturity: 5, targetDate: "Q2 2027", effort: "6 months + external auditor", dependencies: ["PostgreSQL migration", "Sentry monitoring", "CI/CD", "Formal control testing"] },
  { certification: "ISO 27001", currentMaturity: 2, targetMaturity: 5, targetDate: "Q4 2027", effort: "9 months + certification body", dependencies: ["ISMS documentation", "Risk treatment plan", "Security policies", "Training"] },
  { certification: "ISO 22301 (BCM)", currentMaturity: 1, targetMaturity: 4, targetDate: "Q2 2028", effort: "4 months", dependencies: ["BCP documentation", "DR testing", "RTO/RPO measurement"] },
  { certification: "ISO 31000 (Risk)", currentMaturity: 3, targetMaturity: 5, targetDate: "Q1 2027", effort: "3 months", dependencies: ["Risk register formal approval", "Quarterly review process"] },
  { certification: "ISO 42001 (AI)", currentMaturity: 2, targetMaturity: 4, targetDate: "Q3 2027", effort: "5 months", dependencies: ["AI policy formalization", "Bias testing methodology", "Model registry"] },
];

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL — Operational Maturity Model
// ═══════════════════════════════════════════════════════════════

export const MATURITY_MODEL = [
  { capability: "Engineering", currentLevel: 3, targetLevel: 5, roadmap: "Level 3→4: CI/CD, monitoring, code review enforcement. Level 4→5: automated testing, chaos engineering, zero-downtime deploys." },
  { capability: "Governance", currentLevel: 4, targetLevel: 5, roadmap: "Level 4 (achieved): governance v1.0 frozen, delegation matrix, committees. Level 5: Constitutional Council active, full delegation, institutional memory." },
  { capability: "Security", currentLevel: 2, targetLevel: 5, roadmap: "Level 2→3: MFA, monitoring, vulnerability scanning. Level 3→4: SOC 2, penetration testing. Level 4→5: ISO 27001, continuous monitoring, zero-trust." },
  { capability: "Advisory", currentLevel: 2, targetLevel: 5, roadmap: "Level 2→3: formal partner onboarding, KPIs. Level 3→4: certification program, partner portal. Level 4→5: global partner network, alumni ecosystem." },
  { capability: "Operations", currentLevel: 2, targetLevel: 5, roadmap: "Level 2→3: COO appointment, runbooks, KPIs. Level 3→4: regional companies operational. Level 4→5: fully delegated, Founder as Chairman only." },
  { capability: "AI", currentLevel: 4, targetLevel: 5, roadmap: "Level 4 (achieved): 5-provider consensus, continuous learning, prompt injection defense. Level 5: bias-free certification, autonomous governance, CAaaS revenue." },
  { capability: "Compliance", currentLevel: 2, targetLevel: 5, roadmap: "Level 2→3: PDPL formal compliance, PDPC licensing. Level 3→4: SOC 2, ISO 27001. Level 4→5: multi-jurisdiction compliance, real government APIs." },
];

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL — Continuous Readiness Score
// ═══════════════════════════════════════════════════════════════

export const CONTINUOUS_READINESS = {
  overallScore: 62, // Out of 100 — computed from sub-scores
  subScores: {
    governance: 92,
    security: 45,
    compliance: 40,
    riskManagement: 75,
    auditReadiness: 35,
    businessContinuity: 30,
    aiGovernance: 85,
    dataGovernance: 70,
    operationalExcellence: 50,
    institutionalCredibility: 55,
  },
  targetScore: 90, // Target by Q4 2027
  scoringMethodology: "Continuous readiness is computed from: control coverage (30%), risk mitigation (20%), compliance maturity (20%), audit findings (10%), incident history (10%), certification status (10%).",
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL — Architecture Decision Records (ADRs)
// ═══════════════════════════════════════════════════════════════

export const ADR_TEMPLATE = {
  format: "ADR-NNNN: [Title] | Date | Status (Proposed/Accepted/Superseded) | Context | Decision | Consequences | Constitutional Impact",
  registry: [
    "ADR-0001: Next.js 16 as frontend framework | Accepted | Constitutional impact: None",
    "ADR-0002: Prisma + SQLite as database (temporary) | Accepted | Constitutional impact: None | Superseded by ADR-0003 (pending)",
    "ADR-0003: Migration to PostgreSQL (pending) | Proposed | Constitutional impact: None",
    "ADR-0004: Ed25519 via tweetnacl for cryptographic signing | Accepted | Constitutional impact: Implements constitutional Ed25519 requirement",
    "ADR-0005: 5-provider consensus Brain AI (no ZAI) | Accepted | Constitutional impact: Implements multi-model AI requirement",
    "ADR-0006: Amendment IX — direct law firm transfer model | Accepted | Constitutional impact: Amends charter to eliminate escrow",
    "ADR-0007: PDPL-compliant transparency (anonymized public data) | Accepted | Constitutional impact: Implements transparency requirement",
    "ADR-0008: Constitutional terminology standard | Accepted | Constitutional impact: Establishes language governance",
    "ADR-0009: Institutional architecture (Holding + Operations + Advisory) | Accepted | Constitutional impact: Establishes corporate structure",
    "ADR-0010: Governance v1.0 frozen | Accepted | Constitutional impact: Establishes change management process",
  ],
};

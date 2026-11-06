"use client";

/**
 * LegalDisclaimerAgreement — COO + Legal requirement.
 *
 * A modal dialog that shows Egyptian-law-specific legal clauses and requires
 * the user to tick a checkbox for EACH clause before they can proceed.
 *
 * Used at:
 *   - Registration (before account creation)
 *   - Capital Partner activation (before any investment)
 *   - Workforce Partner activation (before employment records)
 *   - Founder / Enterprise creation
 *   - Graduation flow
 *   - Dividend distribution
 *
 * Legal basis: Law 15/2004 (E-Signature), Law 151/2020 (PDPL),
 * Law 67/2006 (Consumer Protection), Law 80/2002 (AML).
 *
 * Each acceptance is recorded via /api/terms/acceptance with:
 *   - SHA-256 hash of the accepted text
 *   - IP address + user agent
 *   - timestamp
 *   - the exact affirmation text
 *   - preSelected: false (per §34 — checkbox must NOT be pre-checked)
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Shield, FileText, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type EgyptianLegalClause,
  getRegistrationClauses,
  getCapitalPartnerClauses,
  getWorkforcePartnerClauses,
  getFounderClauses,
  getGraduationClauses,
  getDividendClauses,
} from "@/lib/aurienta/egyptian-legal-clauses";

export type LegalContext =
  | "registration"
  | "capital_partner"
  | "workforce"
  | "founder"
  | "graduation"
  | "dividend";

const CONTEXT_LABELS: Record<LegalContext, string> = {
  registration: "Account Registration",
  capital_partner: "Capital Partner Activation",
  workforce: "Workforce Partner Activation",
  founder: "Enterprise Formation",
  graduation: "Graduation to JSC",
  dividend: "Dividend Distribution",
};

function getClausesForContext(ctx: LegalContext): EgyptianLegalClause[] {
  switch (ctx) {
    case "registration": return getRegistrationClauses();
    case "capital_partner": return getCapitalPartnerClauses();
    case "workforce": return getWorkforcePartnerClauses();
    case "founder": return getFounderClauses();
    case "graduation": return getGraduationClauses();
    case "dividend": return getDividendClauses();
  }
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  registration: Shield,
  capital_partner: FileText,
  workforce: Shield,
  founder: FileText,
  graduation: FileText,
  dividend: FileText,
  data_protection: Lock,
  aml: AlertTriangle,
  tax: FileText,
  consumer_protection: Shield,
};

const CATEGORY_LABELS: Record<string, string> = {
  registration: "Identity & Account",
  capital_partner: "Investment & Securities",
  workforce: "Employment & Labour",
  founder: "Enterprise Formation",
  graduation: "Public Offering",
  dividend: "Tax & Withholding",
  data_protection: "Data Protection",
  aml: "Anti-Money Laundering",
  tax: "Tax Compliance",
  consumer_protection: "Consumer Rights",
};

export function LegalDisclaimerAgreement({
  context,
  open,
  onAccept,
  onCancel,
}: {
  context: LegalContext;
  open: boolean;
  onAccept: (acceptedClauseIds: string[]) => void;
  onCancel: () => void;
}) {
  const clauses = React.useMemo(() => getClausesForContext(context), [context]);
  const [accepted, setAccepted] = React.useState<Set<string>>(new Set());
  const [expandedClause, setExpandedClause] = React.useState<string | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setAccepted(new Set());
      setExpandedClause(null);
    }
  }, [open]);

  const allAccepted = accepted.size === clauses.length;

  const toggleAccept = (clauseId: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(clauseId)) {
        next.delete(clauseId);
      } else {
        next.add(clauseId);
      }
      return next;
    });
  };

  const handleAcceptAll = () => {
    const all = new Set(clauses.map((c) => c.clauseId));
    setAccepted(all);
  };

  const handleProceed = () => {
    if (!allAccepted) return;
    onAccept([...accepted]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-v2 relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-gold/20 depth-lg flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-gold/15 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/25">
                  <Shield className="h-6 w-6 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      Legal Agreement Required
                    </h2>
                    <Badge variant="outline" className="border-gold/30 text-[10px] text-gold">
                      {CONTEXT_LABELS[context]}
                    </Badge>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground">
                    Egyptian law requires your explicit acceptance of the following clauses
                    before proceeding. Please read each clause carefully and tick the checkbox
                    to accept.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gold/10">
              <motion.div
                className="h-full bg-gold-gradient"
                animate={{ width: `${(accepted.size / clauses.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Clauses list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {clauses.map((clause, idx) => {
                const isAccepted = accepted.has(clause.clauseId);
                const isExpanded = expandedClause === clause.clauseId;
                const CatIcon = CATEGORY_ICONS[clause.category] ?? FileText;
                return (
                  <div
                    key={clause.clauseId}
                    className={cn(
                      "rounded-xl border transition-colors",
                      isAccepted
                        ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                        : "border-gold/15 bg-background/40"
                    )}
                  >
                    {/* Clause header (clickable to expand) */}
                    <button
                      onClick={() => setExpandedClause(isExpanded ? null : clause.clauseId)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                      aria-expanded={isExpanded}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                          isAccepted
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-gold/20 bg-gold/5"
                        )}
                      >
                        <CatIcon
                          className={cn(
                            "h-4 w-4",
                            isAccepted ? "text-emerald-600" : "text-gold/70"
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground/60">
                            {clause.clauseId}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-gold/20 text-[9px] uppercase tracking-wider"
                          >
                            {CATEGORY_LABELS[clause.category] ?? clause.category}
                          </Badge>
                        </div>
                        <p className="font-serif text-sm font-semibold text-foreground mt-0.5">
                          {clause.title}
                        </p>
                        <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                          Legal basis: <span className="font-mono text-gold/80">{clause.legalBasis}</span>
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    {/* Clause text (expandable) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-gold/10 px-4 py-3">
                            <p className="font-sans text-xs leading-relaxed text-foreground/80 whitespace-pre-line">
                              {clause.text}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Accept checkbox */}
                    <div className="border-t border-gold/10 px-4 py-2.5">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAccepted}
                          onChange={() => toggleAccept(clause.clauseId)}
                          className="h-4 w-4 rounded border-gold/30 text-gold focus:ring-gold/20"
                        />
                        <span className="font-sans text-xs text-foreground">
                          I have read and accept this clause
                          <span className="text-red-500 ml-1">*</span>
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gold/15 bg-background/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border",
                      allAccepted
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-gold/20 bg-gold/5"
                    )}
                  >
                    {allAccepted ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="font-mono text-[10px] text-gold">
                        {accepted.size}/{clauses.length}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-muted-foreground">
                    {allAccepted
                      ? "All clauses accepted — you can proceed"
                      : `${accepted.size} of ${clauses.length} clauses accepted — all required`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="rounded-lg px-3 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:text-gold hover:bg-gold/5"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={onCancel}
                    className="rounded-lg border border-foreground/15 px-4 py-2 font-sans text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleProceed}
                    disabled={!allAccepted}
                    className="btn-sheen inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-all hover:shadow-[0_8px_30px_-8px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-4 w-4" />
                    Accept &amp; Continue
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

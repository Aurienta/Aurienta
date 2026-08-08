"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { stsLevel } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";
import {
  type MentorForUi,
  type MenteeForUi,
  type ActiveMentorshipForUi,
  type AiMatchForMentorship,
  statusMeta,
} from "./mentorship-types";
import { RequestMentorshipDialog } from "./request-mentorship-dialog";

export function MentorshipBoard({
  mentors,
  mentees,
  activeMentorships,
  aiMatches,
  currentUser,
  userCanOffer, // STS ≥ 85
  userFounderEntIds, // enterprises the user is the founder of (so they can "request mentorship")
}: {
  mentors: MentorForUi[];
  mentees: MenteeForUi[];
  activeMentorships: ActiveMentorshipForUi[];
  aiMatches: AiMatchForMentorship[];
  currentUser: { id: string; legalName: string; sovereignTrustScore: number };
  userCanOffer: boolean;
  userFounderEntIds: string[];
}) {
  // Single dialog state — handles both "request" and "offer" modes.
  const [dialogState, setDialogState] = React.useState<
    | { mode: "request"; mentee: MenteeForUi }
    | { mode: "offer"; mentor: MentorForUi; mentee: MenteeForUi }
    | null
  >(null);

  function openRequest(mentee: MenteeForUi) {
    setDialogState({ mode: "request", mentee });
  }
  function openOffer(mentor: MentorForUi, mentee: MenteeForUi) {
    setDialogState({ mode: "offer", mentor, mentee });
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
            Constitutional Mentorship Market
          </span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-gold-gradient sm:text-4xl">
          Founders mentor founders
        </h1>
        <p className="max-w-2xl font-sans text-sm text-muted-foreground">
          Founding Operators with Sovereign Trust Score ≥ 85 mentor Tier A/B founders. The mentor
          earns a small equity grant from the mentee&apos;s founder pool — a constitutional
          reward for institutional knowledge transfer.
        </p>
      </header>

      <div className="grid gap-7 lg:grid-cols-[1fr_320px] xl:gap-8">
        <div className="flex flex-col gap-7 min-w-0">
          {/* Mentors section */}
          <section aria-label="Available mentors">
            <SectionHeading
              eyebrow="Available mentors"
              title="Founding Operators · STS ≥ 85"
              subtitle="Constitutional Pillars and Ecosystem Builders with sector expertise and mentoring slots."
              count={mentors.length}
            />
            {mentors.length === 0 ? (
              <EmptyState label="No mentors available yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {mentors.map((m, i) => (
                  <MentorCard
                    key={m.id}
                    mentor={m}
                    onOffer={
                      userCanOffer
                        ? (mentee) => openOffer(m, mentee)
                        : undefined
                    }
                    mentees={mentees}
                    index={i}
                    isSelf={m.id === currentUser.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Mentees section */}
          <section aria-label="Mentees seeking mentors">
            <SectionHeading
              eyebrow="Mentees seeking mentors"
              title="Tier A/B founders · Stage 1/2"
              subtitle="Early-stage enterprises with constitutional readiness gaps that a mentor could close."
              count={mentees.length}
            />
            {mentees.length === 0 ? (
              <EmptyState label="No mentees currently seeking." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {mentees.map((e, i) => (
                  <MenteeCard
                    key={e.id}
                    mentee={e}
                    canRequest={userFounderEntIds.includes(e.id)}
                    onRequest={() => openRequest(e)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Active mentorships */}
          <section aria-label="Your active mentorships">
            <SectionHeading
              eyebrow="Your mentorships"
              title="Active engagements"
              subtitle="Proposals, active mentorships, and completed engagements where you are mentor or mentee founder."
              count={activeMentorships.length}
            />
            {activeMentorships.length === 0 ? (
              <EmptyState label="No active mentorships yet. Propose or accept one above." />
            ) : (
              <ul className="flex flex-col gap-3">
                {activeMentorships.map((m, i) => (
                  <ActiveMentorshipCard key={m.id} mentorship={m} index={i} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right rail — AI matches */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AiMatchPanel
            matches={aiMatches}
            mentors={mentors}
            mentees={mentees}
            onOffer={openOffer}
            canOffer={userCanOffer}
          />
        </div>
      </div>

      {dialogState && (
        <RequestMentorshipDialog
          mode={dialogState.mode}
          open={!!dialogState}
          onOpenChange={(v) => {
            if (!v) setDialogState(null);
          }}
          mentor={dialogState.mode === "offer" ? dialogState.mentor : null}
          mentee={dialogState.mentee}
          canOffer={userCanOffer}
        />
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  count,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light/80">
          {eyebrow}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground/80">· {count}</span>
      </div>
      <h2 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">{title}</h2>
      <p className="mt-0.5 max-w-2xl font-sans text-[12px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-gold/10 bg-foreground/[0.02] py-10 text-center">
      <p className="font-sans text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MentorCard({
  mentor,
  mentees,
  onOffer,
  index,
  isSelf,
}: {
  mentor: MentorForUi;
  mentees: MenteeForUi[];
  onOffer?: (mentee: MenteeForUi) => void;
  index: number;
  isSelf: boolean;
}) {
  const level = stsLevel(mentor.sovereignTrustScore);
  const [showMentees, setShowMentees] = React.useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
        isSelf ? "border-gold/30 glass-gold" : "border-gold/12 glass"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-[12px] font-semibold text-black"
          style={{ background: `linear-gradient(135deg, ${mentor.avatarColor}, #b8860b)` }}
        >
          {mentor.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-serif text-sm font-semibold">{mentor.legalName}</h3>
            {isSelf && (
              <span className="rounded border border-gold/30 bg-gold/10 px-1 py-0.5 font-mono text-[11px] text-gold-light">
                You
              </span>
            )}
          </div>
          <p className="font-sans text-[11px] text-muted-foreground">
            {mentor.enterprise?.name ?? "Independent"} ·{" "}
            <span className="text-gold-light">
              STS {mentor.sovereignTrustScore}
            </span>{" "}
            · {level.name}
          </p>
        </div>
      </div>

      {mentor.enterprise && (
        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Sector</p>
            <p className="mt-0.5 text-foreground">{mentor.enterprise.sector}</p>
          </div>
          <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tier</p>
            <p className="mt-0.5 text-foreground">T{mentor.enterprise.tier}</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/85">
          <Crown className="h-3 w-3 text-gold/60" /> Mentoring slots open
        </span>
        {onOffer && mentees.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMentees((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-2.5 py-1 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/15"
          >
            Offer to mentor <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {showMentees && onOffer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 border-t border-gold/10 pt-3"
        >
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Pick a mentee to offer to:
          </p>
          <ul className="flex flex-col gap-1.5">
            {mentees.slice(0, 3).map((me) => (
              <li key={me.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOffer(me);
                    setShowMentees(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-gold/10 bg-background/30 px-2.5 py-2 text-left transition-colors hover:bg-gold/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[12px] font-medium">{me.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      T{me.tier} · {me.sector} · {me.founder.legalName}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 shrink-0 text-gold/60" />
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.article>
  );
}

function MenteeCard({
  mentee,
  canRequest,
  onRequest,
  index,
}: {
  mentee: MenteeForUi;
  canRequest: boolean;
  onRequest: () => void;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="relative overflow-hidden rounded-2xl border border-gold/12 glass p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-serif text-sm font-semibold">{mentee.name}</h3>
            <span className="rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
              T{mentee.tier}
            </span>
          </div>
          <p className="font-sans text-[11px] text-muted-foreground">
            {mentee.sector} · {mentee.stage.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold/10 bg-background/30 p-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-xs font-semibold text-black"
          style={{ background: `linear-gradient(135deg, ${mentee.founder.avatarColor}, #b8860b)` }}
        >
          {mentee.founder.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[11px] font-medium">
            {mentee.founder.legalName}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            STS {mentee.founder.sovereignTrustScore} · {mentee.founder.tier}
          </p>
        </div>
      </div>

      {/* Mock readiness gaps */}
      <div className="mt-3">
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Readiness gaps
        </p>
        <div className="flex flex-wrap gap-1.5">
          {mockGapsForMentee(mentee).map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 rounded-full border border-gold/15 bg-gold/[0.04] px-2 py-0.5 font-sans text-xs text-muted-foreground"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/85">
          <TrendingUp className="h-3 w-3 text-gold/60" /> Seeking mentor
        </span>
        {canRequest ? (
          <button
            type="button"
            onClick={onRequest}
            className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            Request mentorship
          </button>
        ) : (
          <span className="font-mono text-[11px] text-muted-foreground/80">
            Only the founder can request
          </span>
        )}
      </div>
    </motion.article>
  );
}

function ActiveMentorshipCard({
  mentorship,
  index,
}: {
  mentorship: ActiveMentorshipForUi;
  index: number;
}) {
  const status = statusMeta(mentorship.status);
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="rounded-2xl border border-gold/12 glass p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-[11px] font-semibold text-black"
            style={{
              background: `linear-gradient(135deg, ${mentorship.mentor.avatarColor}, #b8860b)`,
            }}
          >
            {mentorship.mentor.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif text-sm font-semibold">
                {mentorship.mentor.legalName}
              </h3>
              <span className="rounded border border-gold/20 bg-gold/5 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">
                {mentorship.role === "mentor" ? "as your mentor" : "you mentor"}
              </span>
            </div>
            <p className="font-sans text-[11px] text-muted-foreground">
              Mentoring <span className="text-foreground">{mentorship.menteeEnterprise.name}</span>{" "}
              · T{mentorship.menteeEnterprise.tier} · {mentorship.menteeEnterprise.sector}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs"
          style={{ background: `${status.color}1a`, color: status.color }}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", status.pulse && "animate-pulse-gold")}
            style={{ background: status.color }}
          />
          {status.label}
        </span>
      </div>

      {mentorship.focusAreas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentorship.focusAreas.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded-full border border-gold/15 bg-gold/[0.04] px-2 py-0.5 font-sans text-xs text-gold-light"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Equity grant</p>
          <p className="mt-0.5 text-gold-light">{mentorship.equityGrantPct.toFixed(2)}%</p>
        </div>
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Started</p>
          <p className="mt-0.5 text-foreground">
            {mentorship.startedAt
              ? new Date(mentorship.startedAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Proposed</p>
          <p className="mt-0.5 text-foreground">
            {new Date(mentorship.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function AiMatchPanel({
  matches,
  mentors,
  mentees,
  onOffer,
  canOffer,
}: {
  matches: AiMatchForMentorship[];
  mentors: MentorForUi[];
  mentees: MenteeForUi[];
  onOffer: (mentor: MentorForUi, mentee: MenteeForUi) => void;
  canOffer: boolean;
}) {
  if (matches.length === 0) {
    return (
      <aside className="rounded-2xl border border-gold/12 glass p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold/60" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            No AI matches yet
          </span>
        </div>
        <p className="mt-2 font-sans text-[12px] leading-relaxed text-muted-foreground">
          When mentors and mentees are both available, the Constitutional AI will suggest
          the best pairings based on sector expertise, readiness gaps, and STS.
        </p>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-gold/22 glass-gold p-5"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
            Constitutional AI
          </span>
        </div>
        <h3 className="mt-1.5 font-serif text-base font-semibold sm:text-lg">
          AI-suggested matches
        </h3>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
          Pairings ranked by sector fit, readiness-gap overlap, and mentor STS.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {matches.map((m, i) => {
            const mentor = mentors.find((x) => x.id === m.mentorId);
            const mentee = mentees.find((x) => x.id === m.menteeEnterpriseId);
            if (!mentor || !mentee) return null;
            return (
              <li
                key={`${m.mentorId}-${m.menteeEnterpriseId}-${i}`}
                className="rounded-xl border border-gold/15 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-serif text-[12px] font-semibold">
                      {mentor.legalName}{" "}
                      <span className="text-muted-foreground">→</span> {mentee.name}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      STS {mentor.sovereignTrustScore} · T{mentee.tier} · {mentee.sector}
                    </p>
                  </div>
                  <span
                    className="font-serif text-base font-semibold"
                    style={{
                      color:
                        m.matchScore >= 80
                          ? "#34d399"
                          : m.matchScore >= 60
                            ? "#f4d676"
                            : "#a89f86",
                    }}
                  >
                    {m.matchScore}%
                  </span>
                </div>
                <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                  {m.rationale}
                </p>
                {canOffer && (
                  <button
                    type="button"
                    onClick={() => onOffer(mentor, mentee)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-2.5 py-1 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/15"
                  >
                    <GoldStar className="h-2.5 w-2.5" /> Offer this match
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.aside>
  );
}

// Deterministic mock gaps based on mentee id — so the same mentee shows the same gaps.
function mockGapsForMentee(mentee: MenteeForUi): string[] {
  const all = [
    "Operations",
    "Capital Strategy",
    "Governance",
    "Compliance",
    "Go-to-Market",
    "Talent & NOSI",
    "Financial Reporting",
  ];
  const seed = mentee.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const count = 2 + (seed % 2);
  const start = seed % all.length;
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(all[(start + i) % all.length]);
  }
  return picked;
}

"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User, Building2, FileCheck, Layers, Wallet, Users,
  Scale, HeartPulse, GraduationCap, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  {
    id: 1,
    icon: User,
    title: "Founder enters AURIENTA",
    titleAr: "دخول المؤسس إلى أوريينتا",
    description: "A Constitutional Partner registers with Ed25519 identity, KYC verification, and signs the Constitutional Pledge.",
    descriptionAr: "يسجل الشريك الدستوري بهوية Ed25519 وتحقق KYC ويوقع التعهد الدستوري.",
    demo: {
      label: "EXAMPLE FOUNDER",
      name: "Ahmed Hassan",
      sts: 65,
      level: "L2 — Enhanced KYC",
      role: "Founding Operator",
    },
  },
  {
    id: 2,
    icon: Building2,
    title: "Enterprise profile",
    titleAr: "ملف المؤسسة",
    description: "The founding operator submits the enterprise: name, sector, mission, tier, and capital formation goal.",
    descriptionAr: "يقدم المؤسس المؤسسة: الاسم، القطاع، الرسالة، المستوى، وهدف تكوين رأس المال.",
    demo: {
      label: "EXAMPLE ENTERPRISE",
      name: "EcoPack Solutions",
      sector: "Manufacturing",
      tier: "Tier B — Small",
      goal: "5,000,000 EGP",
    },
  },
  {
    id: 3,
    icon: FileCheck,
    title: "Evidence submission",
    titleAr: "تقديم الأدلة",
    description: "The founder submits evidence: business plan, financial projections, pitch deck, and optional materials. Each is classified E0-E9.",
    descriptionAr: "يقدم المؤسس الأدلة: خطة العمل، التوقعات المالية، العرض التقديمي، والمواد الاختيارية. كل منها مصنف E0-E9.",
    demo: {
      label: "EXAMPLE EVIDENCE",
      items: [
        { name: "Business Plan (PDF)", level: "E0 — Founder-Provided" },
        { name: "3-Year Financial Projections", level: "E0 — Founder-Provided" },
        { name: "Pitch Deck", level: "E0 — Founder-Provided" },
      ],
    },
  },
  {
    id: 4,
    icon: Layers,
    title: "Tier determination",
    titleAr: "تحديد المستوى",
    description: "The 7-stage Constitutional Project Evaluation Engine produces a Feasibility Score (0-100). ≥35 passes; <35 is rejected with a 30-day cooling period.",
    descriptionAr: "ينتج محرك التقييم الدستوري ذو الـ 7 مراحل درجة جدوى (0-100). ≥35 يجتاز؛ <35 يُرفض مع فترة تهدئة 30 يوماً.",
    demo: {
      label: "EXAMPLE FEASIBILITY",
      score: 78,
      passed: true,
      breakdown: [
        { step: "Tier Validation", result: "PASS" },
        { step: "Expense Feasibility", result: "70/100" },
        { step: "Financial Consistency", result: "85/100" },
        { step: "Founder Credibility", result: "72/100" },
        { step: "Fraud Detection", result: "CLEAN" },
        { step: "Optional Materials", result: "+13 bonus" },
        { step: "Sanity Check", result: "PASS" },
      ],
    },
  },
  {
    id: 5,
    icon: Wallet,
    title: "Capital structure",
    titleAr: "هيكل رأس المال",
    description: "Zero Custody: funds flow directly to a licensed law firm's client account. AURIENTA never holds funds. Equity Units are issued at the fundamental price.",
    descriptionAr: "بدون حيازة: تتدفق الأموال مباشرة إلى حساب عميل لدى مكتب محاماة مرخص. لا تحوز أوريينتا الأموال. تُصدر وحدات الملكية بالسعر الأساسي.",
    demo: {
      label: "EXAMPLE CAPITAL",
      goal: "5,000,000 EGP",
      equityUnitPrice: "50 EGP",
      totalEquityUnits: "100,000",
      founderEquity: "5% (5,000 units)",
      lawFirmAccount: "Nile Legal — Client Account #1234",
    },
  },
  {
    id: 6,
    icon: Users,
    title: "Workforce transparency",
    titleAr: "شفافية القوى العاملة",
    description: "Employees are registered with NOSI within 30 days. Compensation bands are visible to all partners; exact salary is restricted to the board. Salary-to-equity conversion available after 24 months.",
    descriptionAr: "يتم تسجيل الموظفين في التأمينات الاجتماعية خلال 30 يوماً. نطاقات الأجور مرئية لجميع الشركاء؛ الراتب الدقيق مخصص لمجلس الإدارة. تحويل الراتب إلى ملكية متاح بعد 24 شهراً.",
    demo: {
      label: "EXAMPLE WORKFORCE",
      employees: [
        { name: "A. (anonymized)", position: "Operations Manager", band: "18,000-23,000 EGP", nosi: "Registered" },
        { name: "M. (anonymized)", position: "Software Engineer", band: "12,000-16,000 EGP", nosi: "Registered" },
        { name: "K. (anonymized)", position: "Sales Lead", band: "15,000-20,000 EGP", nosi: "Pending (12 days)" },
      ],
    },
  },
  {
    id: 7,
    icon: Scale,
    title: "Governance",
    titleAr: "الحوكمة",
    description: "Proposals are created and voted on by Constitutional Partners. The CRE enforces quorum, pass thresholds, and cooling periods. All decisions are recorded on the immutable ledger.",
    descriptionAr: "تُنشأ المقترحات ويتم التصويت عليها من قبل الشركاء الدستوريين. ينفذ محرك القواعد النصاب وعتبات التجاوز وفترات التهدئة. تُسجل جميع القرارات على السجل غير القابل للتلاعب.",
    demo: {
      label: "EXAMPLE PROPOSAL",
      title: "Budget approval — Q1 marketing (50,000 EGP)",
      quorum: "51%",
      passThreshold: "50% (simple majority)",
      cooling: "48h",
      voting: "48h",
      status: "EXECUTED",
    },
  },
  {
    id: 8,
    icon: HeartPulse,
    title: "Constitutional health",
    titleAr: "الصحة الدستورية",
    description: "Six vital signs track enterprise health: runway, revenue growth, gross margin, turnover, vote turnout, and NOSI compliance. Health score (0-100) drives the AAA-CCC rating.",
    descriptionAr: "تتبع ست علامات حيوية صحة المؤسسة: فترة البقاء، نمو الإيرادات، هامش الربح الإجمالي، معدل الدوران، إقبال التصويت، وامتثال التأمينات. درجة الصحة (0-100) تحدد التصنيف AAA-CCC.",
    demo: {
      label: "EXAMPLE HEALTH",
      score: 82,
      rating: "AA",
      vitalSigns: [
        { name: "Runway", value: "14 months", status: "healthy" },
        { name: "Revenue Growth", value: "+24%", status: "healthy" },
        { name: "Gross Margin", value: "35%", status: "healthy" },
        { name: "NOSI Compliance", value: "95%", status: "alert" },
      ],
    },
  },
  {
    id: 9,
    icon: GraduationCap,
    title: "Graduation readiness",
    titleAr: "جاهزية التخرج",
    description: "When 9 readiness gates are met (runway ≥12mo, health ≥90, NOSI 100%, 4 profitable quarters, 75% graduation vote, etc.), the enterprise graduates to sovereign independence.",
    descriptionAr: "عند تحقق 9 بوابات جاهزية (فترة بقاء ≥12 شهراً، صحة ≥90، تأمينات 100%، 4 أرباع مربحة، تصويت تخرج 75%، إلخ)، تتخرج المؤسسة إلى الاستقلال المؤسسي.",
    demo: {
      label: "EXAMPLE READINESS",
      score: 56,
      gates: [
        { gate: "Runway ≥ 12 months", passed: true },
        { gate: "Health rating ≥ AA", passed: false },
        { gate: "NOSI 100%", passed: false },
        { gate: "Revenue growth ≥ 20%", passed: true },
        { gate: "75% graduation vote", passed: false },
      ],
    },
  },
];

export function ProductPreview() {
  const [step, setStep] = React.useState(0);
  const reduce = useReducedMotion();
  const current = STEPS[step];
  const Icon = current.icon;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const reset = () => setStep(0);

  return (
    <section id="product-preview" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 aurienta-radial opacity-20" />
      <div className="pointer-events-none absolute inset-0 aurienta-grid opacity-10" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="outline" className="border-gold/30 text-gold mb-4">
            <GoldStar className="mr-1 h-3 w-3" />
            INTERACTIVE WALKTHROUGH
          </Badge>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Explore AURIENTA
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            An interactive walkthrough of the constitutional enterprise experience
          </p>
        </div>

        {/* DEMO notice */}
        <div className="mb-8 flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs text-amber-200/90 sm:text-sm">
            <span className="font-semibold">DEMO:</span> This is a demo preview using example data. No real enterprises, partners, or transactions are shown.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-all ${
                  i === step
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-border/40 text-muted-foreground hover:border-gold/30 hover:text-foreground"
                }`}
                aria-label={`Step ${s.id}: ${s.title}`}
                aria-current={i === step ? "step" : undefined}
              >
                <StepIcon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.id}</span>
              </button>
            );
          })}
        </div>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 30 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gold/20 bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/25">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Step {current.id} of {STEPS.length}
                    </div>
                    <CardTitle className="font-serif text-xl text-foreground">
                      {current.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {current.description}
                </p>

                {/* Demo data */}
                <DemoData step={current} />

                {/* CRE badge */}
                <div className="flex items-center gap-2 rounded-lg border border-gold/15 bg-gold/[0.03] px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gold" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-gold">CRE-Enforced:</span>{" "}
                    Every step in this workflow is validated by the Constitutional Runtime Engine. No state may mutate without a signed CRE decision token.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 0}
            className="border-gold/20 hover:border-gold/40"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-gold" : "w-1.5 bg-gold/20 hover:bg-gold/40"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              className="bg-gold text-black hover:bg-gold/90"
            >
              Next step
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={reset}
              variant="outline"
              className="border-gold/20 hover:border-gold/40"
            >
              Start over
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function DemoData({ step }: { step: typeof STEPS[0] }) {
  const d = step.demo as any;
  return (
    <div className="rounded-lg border border-border/30 bg-muted/20 p-4">
      <Badge variant="outline" className="mb-3 border-amber-500/30 text-amber-500 text-[10px]">
        {d.label}
      </Badge>
      <div className="space-y-2 text-sm">
        {step.id === 1 && (
          <>
            <Row label="Name" value={d.name} />
            <Row label="Sovereign Trust Score" value={`${d.sts}/100 (Emerging Participant)`} />
            <Row label="Verification" value={d.level} />
            <Row label="Role" value={d.role} />
          </>
        )}
        {step.id === 2 && (
          <>
            <Row label="Enterprise" value={d.name} />
            <Row label="Sector" value={d.sector} />
            <Row label="Tier" value={d.tier} />
            <Row label="Capital Formation Goal" value={d.goal} />
          </>
        )}
        {step.id === 3 && (
          <div className="space-y-2">
            {d.items.map((item: { name: string; level: string }, i: number) => (
              <div key={i} className="flex items-center justify-between rounded border border-border/20 px-3 py-2">
                <span className="text-foreground">{item.name}</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">{item.level}</Badge>
              </div>
            ))}
          </div>
        )}
        {step.id === 4 && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="text-3xl font-bold text-gold">{d.score}</div>
              <div>
                <div className="text-xs text-muted-foreground">Feasibility Score</div>
                <Badge className={d.passed ? "bg-green-600" : "bg-red-600"}>
                  {d.passed ? "PASS (≥35)" : "REJECT (<35)"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              {d.breakdown.map((b: { step: string; result: string }, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.step}</span>
                  <span className="font-mono text-foreground">{b.result}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {step.id === 5 && (
          <>
            <Row label="Goal" value={d.goal} />
            <Row label="Equity Unit Price" value={d.equityUnitPrice} />
            <Row label="Total Equity Units" value={d.totalEquityUnits} />
            <Row label="Founder Equity" value={d.founderEquity} />
            <Row label="Law Firm Client Account" value={d.lawFirmAccount} />
            <div className="mt-2 flex items-center gap-2 rounded border border-gold/15 bg-gold/[0.03] px-3 py-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 text-gold" />
              AURIENTA never holds these funds — Zero Custody (Amendment IX)
            </div>
          </>
        )}
        {step.id === 6 && (
          <div className="space-y-2">
            {d.employees.map((emp: { name: string; position: string; band: string; nosi: string }, i: number) => (
              <div key={i} className="flex items-center justify-between rounded border border-border/20 px-3 py-2">
                <div>
                  <div className="text-foreground">{emp.name}</div>
                  <div className="text-xs text-muted-foreground">{emp.position}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{emp.band}</div>
                  <Badge variant="outline" className={`text-[10px] ${emp.nosi === "Registered" ? "border-green-500/30 text-green-500" : "border-amber-500/30 text-amber-500"}`}>
                    NOSI: {emp.nosi}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {step.id === 7 && (
          <>
            <Row label="Proposal" value={d.title} />
            <Row label="Quorum" value={d.quorum} />
            <Row label="Pass Threshold" value={d.passThreshold} />
            <Row label="Cooling Period" value={d.cooling} />
            <Row label="Voting Window" value={d.voting} />
            <Row label="Status" value={d.status} />
          </>
        )}
        {step.id === 8 && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="text-3xl font-bold text-gold">{d.score}</div>
              <div>
                <div className="text-xs text-muted-foreground">Health Score</div>
                <Badge className="bg-gold text-black">Rating: {d.rating}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              {d.vitalSigns.map((v: { name: string; value: string; status: string }, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground">{v.value}</span>
                    <span className={`h-2 w-2 rounded-full ${v.status === "healthy" ? "bg-green-500" : "bg-amber-500"}`} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {step.id === 9 && (
          <>
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Readiness Score</span>
                <span className="font-bold text-gold">{d.score}%</span>
              </div>
              <Progress value={d.score} className="h-2" />
            </div>
            <div className="space-y-1.5">
              {d.gates.map((g: { gate: string; passed: boolean }, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{g.gate}</span>
                  {g.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

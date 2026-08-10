export type Locale = "en" | "ar";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    "nav.constitution": "Constitution",
    "nav.pillars": "Pillars",
    "nav.tiers": "Tiers",
    "nav.howItWorks": "How it works",
    "nav.sovereignty": "Sovereignty",
    "nav.faq": "FAQ",
    "nav.registry": "Registry",
    "nav.signin": "Sign in",
    "nav.register": "Become a Partner",

    // Hero
    "hero.badge": "CONSTITUTIONAL ENTERPRISE INFRASTRUCTURE",
    "hero.title": "AURIENTA",
    "hero.cta.primary": "Begin Enterprise Formation",
    "hero.cta.secondary": "Explore the Constitution",
    "hero.badge.zeroCustody": "Zero Custody",
    "hero.badge.aiGovernance": "AI-Enforced Governance",
    "hero.badge.fraNoAction": "FRA No-Action Letter",
    "hero.hash": "Constitutional Hash",
    "hero.hashLive": "live on immutable ledger",

    // Constitution section
    "constitution.label": "THE CONSTITUTIONAL LAUNCHPAD",
    "constitution.quote":
      "Ownership without governance becomes speculation. Governance without enforcement becomes institutional theatre.",
    "constitution.description":
      "AURIENTA is a noncustodial constitutional infrastructure of structural trust. It eliminates corporate friction through AI-enforced governance so partners can build, own, and scale real businesses until they graduate into sovereign independence. Not crowdfunding. Not speculation. Not platform dependency.",

    // Pillars
    "pillars.moneyProtection": "Money Protection",
    "pillars.governanceIntegrity": "Governance Integrity",
    "pillars.constitutionalContinuity": "Constitutional Continuity",
    "pillars.fairness": "Fairness",
    "pillars.legalCompliance": "Legal Compliance",
    "pillars.transparency": "Transparency",

    // Tiers
    "tiers.title": "Constitutional Enterprise Tiers",
    "tiers.a.name": "Micro",
    "tiers.b.name": "Small",
    "tiers.c.name": "Growth",
    "tiers.d.name": "Established",
    "tiers.e.name": "University",
    "tiers.f.name": "Joint Stock",

    // Sovereignty
    "sovereignty.title": "Graduation & Sovereign Independence",
    "sovereignty.description":
      "Dependency is transitional. Sovereignty is the destination.",

    // Stats
    "stats.jobsCreated": "Jobs created",
    "stats.gdpShare": "Of Egyptian GDP",
    "stats.enterprises": "Enterprises",
    "stats.equityUnits": "Equity Units",

    // Compliance
    "compliance.title": "Legal & Regulatory Compliance",

    // FAQ
    "faq.title": "Frequently Asked Questions",

    // Final CTA
    "finalCta.title": "Begin Your Constitutional Enterprise",
    "finalCta.subtitle":
      "Your capital, your work, your company — no speculation required.",
    "finalCta.button": "Begin Enterprise Formation",

    // Footer
    "footer.constitution": "Constitution",
    "footer.tiers": "Enterprise Tiers",
    "footer.infrastructure": "Infrastructure",
    "footer.access": "Access",
    "footer.legal": "Legal",

    // Dashboard
    "dash.overview": "Overview",
    "dash.portfolio": "Constitutional Holdings",
    "dash.opportunities": "Capital Participation",
    "dash.market": "Enterprise Registry",
    "dash.governance": "Governance",
    "dash.manager": "Manager Console",
    "dash.founder": "Founding Operator Studio",
    "dash.workforce": "Workforce Registry",
    "dash.graduation": "Graduation",
    "dash.brainAi": "Brain AI",
    "dash.compliance": "Compliance",
    "dash.escrow": "Law Firm Client Accounts",
    "dash.salary": "AI Salary Engine",
    "dash.vault": "Insurance Vault",
    "dash.solvency": "Proof-of-Solvency",

    // Common
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Try again",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.submit": "Submit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.all": "All",
    "common.none": "None",
    "common.yes": "Yes",
    "common.no": "No",
    "common.unknown": "UNKNOWN",
    "common.requiresCounsel": "REQUIRES COUNSEL",
    "common.demo": "DEMO",
    "common.example": "EXAMPLE",

    // Evidence
    "evidence.e0": "Founder Assumption",
    "evidence.e1": "Market Hypothesis",
    "evidence.e2": "Customer Conversation",
    "evidence.e3": "Qualified Opportunity",
    "evidence.e4": "Proposal",
    "evidence.e5": "Signed Agreement",
    "evidence.e6": "Active Deployment",
    "evidence.e7": "Measured Outcome",
    "evidence.e8": "Collected Revenue",
    "evidence.e9": "Repeatable Outcome",

    // Empty states
    "empty.noEnterprises": "No enterprises registered yet.",
    "empty.noProposals":
      "Governance has not yet been established for this enterprise.",
    "empty.noEmployees": "No workforce records have been registered yet.",
    "empty.noRevenue": "No verified revenue has been recorded.",
    "empty.noEvidence": "No supporting evidence has been submitted.",
    "empty.noPartners": "No verified institutional partners recorded yet.",
    "empty.noCustomers": "No verified customers recorded yet.",
    "empty.noTrades": "No trades have been executed yet.",

    // Error states
    "error.network":
      "We could not retrieve this information. Please try again.",
    "error.permission":
      "Access is restricted. You do not have the required role.",
    "error.creDenied": "This action was rejected by constitutional rules.",
    "error.missingEvidence": "Evidence has not yet been provided.",
    "error.insufficientData": "INSUFFICIENT EVIDENCE",

    // Auth
    "auth.signin": "Sign in to AURIENTA",
    "auth.register": "Become a Constitutional Partner",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.mobile": "Mobile",
    "auth.legalName": "Full Legal Name",

    // Roles
    "role.capital_partner": "Capital Partner",
    "role.founding_operator": "Founding Operator",
    "role.workforce_partner": "Workforce Partner",
    "role.manager": "Manager",
    "role.board_member": "Board Member",
    "role.company_owner": "Company Owner",
    "role.law_firm_rep": "Law Firm Rep",
    "role.accounting_firm_rep": "Accounting Firm Rep",
    "role.aurienta_rep": "AURIENTA Rep",
    "role.university_rep": "University Rep",

    // Product Preview
    "preview.title": "Explore AURIENTA",
    "preview.subtitle":
      "An interactive walkthrough of the constitutional enterprise experience",
    "preview.demoNotice":
      "This is a DEMO preview using example data. No real enterprises, partners, or transactions are shown.",
    "preview.step1": "Founder enters AURIENTA",
    "preview.step2": "Enterprise profile",
    "preview.step3": "Evidence submission",
    "preview.step4": "Tier determination",
    "preview.step5": "Capital structure",
    "preview.step6": "Workforce transparency",
    "preview.step7": "Governance",
    "preview.step8": "Constitutional health",
    "preview.step9": "Graduation readiness",
    "preview.next": "Next step",
    "preview.prev": "Previous",
    "preview.startOver": "Start over",

    // Evidence & Development Stage
    "evidenceStage.title": "Evidence & Development Stage",
    "evidenceStage.founderLed": "Founder-led development",
    "evidenceStage.constitutional": "Constitutional architecture",
    "evidenceStage.currentStage": "Current development stage",
    "evidenceStage.evidenceLevel": "Evidence level",
    "evidenceStage.built": "What has been built",
    "evidenceStage.validating": "What is being validated",
    "evidenceStage.remaining": "What remains to be proven",
  },
  ar: {
    // Navigation
    "nav.constitution": "الدستور",
    "nav.pillars": "الركائز",
    "nav.tiers": "المستويات",
    "nav.howItWorks": "كيف تعمل",
    "nav.sovereignty": "السيادة",
    "nav.faq": "الأسئلة الشائعة",
    "nav.registry": "السجل",
    "nav.signin": "تسجيل الدخول",
    "nav.register": "كن شريكاً",

    // Hero
    "hero.badge": "البنية التحتية الدستورية للمؤسسات",
    "hero.title": "أوريينتا",
    "hero.cta.primary": "ابدأ تأسيس المؤسسة",
    "hero.cta.secondary": "استكشف الدستور",
    "hero.badge.zeroCustody": "بدون حيازة أموال",
    "hero.badge.aiGovernance": "حوكمة بالذكاء الاصطناعي",
    "hero.badge.fraNoAction":
      "خطاب عدم ممانعة من الهيئة العامة للرقابة المالية",
    "hero.hash": "البصمة الدستورية",
    "hero.hashLive": "مباشر على السجل غير القابل للتلاعب",

    // Constitution section
    "constitution.label": "المنصة الدستورية للتأسيس",
    "constitution.quote":
      "الملكية بدون حوكمة تصبح مضاربة. والحوكمة بدون تنفيذ تصبح مسرحاً مؤسسياً.",
    "constitution.description":
      "أوريينتا هي بنية تحتية دستورية غير حائزة للثقة الهيكلية. تزيل الاحتكاك المؤسسي من خلال حوكمة منفذة بالذكاء الاصطناعي ليتمكن الشركاء من بناء وامتلاك وتوسيع أعمال حقيقية حتى يتخرجوا إلى الاستقلال المؤسسي. ليست تمويلاً جماعياً. ليست مضاربة. ليست اعتماداً على المنصة.",

    // Pillars
    "pillars.moneyProtection": "حماية الأموال",
    "pillars.governanceIntegrity": "نزاهة الحوكمة",
    "pillars.constitutionalContinuity": "الاستمرارية الدستورية",
    "pillars.fairness": "العدالة",
    "pillars.legalCompliance": "الامتثال القانوني",
    "pillars.transparency": "الشفافية",

    // Tiers
    "tiers.title": "مستويات المؤسسات الدستورية",
    "tiers.a.name": "ميكرو",
    "tiers.b.name": "صغيرة",
    "tiers.c.name": "نمو",
    "tiers.d.name": "راسخة",
    "tiers.e.name": "جامعية",
    "tiers.f.name": "مساهمة",

    // Sovereignty
    "sovereignty.title": "التخرج والاستقلال المؤسسي",
    "sovereignty.description": "الاعتماد مؤقت. السيادة هي الوجهة.",

    // Stats
    "stats.jobsCreated": "وظائف تم إنشاؤها",
    "stats.gdpShare": "من الناتج المحلي المصري",
    "stats.enterprises": "المؤسسات",
    "stats.equityUnits": "وحدات الملكية",

    // Compliance
    "compliance.title": "الامتثال القانوني والتنظيمي",

    // FAQ
    "faq.title": "الأسئلة الشائعة",

    // Final CTA
    "finalCta.title": "ابدأ مؤسستك الدستورية",
    "finalCta.subtitle": "رأس مالك، عملك، شركتك — بدون مضاربة.",
    "finalCta.button": "ابدأ تأسيس المؤسسة",

    // Footer
    "footer.constitution": "الدستور",
    "footer.tiers": "مستويات المؤسسات",
    "footer.infrastructure": "البنية التحتية",
    "footer.access": "الوصول",
    "footer.legal": "قانوني",

    // Dashboard
    "dash.overview": "نظرة عامة",
    "dash.portfolio": "الم Holdings الدستورية",
    "dash.opportunities": "المشاركة الرأسمالية",
    "dash.market": "سجل المؤسسات",
    "dash.governance": "الحوكمة",
    "dash.manager": "وحدة المدير",
    "dash.founder": "استوديو المؤسس",
    "dash.workforce": "سجل القوى العاملة",
    "dash.graduation": "التخرج",
    "dash.brainAi": "الذكاء المؤسسي",
    "dash.compliance": "الامتثال",
    "dash.escrow": "حسابات عميل مكتب المحاماة",
    "dash.salary": "محرك الأجور بالذكاء الاصطناعي",
    "dash.vault": "صندوق التأمين",
    "dash.solvency": "إثبات الملاءة",

    // Common
    "common.loading": "جارٍ التحميل…",
    "common.error": "حدث خطأ ما",
    "common.retry": "حاول مرة أخرى",
    "common.cancel": "إلغاء",
    "common.save": "حفظ",
    "common.submit": "إرسال",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.all": "الكل",
    "common.none": "لا شيء",
    "common.yes": "نعم",
    "common.no": "لا",
    "common.unknown": "غير معروف",
    "common.requiresCounsel": "يتطلب استشارة قانونية",
    "common.demo": "تجريبي",
    "common.example": "مثال",

    // Evidence
    "evidence.e0": "افتراض المؤسس",
    "evidence.e1": "فرضية السوق",
    "evidence.e2": "محادثة مع عميل",
    "evidence.e3": "فرصة مؤهلة",
    "evidence.e4": "اقتراح",
    "evidence.e5": "اتفاقية موقعة",
    "evidence.e6": "نشر نشط",
    "evidence.e7": "نتيجة مقاسة",
    "evidence.e8": "إيرادات محصلة",
    "evidence.e9": "نتيجة قابلة للتكرار",

    // Empty states
    "empty.noEnterprises": "لا توجد مؤسسات مسجلة بعد.",
    "empty.noProposals": "لم يتم تأسيس الحوكمة لهذه المؤسسة بعد.",
    "empty.noEmployees": "لم يتم تسجيل سجلات القوى العاملة بعد.",
    "empty.noRevenue": "لم يتم تسجيل إيرادات موثقة.",
    "empty.noEvidence": "لم يتم تقديم أدلة داعمة.",
    "empty.noPartners": "لا يوجد شركاء مؤسسيون موثقون حتى الآن.",
    "empty.noCustomers": "لا يوجد عملاء موثقون حتى الآن.",
    "empty.noTrades": "لم يتم تنفيذ صفقات بعد.",

    // Error states
    "error.network": "تعذر علينا استرداد هذه المعلومات. يرجى المحاولة مرة أخرى.",
    "error.permission": "الوصول مقيد. ليس لديك الدور المطلوب.",
    "error.creDenied": "تم رفض هذا الإجراء من قبل القواعد الدستورية.",
    "error.missingEvidence": "لم يتم تقديم الأدلة بعد.",
    "error.insufficientData": "أدلة غير كافية",

    // Auth
    "auth.signin": "تسجيل الدخول إلى أوريينتا",
    "auth.register": "كن شريكاً دستورياً",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.mobile": "الهاتف المحمول",
    "auth.legalName": "الاسم القانوني الكامل",

    // Roles
    "role.capital_partner": "شريك رأس المال",
    "role.founding_operator": "المؤسس",
    "role.workforce_partner": "شريك القوى العاملة",
    "role.manager": "مدير",
    "role.board_member": "عضو مجلس",
    "role.company_owner": "مالك الشركة",
    "role.law_firm_rep": "ممثل مكتب المحاماة",
    "role.accounting_firm_rep": "ممثل مكتب المحاسبة",
    "role.aurienta_rep": "ممثل أوريينتا",
    "role.university_rep": "ممثل جامعي",

    // Product Preview
    "preview.title": "استكشف أوريينتا",
    "preview.subtitle": "جولة تفاعلية في تجربة المؤسسة الدستورية",
    "preview.demoNotice":
      "هذه معاينة تجريبية باستخدام بيانات مثال. لا يتم عرض مؤسسات أو شركاء أو معاملات حقيقية.",
    "preview.step1": "دخول المؤسس إلى أوريينتا",
    "preview.step2": "ملف المؤسسة",
    "preview.step3": "تقديم الأدلة",
    "preview.step4": "تحديد المستوى",
    "preview.step5": "هيكل رأس المال",
    "preview.step6": "شفافية القوى العاملة",
    "preview.step7": "الحوكمة",
    "preview.step8": "الصحة الدستورية",
    "preview.step9": "جاهزية التخرج",
    "preview.next": "الخطوة التالية",
    "preview.prev": "السابق",
    "preview.startOver": "ابدأ من جديد",

    // Evidence & Development Stage
    "evidenceStage.title": "مرحلة الأدلة والتطوير",
    "evidenceStage.founderLed": "تطوير بقيادة المؤسس",
    "evidenceStage.constitutional": "بنية دستورية",
    "evidenceStage.currentStage": "مرحلة التطوير الحالية",
    "evidenceStage.evidenceLevel": "مستوى الأدلة",
    "evidenceStage.built": "ما تم بناؤه",
    "evidenceStage.validating": "ما يتم التحقق منه",
    "evidenceStage.remaining": "ما يلزم إثباته",
  },
};

export function getDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck,
  Scale,
  FileText,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Languages,
} from "lucide-react";
import {
  LEGAL_DISCLAIMER_VERSION,
  LEGAL_DISCLAIMER_EFFECTIVE_DATE,
  LEGAL_DISCLAIMER_EN,
  LEGAL_DISCLAIMER_AR,
  AFFIRMATION_TEXT_EN,
  AFFIRMATION_TEXT_AR,
} from "@/lib/aurienta/legal-disclaimer";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { useToast } from "@/hooks/use-toast";

export function LegalDisclaimerClient() {
  const [language, setLanguage] = React.useState<"en" | "ar">("en");
  const [accepted, setAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = React.useState(false);
  const { toast } = useToast();

  // Check if the user has already accepted
  React.useEffect(() => {
    fetch("/api/terms/acceptance")
      .then((r) => r.json())
      .then((data) => {
        if (data.accepted) {
          setAlreadyAccepted(true);
          setAccepted(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleAccept = async () => {
    if (!accepted) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/terms/acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentVersion: LEGAL_DISCLAIMER_VERSION,
          language,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Terms Accepted",
          description:
            language === "ar"
              ? "تم تسجيل قبولكم لشروط المنصة. شكراً لكم."
              : "Your acceptance has been recorded. Thank you.",
        });
        setAlreadyAccepted(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to record acceptance",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error — please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isRtl = language === "ar";
  const disclaimerText = language === "ar" ? LEGAL_DISCLAIMER_AR : LEGAL_DISCLAIMER_EN;
  const affirmationText =
    language === "ar" ? AFFIRMATION_TEXT_AR : AFFIRMATION_TEXT_EN;
  const sections = disclaimerText
    .split(/\n(?=\d+\.\s)/)
    .filter((s) => s.trim().length > 0);

  return (
    <div
      className="min-h-screen bg-background"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="border-b border-border/40 bg-gradient-to-b from-gold/5 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-gold" />
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                  {language === "ar"
                    ? "الشروط القانونية وإخلاء المسؤولية"
                    : "Platform Terms & Legal Disclaimer"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "منصة AURIENTA — اتفاقية المشاركة الدستورية"
                    : "AURIENTA — Constitutional Participation Agreement"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            >
              <Languages className="mr-2 h-4 w-4" />
              {language === "en" ? "العربية" : "English"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-gold/30 text-gold">
              <FileText className="mr-1 h-3 w-3" />
              {language === "ar" ? "الإصدار" : "Version"} {LEGAL_DISCLAIMER_VERSION}
            </Badge>
            <Badge variant="outline">
              <Globe className="mr-1 h-3 w-3" />
              {language === "ar" ? "جمهورية مصر العربية" : "Arab Republic of Egypt"}
            </Badge>
            <Badge variant="outline">
              {language === "ar" ? "تاريخ السريان" : "Effective"}:{" "}
              {LEGAL_DISCLAIMER_EFFECTIVE_DATE}
            </Badge>
            {alreadyAccepted && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {language === "ar" ? "تم القبول" : "Accepted"}
              </Badge>
            )}
          </div>

          {/* Important notice */}
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <p className="text-sm text-amber-200/90">
                {language === "ar"
                  ? "يرجى قراءة هذه الشروط بعناية. بالنسبة للمستخدمين المصريين، تُعد النسخة العربية النص القانوني المتحكم. الأحكام الإلزامية للقانون المصري تسود على أي قاعدة داخلية."
                  : "Please read these terms carefully. For Egyptian users, the Arabic version is the controlling legal text. Mandatory provisions of Egyptian law prevail over any internal platform rule."}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <ShieldCheck className="h-5 w-5 text-gold" />
              {language === "ar"
                ? "النص الكامل للشروط"
                : "Full Terms Text"}
            </CardTitle>
            <CardDescription>
              {language === "ar"
                ? "اقرأ全文 ثم اقبل في الأسفل للمتابعة"
                : "Read the full text, then accept at the bottom to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] rounded-md border border-border/20 p-6">
              <div
                className="prose prose-sm max-w-none whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90"
                style={{ fontFamily: isRtl ? "system-ui, sans-serif" : "inherit" }}
              >
                {disclaimerText}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Acceptance section */}
        <Card className="mt-6 border-gold/20">
          <CardHeader>
            <CardTitle className="font-serif">
              {language === "ar" ? "الإقرار النهائي" : "Final Acknowledgment"}
            </CardTitle>
            <CardDescription>
              {language === "ar"
                ? "يجب قبول هذه الشروط لاستخدام المنصة. لا يمكن تحديد المربع مسبقًا."
                : "You must accept these terms to use the platform. The checkbox must not be pre-selected."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {affirmationText}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-1"
              />
              <Label
                htmlFor="terms-accept"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                {language === "ar"
                  ? "قرأت وفهمت ووافقت على الشروط أعلاه."
                  : "I have read, understood and accepted the terms above."}
              </Label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAccept}
                disabled={!accepted || submitting || alreadyAccepted}
                className="bg-gold text-black hover:bg-gold/90"
              >
                {submitting
                  ? language === "ar"
                    ? "جاري التسجيل..."
                    : "Recording..."
                  : alreadyAccepted
                  ? language === "ar"
                    ? "تم القبول ✓"
                    : "Accepted ✓"
                  : language === "ar"
                  ? "موافقة واستمرار"
                  : "Accept & Continue"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {language === "ar"
                ? "يتم تسجيل قبولكم إلكترونيًا مع: معرف المستخدم، التاريخ والوقت، نسخة الوثيقة، البصمة التشفيرية، عنوان IP (عند جمعه قانونًا). وفقًا للقانون رقم 15 لسنة 2004، لا يُعتبر هذا القبول توقيعًا إلكترونيًا مؤهلاً. حيثما يتطلب القانون توقيعًا مؤهلاً، يتم استخدام سير عمل منفصل."
                : "Your acceptance is recorded electronically with: userId, timestamp, document version, cryptographic hash, and IP address (where lawfully collected). Per Law No. 15 of 2004, this acceptance is NOT a qualified electronic signature. Where a qualified signature is legally required, a separate workflow is used."}
            </p>
          </CardContent>
        </Card>

        {/* Constitutional hash */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? "البصمة الدستورية"
              : "Constitutional Hash"}{" "}
            · <span className="font-mono text-gold/80">{CONSTITUTIONAL_HASH}</span>
          </p>
        </div>
      </main>
    </div>
  );
}

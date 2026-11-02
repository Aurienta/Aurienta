import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GoldStar } from "@/components/aurienta-logo";

export function PagePlaceholder({
  title,
  description,
  section,
}: {
  title: string;
  description: string;
  section: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gold/10 blur-2xl" />
        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <Construction className="h-7 w-7 text-gold" />
        </div>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <GoldStar className="h-3 w-3" />
        <span className="font-sans text-xs font-medium uppercase tracking-[0.24em] text-gold-light/80">
          {section}
        </span>
      </div>
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-md font-sans text-sm text-muted-foreground">{description}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-5 py-2.5 font-sans text-sm text-foreground transition-colors hover:bg-gold/5"
      >
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>
    </div>
  );
}

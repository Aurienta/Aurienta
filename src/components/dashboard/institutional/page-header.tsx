import * as React from "react";
import { GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

/**
 * Shared institutional page header — eyebrow + serif title + supporting subtitle,
 * with a subtle constitutional-hash stamp on the right for desktop.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: React.ElementType;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <Icon className="h-3.5 w-3.5 text-gold" />
              </span>
            ) : (
              <GoldStar className="h-3.5 w-3.5" />
            )}
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/85">
              {eyebrow}
            </span>
          </div>
          <h1
            className={cn(
              "mt-3 max-w-3xl font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl",
              accent ?? "text-foreground"
            )}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
          {children && <div className="mt-5">{children}</div>}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            Constitutional Anchor
          </span>
          <span className="font-mono text-[11px] text-gold/70">{shortHash(CONSTITUTIONAL_HASH, 14, 6)}</span>
          <span className="font-sans text-xs text-muted-foreground/80">CRE online · sovereign mode</span>
        </div>
      </div>
    </section>
  );
}

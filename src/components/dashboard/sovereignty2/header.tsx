import * as React from "react";
import { cn } from "@/lib/utils";
import { GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";

/**
 * Shared eyebrow + serif title + supporting subtitle, with a constitutional-hash
 * stamp on the right for desktop. Same look-and-feel as the institutional PageHeader
 * but local to sovereignty2 so I don't touch foundation files.
 */
export function SovereigntyHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  icon?: React.ElementType;
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
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-4xl">
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
          <span className="font-mono text-[11px] text-gold/70">
            {shortHash(CONSTITUTIONAL_HASH, 14, 6)}
          </span>
          <span className="font-sans text-xs text-muted-foreground/80">
            CRE online · sovereign mode
          </span>
        </div>
      </div>
    </section>
  );
}

/** Small gold-on-dark info card with optional left-border accent. */
export function InfoCard({
  title,
  children,
  className,
  accent = true,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gold/12 glass p-5",
        accent && "border-l-2 border-l-gold/40",
        className
      )}
    >
      {title && (
        <h3 className="mb-2 font-serif text-base font-semibold text-foreground">{title}</h3>
      )}
      <div className="font-sans text-[13px] leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

/** Footer hash + disclaimer strip shown at the bottom of each sovereignty page. */
export function SovereigntyFooter({ note }: { note?: string }) {
  return (
    <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
      {note && <span className="mr-2">{note}</span>}
      <span>·</span> <span>Constitutional anchor {shortHash(CONSTITUTIONAL_HASH, 14, 6)}</span>
    </p>
  );
}

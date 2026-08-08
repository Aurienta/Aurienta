import Link from "next/link";
import { Settings2, ShieldCheck, ShieldAlert } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

type SelectorEnterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  policeClearanceValid: boolean;
};

/**
 * Manager Console header — eyebrow, serif title, enterprise selector pills,
 * police-clearance badge, and constitutional-hash stamp.
 *
 * The selector is plain anchor links so the page re-renders server-side on
 * change (no client state needed).
 */
export function ManagerHeader({
  enterprises,
  selectedId,
  policeClearanceValid,
  role,
}: {
  enterprises: SelectorEnterprise[];
  selectedId: string;
  policeClearanceValid: boolean;
  role: string;
}) {
  const clearance = policeClearanceBadge(policeClearanceValid);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
              <Settings2 className="h-3.5 w-3.5 text-gold" />
            </span>
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/85">
              Manager Console
            </span>
            <span className="ml-2 hidden items-center gap-1.5 sm:inline-flex">
              <GoldStar className="h-3 w-3" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground/85">
                {role.replace("_", " ")}
              </span>
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
            Operations &amp; Treasury
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
            Constitutional expense authority, workforce partner registry, and the salary-to-equity
            doctrine — enforced in real time by the CRE.
          </p>

          {/* Enterprise selector — anchor pills so the route re-renders server-side */}
          {enterprises.length > 1 && (
            <nav
              aria-label="Select enterprise"
              className="mt-5 flex flex-wrap items-center gap-2"
            >
              {enterprises.map((e) => {
                const active = e.id === selectedId;
                return (
                  <Link
                    key={e.id}
                    href={`/dashboard/manager?enterprise=${e.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-sans text-xs font-medium transition-all",
                      active
                        ? "border-gold/40 bg-gold-gradient text-black shadow-[0_4px_20px_-6px_rgba(212,175,55,0.55)]"
                        : "border-gold/15 bg-background/40 text-muted-foreground hover:border-gold/30 hover:text-foreground"
                    )}
                  >
                    <span className="font-serif">{e.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 font-mono text-[11px]",
                        active ? "bg-black/20 text-black/80" : "bg-gold/10 text-gold/70"
                      )}
                    >
                      T{e.tier}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}

          {enterprises.length === 1 && (
            <p className="mt-4 font-sans text-sm text-muted-foreground">
              <span className="font-serif font-medium text-foreground">
                {enterprises[0].name}
              </span>{" "}
              · Tier {enterprises[0].tier}
            </p>
          )}
        </div>

        {/* Police clearance + constitutional anchor */}
        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <div
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border px-4 py-2.5",
              clearance.wrap
            )}
            role="status"
            aria-label={`Police clearance: ${clearance.label}`}
          >
            <clearance.icon className={cn("h-4 w-4", clearance.iconCls)} />
            <div className="leading-tight">
              <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                Police clearance
              </p>
              <p className={cn("font-serif text-sm font-semibold", clearance.text)}>
                {clearance.label}
              </p>
            </div>
          </div>

          <div className="hidden flex-col items-end gap-1 lg:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Constitutional Anchor
            </span>
            <span className="font-mono text-[11px] text-gold/70">
              {shortHash(CONSTITUTIONAL_HASH, 14, 6)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function policeClearanceBadge(valid: boolean) {
  if (valid) {
    return {
      label: "Valid",
      icon: ShieldCheck,
      wrap: "border-emerald-400/30 bg-emerald-400/[0.06]",
      iconCls: "text-emerald-400",
      text: "text-emerald-300",
    };
  }
  // Demo only — the seed always has valid clearance, but the expiring state
  // is colour-coded amber, and the revoked state is red.
  return {
    label: "Action required",
    icon: ShieldAlert,
    wrap: "border-amber-400/30 bg-amber-400/[0.06]",
    iconCls: "text-amber-400",
    text: "text-amber-300",
  };
}

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_META, STAGE_META } from "@/lib/aurienta/constants";

export type EnterpriseOption = {
  id: string;
  name: string;
  tier: string;
  stage: string;
  sector: string;
  slug: string;
  healthRating?: string | null;
};

/**
 * Compact enterprise selector used at the top of every Sovereignty & Ops AI page.
 * Renders a glass-gold dropdown; reports the chosen id via onChange.
 */
export function EnterpriseSelector({
  options,
  value,
  onChange,
  emptyLabel = "No eligible enterprises",
  ariaLabel = "Select an enterprise",
}: {
  options: EnterpriseOption[];
  value: string;
  onChange: (id: string) => void;
  emptyLabel?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.id === value) ?? null;

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-xl border border-gold/15 bg-foreground/[0.02] px-4 py-3 text-left transition-colors hover:border-gold/30",
          open && "border-gold/40"
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
            <Building2 className="h-4 w-4 text-gold" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-sm font-semibold text-foreground">
              {selected ? selected.name : "Select an enterprise"}
            </span>
            <span className="block truncate font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {selected
                ? `Tier ${selected.tier} · ${STAGE_META[selected.stage]?.name ?? selected.stage} · ${selected.sector}`
                : emptyLabel}
            </span>
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:text-gold" />
      </button>

      {open && (
        <motion.ul
          role="listbox"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gold/20 bg-background/95 p-1 shadow-2xl backdrop-blur-xl"
        >
          {options.length === 0 ? (
            <li className="px-3 py-6 text-center font-sans text-xs text-muted-foreground">
              {emptyLabel}
            </li>
          ) : (
            options.map((o) => {
              const active = o.id === value;
              const meta = TIER_META[o.tier];
              return (
                <li key={o.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      active ? "bg-gold/12 text-foreground" : "hover:bg-foreground/[0.04]"
                    )}
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gold/20 bg-gold/8 font-mono text-xs font-semibold text-gold-light">
                      {o.tier}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-[13px] font-semibold">
                        {o.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {meta?.legalForm ?? "—"} · {STAGE_META[o.stage]?.name ?? o.stage} · {o.sector}
                        {o.healthRating ? ` · ${o.healthRating}` : ""}
                      </span>
                    </span>
                    {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />}
                  </button>
                </li>
              );
            })
          )}
        </motion.ul>
      )}
    </div>
  );
}

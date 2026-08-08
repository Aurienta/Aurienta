import { ShieldCheck, BadgeCheck, Lock, Cpu } from "lucide-react";

export function ComplianceBadges() {
  const badges = [
    { icon: Lock, label: "Zero Custody", status: "Enforced" },
    { icon: Cpu, label: "AI Governance", status: "Active" },
    { icon: ShieldCheck, label: "Police Clearance", status: "Valid" },
    { icon: BadgeCheck, label: "Social Insurance (NOSI)", status: "100%" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-3 rounded-xl border border-gold/12 bg-gradient-to-br from-emerald-400/[0.04] to-transparent p-4"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/5">
            <b.icon className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-sans text-xs text-muted-foreground">{b.label}</p>
            <p className="font-serif text-sm font-semibold text-foreground">{b.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

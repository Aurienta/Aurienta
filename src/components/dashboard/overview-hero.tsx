import { stsLevel } from "@/lib/aurienta/constants";
import { egp } from "@/lib/aurienta/format";
import { GoldStar } from "@/components/aurienta-logo";
import { Progress } from "@/components/ui/progress";
import { Crown, Wallet, Users, ShieldCheck } from "lucide-react";

export function OverviewHero({
  user,
  portfolioValue,
}: {
  user: {
    legalName: string;
    sovereignTrustScore: number;
    tier: string;
    memberships: { role: string }[];
  };
  portfolioValue: number;
}) {
  const level = stsLevel(user.sovereignTrustScore);
  const firstName = user.legalName.split(" ")[0];
  const activeRoles = new Set(user.memberships.map((m) => m.role)).size;
  const enterprises = user.memberships.length;

  const nextLevel = user.sovereignTrustScore >= 90 ? null : user.sovereignTrustScore >= 80 ? 90 : 80;
  const progress = nextLevel ? ((user.sovereignTrustScore - (nextLevel - 10)) / 10) * 100 : 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <GoldStar className="h-3.5 w-3.5" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Constitutional Workspace
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl font-sans text-sm text-muted-foreground">
            Your unified constitutional workspace. One identity, every role, sovereign trust
            operationalised by the CRE.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Stat icon={Wallet} label="Portfolio value" value={egp(portfolioValue, { compact: portfolioValue > 1_000_000 })} />
            <Stat icon={Users} label="Active roles" value={`${activeRoles}`} />
            <Stat icon={Crown} label="Enterprises" value={`${enterprises}`} />
          </div>
        </div>

        {/* Trust score gauge */}
        <div className="shrink-0 rounded-2xl border border-gold/12 bg-background/50 p-5 text-center lg:w-56">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Sovereign Trust Score
          </p>
          <p className="mt-1 font-serif text-5xl font-semibold" style={{ color: level.color }}>
            {user.sovereignTrustScore}
          </p>
          <p className="font-sans text-xs" style={{ color: level.color }}>
            {level.name}
          </p>
          {nextLevel && (
            <div className="mt-3">
              <Progress value={progress} className="h-1.5 bg-gold/10" />
              <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                {nextLevel - user.sovereignTrustScore} pts to next tier
              </p>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-gold/70">
            <ShieldCheck className="h-3 w-3" />
            <span className="font-mono text-[11px]">Ed25519 anchor sealed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div>
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-serif text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}

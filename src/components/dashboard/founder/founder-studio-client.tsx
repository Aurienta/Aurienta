"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { Building2, Rocket, Plus, Crown } from "lucide-react";
import type { FounderEnterprise, FounderMilestone } from "./types";
import { EnterpriseCard } from "./enterprise-card";
import { EnterpriseDetailDialog } from "./enterprise-detail-dialog";
import { NewEnterpriseWizard } from "./new-enterprise-wizard";

export function FounderStudioClient({
  enterprises,
  constitutionalHash,
  founderName,
}: {
  enterprises: FounderEnterprise[];
  constitutionalHash: string;
  founderName: string;
}) {
  const [tab, setTab] = React.useState<"enterprises" | "new">("enterprises");
  const [list, setList] = React.useState<FounderEnterprise[]>(enterprises);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailEnterprise, setDetailEnterprise] = React.useState<FounderEnterprise | null>(null);

  // Keep local state in sync with server-side data when the page is re-rendered.
  React.useEffect(() => {
    setList(enterprises);
  }, [enterprises]);

  const openDetail = (e: FounderEnterprise) => {
    setDetailEnterprise(e);
    setDetailOpen(true);
  };

  const onMilestoneSubmitted = (updated: FounderMilestone) => {
    if (!detailEnterprise) return;
    const next: FounderEnterprise = {
      ...detailEnterprise,
      milestones: detailEnterprise.milestones.map((m) =>
        m.id === updated.id ? updated : m
      ),
    };
    setDetailEnterprise(next);
    setList((prev) =>
      prev.map((e) =>
        e.id === next.id
          ? { ...e, milestones: e.milestones.map((m) => (m.id === updated.id ? updated : m)) }
          : e
      )
    );
  };

  const switchToEnterprises = () => setTab("enterprises");

  const firstName = founderName.split(" ")[0];

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <Toaster richColors position="top-right" />
      {/* Hero header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-6 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <AurientaMark className="h-6 w-6" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
                Founding Operator Studio
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              Constitute your sovereign enterprise.
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
              Welcome, {firstName}. Manage your founded enterprises, submit milestone evidence,
              and launch new constitutional charters — every action CRE-enforced and sealed
              on the immutable ledger.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge2 icon={Crown} label={`${list.length} enterprise${list.length === 1 ? "" : "s"} founded`} />
              <Badge2 icon={GoldStar} label={`Charter ${constitutionalHash.slice(0, 12)}…`} />
            </div>
          </div>

          <div className="shrink-0">
            <Button
              onClick={() => setTab("new")}
              className="group relative h-11 overflow-hidden rounded-lg bg-gold-gradient px-5 text-sm font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.7)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Constitution
              </span>
            </Button>
          </div>
        </div>
      </motion.section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "enterprises" | "new")} className="gap-5">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl border border-gold/10 bg-background/40 p-1.5 sm:w-auto">
          <TabsTrigger
            value="enterprises"
            className="h-8 gap-2 px-4 text-sm font-medium data-[state=active]:bg-gold-gradient data-[state=active]:text-black"
          >
            <Building2 className="h-4 w-4" /> My Enterprises
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="h-8 gap-2 px-4 text-sm font-medium data-[state=active]:bg-gold-gradient data-[state=active]:text-black"
          >
            <Rocket className="h-4 w-4" /> New Founding Constitution
          </TabsTrigger>
        </TabsList>

        {/* Tab A — My Enterprises */}
        <TabsContent value="enterprises" className="flex flex-col gap-5">
          {list.length === 0 ? (
            <EmptyState onCreate={() => setTab("new")} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {list.map((e) => (
                <EnterpriseCard key={e.id} enterprise={e} onOpen={() => openDetail(e)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab B — New Constitution Wizard */}
        <TabsContent value="new">
          <NewEnterpriseWizard
            onLaunched={switchToEnterprises}
            onCancel={switchToEnterprises}
          />
        </TabsContent>
      </Tabs>

      <EnterpriseDetailDialog
        enterprise={detailEnterprise}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMilestoneSubmitted={onMilestoneSubmitted}
      />
    </div>
  );
}

function Badge2({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-background/50 px-3 py-1 font-sans text-[11px] text-muted-foreground">
      <Icon className="h-3 w-3 text-gold/70" />
      {label}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gold/25 bg-background/30 px-6 py-16 text-center"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gold/15 blur-2xl" />
        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <Rocket className="h-7 w-7 text-gold" />
        </div>
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold">No enterprises yet</h3>
        <p className="mt-1 max-w-md font-sans text-sm text-muted-foreground">
          Constitute your first enterprise — pick a tier, run the feasibility engine,
          sign the charter, and the CRE will enforce every rule from day one.
        </p>
      </div>
      <Button
        onClick={onCreate}
        className="h-11 gap-2 rounded-lg bg-gold-gradient px-5 text-sm font-semibold text-black"
      >
        <Plus className="h-4 w-4" /> Begin a New Founding Constitution
      </Button>
    </motion.div>
  );
}

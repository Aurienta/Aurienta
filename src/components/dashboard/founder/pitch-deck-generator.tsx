"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles, Presentation, Download, Copy, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  fundraisingGoalEgp: string;
  equityUnitPriceEgp: string;
  description: string;
  tagline: string | null;
};

type Slide = {
  number: number;
  title: string;
  content: string;
  bullets: string[];
};

type User = { id: string; legalName: string; email: string };

export function PitchDeckGenerator({
  user,
  enterprises,
}: {
  user: User;
  enterprises: Enterprise[];
}) {
  const [loading, setLoading] = React.useState(false);
  const [slides, setSlides] = React.useState<Slide[] | null>(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);

  // Form state
  const [selectedEntId, setSelectedEntId] = React.useState<string>(enterprises[0]?.id ?? "");
  const [name, setName] = React.useState(enterprises[0]?.name ?? "");
  const [description, setDescription] = React.useState(enterprises[0]?.description ?? "");
  const [tagline, setTagline] = React.useState(enterprises[0]?.tagline ?? "");
  const [sector, setSector] = React.useState(enterprises[0]?.sector ?? "food");
  const [tier, setTier] = React.useState(enterprises[0]?.tier ?? "A");
  const [goal, setGoal] = React.useState(enterprises[0]?.fundraisingGoalEgp ?? "500000");
  const [price, setPrice] = React.useState(enterprises[0]?.equityUnitPriceEgp ?? "50");
  const [advantage, setAdvantage] = React.useState("");
  const [market, setMarket] = React.useState("");
  const [team, setTeam] = React.useState("");
  const [milestones, setMilestones] = React.useState("");
  const [useOfFunds, setUseOfFunds] = React.useState("");

  const onEntChange = (id: string) => {
    const ent = enterprises.find((e) => e.id === id);
    if (!ent) return;
    setSelectedEntId(id);
    setName(ent.name);
    setDescription(ent.description);
    setTagline(ent.tagline ?? "");
    setSector(ent.sector);
    setTier(ent.tier);
    setGoal(ent.fundraisingGoalEgp);
    setPrice(ent.equityUnitPriceEgp);
  };

  const generate = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Missing fields", { description: "Enterprise name and description are required." });
      return;
    }
    setLoading(true);
    setSlides(null);
    try {
      const res = await fetch("/api/ai/pitch-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEntId || undefined,
          name,
          tagline: tagline || undefined,
          description,
          sector,
          tier,
          fundraisingGoalEgp: Number(goal),
          equityUnitPriceEgp: Number(price),
          competitiveAdvantage: advantage || undefined,
          targetMarket: market || undefined,
          teamDescription: team || undefined,
          milestones: milestones || undefined,
          useOfFunds: useOfFunds || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? "Generation failed");
      }
      setSlides(data.slides);
      setCurrentSlide(0);
      toast.success("Pitch deck generated", {
        description: `${data.slides.length} slides ready. ${data.fellBack ? "(used fallback — AI was unavailable)" : "Powered by Constitutional AI."}`,
      });
    } catch (e) {
      toast.error("Generation failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const copySlide = (slide: Slide) => {
    const text = `Slide ${slide.number}: ${slide.title}\n\n${slide.content}\n\n${slide.bullets.map((b) => `• ${b}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Slide copied", { description: `Slide ${slide.number} copied to clipboard.` });
  };

  const downloadDeck = () => {
    if (!slides) return;
    const text = slides.map((s) =>
      `=== SLIDE ${s.number}: ${s.title} ===\n\n${s.content}\n\n${s.bullets.map((b) => `• ${b}`).join("\n")}\n`
    ).join("\n\n");
    const blob = new Blob([`AURIENTA Pitch Deck — ${name}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}-pitch-deck.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input form */}
      <div className="rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Presentation className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Enterprise details</h2>
        </div>

        {enterprises.length > 0 && (
          <div className="mb-4">
            <Label className="font-sans text-xs text-muted-foreground">Load from existing enterprise</Label>
            <Select value={selectedEntId} onValueChange={onEntChange}>
              <SelectTrigger className="mt-1 border-gold/15 bg-background/60">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} · Tier {e.tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Enterprise name *</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gold/15 bg-background/60 px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Tagline</Label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gold/15 bg-background/60 px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Sector</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger className="mt-1 border-gold/15 bg-background/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["food", "manufacturing", "tourism", "technology", "retail", "logistics", "agriculture"].map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="mt-1 border-gold/15 bg-background/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D", "E", "F"].map((t) => (
                  <SelectItem key={t} value={t}>Tier {t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Capital Formation goal (EGP)</Label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gold/15 bg-background/60 px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <Label className="font-sans text-xs text-muted-foreground">Share price (EGP)</Label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gold/15 bg-background/60 px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold/40"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="font-sans text-xs text-muted-foreground">Description *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-[80px] border-gold/15 bg-background/60 font-sans text-sm"
          />
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer font-sans text-xs text-gold-light">+ Additional context (optional, improves deck quality)</summary>
          <div className="mt-3 grid gap-3">
            <div>
              <Label className="font-sans text-xs text-muted-foreground">Competitive advantage</Label>
              <Textarea value={advantage} onChange={(e) => setAdvantage(e.target.value)} className="mt-1 min-h-[60px] border-gold/15 bg-background/60 font-sans text-sm" />
            </div>
            <div>
              <Label className="font-sans text-xs text-muted-foreground">Target market</Label>
              <Textarea value={market} onChange={(e) => setMarket(e.target.value)} className="mt-1 min-h-[60px] border-gold/15 bg-background/60 font-sans text-sm" />
            </div>
            <div>
              <Label className="font-sans text-xs text-muted-foreground">Team description</Label>
              <Textarea value={team} onChange={(e) => setTeam(e.target.value)} className="mt-1 min-h-[60px] border-gold/15 bg-background/60 font-sans text-sm" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="font-sans text-xs text-muted-foreground">Milestones</Label>
                <Textarea value={milestones} onChange={(e) => setMilestones(e.target.value)} className="mt-1 min-h-[60px] border-gold/15 bg-background/60 font-sans text-sm" />
              </div>
              <div>
                <Label className="font-sans text-xs text-muted-foreground">Use of funds</Label>
                <Textarea value={useOfFunds} onChange={(e) => setUseOfFunds(e.target.value)} className="mt-1 min-h-[60px] border-gold/15 bg-background/60 font-sans text-sm" />
              </div>
            </div>
          </div>
        </details>

        <Button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-5 h-11 bg-gold-gradient px-6 text-sm font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.65)]"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating 10 slides…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate pitch deck</>
          )}
        </Button>
      </div>

      {/* Generated deck */}
      <AnimatePresence>
        {slides && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Presentation className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-lg font-semibold">{name} — Pitch Deck</h2>
                <Badge variant="outline" className="border-gold/25 bg-gold/5 font-mono text-[11px] text-gold-light">
                  {slides.length} slides
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={downloadFullscreen} className="h-8 text-xs">
                  <Presentation className="h-3.5 w-3.5" /> Present
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadDeck} className="h-8 text-xs">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>

            {/* Slide carousel */}
            <div className="relative">
              <div className="min-h-[320px] rounded-xl border border-gold/12 bg-[#08080a] p-6">
                <SlideView slide={slides[currentSlide]} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))}
                  disabled={currentSlide === 0}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  {currentSlide + 1} / {slides.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentSlide((i) => Math.min(slides.length - 1, i + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="h-8"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Slide thumbnails */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                    i === currentSlide
                      ? "border-gold/40 bg-gold/10"
                      : "border-gold/10 bg-background/40 hover:border-gold/25"
                  }`}
                >
                  <p className="font-mono text-xs text-gold-light">{s.number}</p>
                  <p className="font-sans text-[11px] font-medium text-foreground line-clamp-1">{s.title}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => copySlide(slides[currentSlide])} className="h-8 text-xs">
                <Copy className="h-3.5 w-3.5" /> Copy slide
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen presentation mode */}
      <AnimatePresence>
        {fullscreen && slides && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 p-8 flex flex-col"
          >
            <button onClick={() => setFullscreen(false)} className="absolute right-4 top-4 text-white/60 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-4xl w-full">
                <SlideView slide={slides[currentSlide]} large />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))} disabled={currentSlide === 0} className="text-white">
                <ChevronLeft className="h-5 w-5" /> Prev
              </Button>
              <span className="font-mono text-sm text-white/60">{currentSlide + 1} / {slides.length}</span>
              <Button size="sm" variant="ghost" onClick={() => setCurrentSlide((i) => Math.min(slides.length - 1, i + 1))} disabled={currentSlide === slides.length - 1} className="text-white">
                Next <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function downloadFullscreen() {
    setFullscreen(true);
  }
}

function SlideView({ slide, large }: { slide: Slide; large?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className={`font-mono ${large ? "text-sm" : "text-[11px]"} text-gold-light`}>
          {String(slide.number).padStart(2, "0")}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
      </div>
      <h3 className={`font-serif ${large ? "text-4xl" : "text-2xl"} font-semibold leading-tight text-gold-gradient`}>
        {slide.title}
      </h3>
      <p className={`font-sans ${large ? "text-lg" : "text-sm"} leading-relaxed text-foreground/90`}>
        {slide.content}
      </p>
      <ul className="flex flex-col gap-2">
        {slide.bullets.map((b, i) => (
          <li key={i} className={`flex items-start gap-2 font-sans ${large ? "text-base" : "text-xs"} text-muted-foreground`}>
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

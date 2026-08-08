"use client";

import * as React from "react";
import {
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Channel = "whatsapp" | "twitter" | "facebook" | "linkedin" | "telegram" | "email";

type Props = {
  enterpriseId: string;
  enterpriseSlug: string;
  enterpriseName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
};

const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "#1DA1F2" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "telegram", label: "Telegram", icon: Share2, color: "#0088cc" },
  { id: "email", label: "Email", icon: Mail, color: "#d4af37" },
];

/**
 * ShareButton — opens a dialog with social-share channel icons. On open,
 * calls the Brain AI `/api/ai/share-message` endpoint to generate a
 * personalized share message based on the enterprise's current capital formation
 * state. Clicking a channel opens that platform's share URL with the
 * AI-generated message pre-filled.
 *
 * The enterprise profile URL is `${window.location.origin}/enterprise/${slug}`.
 */
export function ShareButton({
  enterpriseId,
  enterpriseSlug,
  enterpriseName,
  variant = "outline",
  size = "sm",
  className,
  label = "Share",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/enterprise/${enterpriseSlug}`
    : `/enterprise/${enterpriseSlug}`;

  const generateMessage = React.useCallback(async () => {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/ai/share-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to generate share message");
      }
      const data = await res.json();
      setMessage(data.message ?? `Join me as a Constitutional Partner in ${enterpriseName} on AURIENTA.`);
    } catch (e) {
      // Fallback message if the Brain AI is unavailable.
      setMessage(
        `${enterpriseName} is raising capital on AURIENTA — noncustodial constitutional infrastructure for real-economy ownership. See ${profileUrl}`
      );
      toast.error("Brain AI unavailable — using a fallback share message.");
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, enterpriseName, profileUrl]);

  React.useEffect(() => {
    if (open && !message) {
      generateMessage();
    }
  }, [open, message, generateMessage]);

  const fullMessage = `${message}\n\n${profileUrl}`;
  const encodedMessage = encodeURIComponent(fullMessage);
  const encodedUrl = encodeURIComponent(profileUrl);

  const shareUrls: Record<Channel, string> = {
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(message)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(message)}`,
    email: `mailto:?subject=${encodeURIComponent(`Constitutional Partnership — ${enterpriseName}`)}&body=${encodedMessage}`,
  };

  const handleChannel = (channel: Channel) => {
    const url = shareUrls[channel];
    if (channel === "email") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      toast.success("Share message copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — clipboard permission denied.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "border-gold/25 text-foreground hover:border-gold/40 hover:bg-gold/[0.04]",
            className
          )}
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5 text-gold" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gold/20 bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Share2 className="h-4 w-4 text-gold" />
            Share {enterpriseName}
          </DialogTitle>
          <DialogDescription className="font-sans text-xs">
            The Brain AI composes a constitutional share message from the enterprise&apos;s live
            capital formation state. Pick a channel to spread the word.
          </DialogDescription>
        </DialogHeader>

        {/* AI-generated message preview */}
        <div className="mt-2 rounded-xl border border-gold/15 bg-gold/[0.03] p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-light/80">
              Brain AI share message
            </span>
            <button
              onClick={generateMessage}
              disabled={loading}
              className="inline-flex items-center gap-1 font-sans text-[11px] text-muted-foreground transition-colors hover:text-gold"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Share2 className="h-3 w-3" />
              )}
              Regenerate
            </button>
          </div>
          <p className="min-h-[3.5rem] font-sans text-xs leading-relaxed text-foreground/90">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-gold" />
                Brain AI composing…
              </span>
            ) : (
              message
            )}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-gold hover:text-gold-light"
            >
              <ExternalLink className="h-3 w-3" />
              {profileUrl.replace(/^https?:\/\//, "").slice(0, 48)}
              {profileUrl.length > 48 ? "…" : ""}
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-background/40 px-2 py-1 font-sans text-[11px] text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Channel grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannel(ch.id)}
                disabled={loading}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-xl border border-gold/12 bg-background/40 px-2 py-3 transition-all",
                  "hover:border-gold/30 hover:bg-gold/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                )}
                aria-label={`Share to ${ch.label}`}
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/15 transition-colors group-hover:border-gold/40"
                  style={{ backgroundColor: `${ch.color}14` }}
                >
                  <Icon className="h-4 w-4" style={{ color: ch.color }} />
                </span>
                <span className="font-sans text-[10px] text-muted-foreground group-hover:text-foreground">
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-center font-sans text-[10px] text-muted-foreground/75">
          AURIENTA never holds partner funds · Zero Custody · Law Firm Client Account
        </p>
      </DialogContent>
    </Dialog>
  );
}

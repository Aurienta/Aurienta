"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Plus,
  FileText,
  Scale,
} from "lucide-react";
import { egp, pct } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "payroll", label: "Payroll" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "supplies", label: "Supplies" },
  { value: "legal", label: "Legal & Compliance" },
  { value: "logistics", label: "Logistics" },
  { value: "r_and_d", label: "Research & Development" },
  { value: "other", label: "Other" },
];

type Preview =
  | { kind: "empty" }
  | {
      kind: "real";
      amount: number;
      pct: number;
      tier: "<1%" | "1–10%" | ">10%";
      status: string;
      allowed: boolean;
      label: string;
      description: string;
    };

function previewVerdict(amount: number, capital: number, roles: string[]): Preview {
  if (!Number.isFinite(amount) || amount <= 0) return { kind: "empty" };
  const p = capital > 0 ? (amount / capital) * 100 : 0;
  if (p < 1) {
    return {
      kind: "real",
      amount,
      pct: p,
      tier: "<1%",
      status: "approved",
      allowed: roles.some((r) => r === "manager" || r === "founding_operator"),
      label: "Manager-only · auto-approved",
      description: "Below 1% of capital. Your manager signature finalises the expense on submit.",
    };
  }
  if (p <= 10) {
    return {
      kind: "real",
      amount,
      pct: p,
      tier: "1–10%",
      status: "dual_signature_pending",
      allowed: roles.some((r) =>
        ["manager", "accounting_firm_rep", "board_member"].includes(r)
      ),
      label: "Dual signature required",
      description: "1–10% of capital. Manager + accounting firm dual signature, per Art. 118.",
    };
  }
  return {
    kind: "real",
    amount,
    pct: p,
    tier: ">10%",
    status: "pending",
    allowed: roles.some((r) => r === "board_member"),
    label: "Board approval required",
    description: "Above 10% of capital. A board vote must pass before the treasury releases funds.",
  };
}

export function SubmitExpenseDialog({
  enterpriseId,
  capital,
  roles,
}: {
  enterpriseId: string;
  capital: number;
  roles: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<string>("supplies");
  const [description, setDescription] = React.useState("");
  const [vendor, setVendor] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [receiptNote, setReceiptNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();

  const amountNum = Number(amount);
  const preview = previewVerdict(amountNum, capital, roles);

  function reset() {
    setCategory("supplies");
    setDescription("");
    setVendor("");
    setAmount("");
    setReceiptNote("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !vendor.trim() || !amount) {
      toast.error("Please complete description, vendor, and amount.");
      return;
    }
    if (preview.kind === "real" && !preview.allowed) {
      toast.error("CRE preview denies this submission — the policy verdict is shown below.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          category,
          description: description.trim(),
          vendor: vendor.trim(),
          amountEgp: amountNum,
          receiptNote: receiptNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "CRE denied the submission.", {
          description: json.policy ? `Policy: ${json.policy}` : undefined,
        });
        return;
      }
      const status = json.expense?.status;
      const msg =
        status === "approved"
          ? "Expense auto-approved (<1% of capital) and ledgered."
          : status === "dual_signature_pending"
          ? "Expense submitted — dual signature required."
          : "Expense submitted — awaiting board approval.";
      toast.success(msg, {
        description: `CRE token ${json.expense ? "sealed" : "issued"}.`,
      });
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Network error submitting expense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-10 bg-gold-gradient text-black hover:opacity-95">
          <Plus className="h-4 w-4" /> Submit expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border-gold/20 bg-popover sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Submit constitutional expense</DialogTitle>
          <DialogDescription>
            CRE authority is enforced against {egp(capital, { compact: capital >= 1_000_000 })} of
            enterprise capital. The verdict below previews what the runtime engine will allow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="cat">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Vendor / beneficiary" htmlFor="vendor">
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Cairo Fresh Wholesale"
                autoComplete="off"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="desc">
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              rows={2}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (EGP)" htmlFor="amt">
              <Input
                id="amt"
                type="number"
                inputMode="decimal"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoComplete="off"
              />
            </Field>
            <Field label="Receipt note (optional)" htmlFor="rcpt">
              <Input
                id="rcpt"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="Receipt # / invoice ref"
                autoComplete="off"
              />
            </Field>
          </div>

          {/* CRE verdict preview */}
          <CrePreview preview={preview} capital={capital} />

          <DialogFooter className="mt-1 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (preview.kind === "real" && !preview.allowed)}
              className="h-10 bg-gold-gradient text-black hover:opacity-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Submit to CRE
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="font-sans text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function CrePreview({
  preview,
  capital,
}: {
  preview: Preview;
  capital: number;
}) {
  if (preview.kind === "empty") {
    return (
      <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scale className="h-3.5 w-3.5" />
          <span className="font-sans text-[11px] uppercase tracking-wider">
            CRE verdict
          </span>
        </div>
        <p className="mt-1 font-sans text-xs text-muted-foreground">
          Enter an amount to see the constitutional authority check.
        </p>
      </div>
    );
  }

  const tone = preview.allowed ? "ok" : "deny";
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "ok"
          ? "border-emerald-400/25 bg-emerald-400/[0.05]"
          : "border-red-400/30 bg-red-400/[0.05]"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tone === "ok" ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-red-400" />
          )}
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-foreground">
            {preview.label}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-xs",
            tone === "ok"
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-red-400/15 text-red-300"
          )}
        >
          {preview.tier} of capital
        </span>
      </div>
      <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
        {preview.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gold/8 pt-3 font-mono text-xs">
        <span className="text-muted-foreground">
          Amount:{" "}
          <span className="text-foreground">
            {egp(preview.amount, { compact: preview.amount >= 1_000_000 })}
          </span>
        </span>
        <span className="text-muted-foreground">
          Capital:{" "}
          <span className="text-foreground">
            {egp(capital, { compact: capital >= 1_000_000 })}
          </span>
        </span>
        <span className="text-muted-foreground">
          Share: <span className="text-foreground">{pct(preview.pct, 3)}</span>
        </span>
        <span className="text-muted-foreground">
          Status:{" "}
          <span className="text-foreground">
            {preview.status.replace(/_/g, " ")}
          </span>
        </span>
      </div>
    </div>
  );
}

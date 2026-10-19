"use client";

import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * UX-AUDIT-3 — Shared dashboard error boundary.
 *
 * Replaces the duplicated `error.tsx` boilerplate that previously lived in
 * 5 dashboard folders (workforce, graduation, founder, manager, governance).
 *
 * Theme:
 *  - Uses `text-gold` (indigo brand token — NOT amber/yellow).
 *  - Cards / borders all draw from the indigo `gold/*` token family.
 *
 * Accessibility:
 *  - Wrapper carries `role="alert"` so screen-readers announce the error.
 *  - Buttons carry `aria-label` for explicit labeling.
 *  - The decorative AlertTriangle is `aria-hidden`.
 */
export function PageError({
  error,
  reset,
  label = "This page",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  label?: string;
}) {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <Card className="max-w-md border-gold/20 bg-background/80">
        <CardContent className="p-8 text-center">
          <AlertTriangle
            className="mx-auto mb-4 h-10 w-10 text-gold"
            aria-hidden
          />
          <h2 className="mb-2 font-serif text-lg text-foreground">
            Something went wrong
          </h2>
          <p className="mb-1 text-sm text-muted-foreground">
            {label} encountered an error.
          </p>
          {error.digest ? (
            <p className="mb-6 font-mono text-xs text-muted-foreground/70">
              Error ID: {error.digest}
            </p>
          ) : (
            <p className="mb-6" />
          )}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={reset}
              className="border-gold/20"
              aria-label="Try again — reload this page"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
            <Button
              asChild
              className="bg-gold text-white hover:bg-gold/90"
              aria-label="Return to dashboard overview"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

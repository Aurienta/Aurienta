"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — premium loading placeholder with gold shimmer sweep.
 * Use in place of content during async fetches for perceived performance.
 *
 * <Skeleton className="h-4 w-32" />            // line
 * <Skeleton className="h-12 w-full rounded-xl" /> // card
 * <SkeletonCircle className="h-10 w-10" />    // avatar
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

export function SkeletonCircle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-full", className)}
      {...props}
    />
  );
}

/**
 * SkeletonCard — a full card-shaped skeleton with a header row, title bar,
 * and 3 content lines. Drop in anywhere a dashboard card is loading.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/60 p-5", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <SkeletonCircle className="h-8 w-8" />
      </div>
      <Skeleton className="mt-4 h-8 w-24" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * SkeletonTable — a 5-row table-shaped skeleton for dashboard lists.
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="flex gap-4 border-b border-border/60 bg-muted/30 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border/40 p-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

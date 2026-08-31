"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * PageTransition — thin framer-motion wrapper that fades + translates its
 * children on mount. Respects `prefers-reduced-motion` (renders a plain div
 * with no animation when the user has reduced motion enabled).
 *
 * Used by the most-visited dashboard pages to give a subtle, premium
 * page-enter effect (300ms fade + 6px translate-y, calm institutional ease).
 *
 * Safe to render from a server component — this file is the only client
 * boundary, so the 4 dashboard pages can stay async server components.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // calm institutional ease-out
      }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;

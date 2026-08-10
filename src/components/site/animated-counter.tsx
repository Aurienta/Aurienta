"use client";

import * as React from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * AnimatedCounter — counts up from 0 to `value` when scrolled into view.
 * Uses Framer Motion springs for smooth animation.
 * Respects `prefers-reduced-motion`.
 */
export function AnimatedCounter({
  value,
  duration = 2,
  format = true,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  format?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });

  React.useEffect(() => {
    if (inView && !reduce) {
      motionValue.set(value);
    } else if (reduce) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue, reduce]);

  React.useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        const displayValue = format ? Math.round(latest).toLocaleString("en-US") : Math.round(latest).toString();
        ref.current.textContent = `${prefix}${displayValue}${suffix}`;
      }
    });
  }, [spring, format, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}{format ? "0" : "0"}{suffix}
    </span>
  );
}

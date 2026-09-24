"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MagneticButton — a wrapper that makes any child element "magnetic":
 * the element subtly follows the cursor on hover, and a gold halo glow
 * tracks the cursor position. Use sparingly — only on the single primary
 * CTA of a surface (overuse kills the premium feel).
 *
 * Usage:
 *   <MagneticButton>
 *     <Link href="/register" className="...gold CTA styles...">Become a Partner</Link>
 *   </MagneticButton>
 *
 * Or as a styled button directly (renders a <button>):
 *   <MagneticButton onClick={...} className="gold CTA styles">Click me</MagneticButton>
 *
 * Honors prefers-reduced-motion (disables the magnetic effect, keeps the glow).
 */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  as: Comp = "button",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number; // 0 = none, 1 = follow cursor 1:1
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [hovered, setHovered] = React.useState(false);
  const reduce = usePrefersReducedMotion();

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * strength, y: y * strength });
    // Update CSS vars for the magnetic-glow halo position.
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--mx", `${mx}%`);
    ref.current.style.setProperty("--my", `${my}%`);
  };

  const handleEnter = () => {
    if (reduce) return;
    setHovered(true);
  };

  const handleLeave = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <Comp
      ref={ref as React.Ref<HTMLButtonElement>}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cn("magnetic-glow", className)}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: hovered
          ? "transform 60ms linear, box-shadow 260ms ease"
          : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease",
      }}
      {...props}
    >
      {children}
    </Comp>
  );
}

// Inline the hook to avoid a circular import if useReducedMotion isn't tree-shaken.
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = () => setReduce(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

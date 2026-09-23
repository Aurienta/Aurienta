"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * BackToTop — a floating gold "scroll to top" button that appears after
 * the user scrolls past 600px. Smooth-scrolls back. Honors reduced-motion.
 *
 * Renders a fixed-position button in the bottom-right corner with a high
 * z-index so it floats above dashboard content. Hidden on print.
 */
export function BackToTop() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollUp}
          aria-label="Back to top"
          title="Back to top"
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="magnetic-glow fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-background/80 backdrop-blur-md shadow-[0_8px_30px_-8px_rgba(212,175,55,0.5)] hover:border-gold/70 hover:bg-gold/10 print:hidden"
        >
          <ArrowUp className="h-5 w-5 text-gold" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

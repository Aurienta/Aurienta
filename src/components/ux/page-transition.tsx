"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * PageTransition — wraps page content with a smooth fade+rise transition
 * on route change. Drop into a layout's <main> around {children}.
 *
 * Uses `pathname` as the AnimatePresence key so each route re-mounts
 * with the entrance animation. Honors prefers-reduced-motion.
 *
 * Listens to history.pushState/replaceState patches + popstate so it works
 * with Next.js App Router client-side navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [pathname, setPathname] = React.useState("");

  React.useEffect(() => {
    setPathname(window.location.pathname);
    const onUpdate = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onUpdate);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function patchedPush(...args) {
      const r = origPush.apply(this, args);
      onUpdate();
      return r;
    } as typeof history.pushState;
    history.replaceState = function patchedReplace(...args) {
      const r = origReplace.apply(this, args);
      onUpdate();
      return r;
    } as typeof history.replaceState;
    return () => {
      window.removeEventListener("popstate", onUpdate);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

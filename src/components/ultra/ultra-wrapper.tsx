"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const UltraBackground = dynamic(
  () => import("./ultra-gpu").then((m) => m.UltraBackground),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.15), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(124,58,237,0.08), transparent 55%)"
      }} />
    )
  }
);

export function UltraBackgroundWrapper() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <UltraBackground />
    </div>
  );
}

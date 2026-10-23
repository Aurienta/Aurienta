"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const UltraBackground = dynamic(
  () => import("./ultra-gpu").then((m) => m.UltraBackground),
  { ssr: false }
);

export function UltraBackgroundWrapper() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-50">
      <UltraBackground />
    </div>
  );
}

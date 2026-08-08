"use client";

import * as React from "react";
import { SigninForm } from "@/components/auth/signin-form";
import { DemoUserPicker } from "@/components/auth/demo-user-picker";

type QuickSignInFn = (email: string, password?: string) => void;

/**
 * Client wrapper that lets the DemoUserPicker programmatically fill the
 * SigninForm (email + password `aurienta2026`) and submit. Keeps the
 * /signin page itself a server component (preserves `metadata` export).
 */
export function SigninClient() {
  const [quickSignIn, setQuickSignIn] =
    React.useState<QuickSignInFn | null>(null);

  // Memoise the setter so the form's useEffect doesn't re-run.
  const handleReady = React.useCallback((fn: QuickSignInFn) => {
    setQuickSignIn(() => fn);
  }, []);

  return (
    <div className="relative z-10 w-full">
      <SigninForm onReady={handleReady} />
      <DemoUserPicker quickSignIn={quickSignIn} />
    </div>
  );
}

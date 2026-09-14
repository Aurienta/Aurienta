"use client";

import { SigninForm } from "@/components/auth/signin-form";
import { DemoUserPicker } from "@/components/auth/demo-user-picker";

/**
 * Client wrapper for the signin page. Keeps the /signin page itself a
 * server component (preserves `metadata` export).
 *
 * The DemoUserPicker now uses NATIVE HTML FORMS (no JavaScript needed)
 * so there's no quickSignIn prop to pass. The SigninForm still uses
 * JavaScript for the manual email/password form.
 */
export function SigninClient() {
  return (
    <div className="relative z-10 w-full">
      <SigninForm />
      <DemoUserPicker />
    </div>
  );
}

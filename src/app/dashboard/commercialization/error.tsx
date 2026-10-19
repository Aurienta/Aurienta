"use client";
import { PageError } from "@/components/dashboard/ux/page-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} label="Commercialization" />;
}

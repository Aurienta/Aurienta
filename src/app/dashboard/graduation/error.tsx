"use client";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md border-gold/20 bg-background/80">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="mb-2 font-serif text-lg text-foreground">Something went wrong</h2>
          <p className="mb-1 text-sm text-muted-foreground">This page encountered an error.</p>
          {error.digest && (
            <p className="mb-6 text-xs text-muted-foreground/70">Error ID: {error.digest}</p>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={reset} className="border-gold/20">
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
            <Button asChild className="bg-gold text-black hover:bg-gold/90">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

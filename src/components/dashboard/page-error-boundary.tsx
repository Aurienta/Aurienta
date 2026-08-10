"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; systemName?: string },
  { hasError: boolean; errorId?: string }
> {
  constructor(props: { children: React.ReactNode; systemName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorId: `err_${Date.now().toString(36)}` };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[PageErrorBoundary]", this.props.systemName, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md border-gold/20 bg-background/80">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
              <h2 className="mb-2 font-serif text-lg text-foreground">
                Something went wrong
              </h2>
              <p className="mb-1 text-sm text-muted-foreground">
                {this.props.systemName
                  ? `The ${this.props.systemName} encountered an error.`
                  : "This page encountered an error."}
              </p>
              <p className="mb-6 text-xs text-muted-foreground/70">
                Error ID: {this.state.errorId}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false })}
                  className="border-gold/20"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button asChild className="bg-gold text-black hover:bg-gold/90">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * ERROR BOUNDARY
 * --------------
 * The whole UI is rendered on the client (AppShell shows it only after an
 * effect marks the auth state as checked), so an uncaught render or hydration
 * error used to leave the user with a blank white page and nothing to report.
 * This boundary shows the real message (plus the server `digest`, which is what
 * the dev/production logs are keyed on) and logs the full error together with
 * the component stack.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo?.componentStack);
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-2/3 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </span>

          <h1 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This page could not be rendered. The full error is in the browser
            console - reload to try again.
          </p>

          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-left text-xs whitespace-pre-wrap text-muted-foreground">
            {error?.message || String(error)}
            {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>

          <Button
            type="button"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

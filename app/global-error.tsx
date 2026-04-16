"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error with detailed information
    console.error("Global error caught:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      // Try to extract additional properties
      ...Object.fromEntries(
        Object.entries(error).filter(
          ([key]) => !["name", "message", "stack", "digest"].includes(key)
        )
      ),
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col bg-[#0c0c1d] text-white">
          <div className="flex-center min-h-[100vh]">
            <div className="flex max-w-md flex-col items-center rounded-lg border border-red-500/30 bg-red-950/10 p-8 text-center">
              <h2 className="mb-4 text-2xl font-bold text-red-400">Something went wrong!</h2>
              <p className="mb-6 text-muted">
                We encountered an unexpected error. Our team has been notified.
              </p>
              <div className="mb-6 w-full rounded bg-red-950/30 p-4 text-left">
                <p className="break-words font-mono text-sm text-red-300">
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p className="mt-2 font-mono text-xs text-red-300">Error ID: {error.digest}</p>
                )}
              </div>
              <Button onClick={reset} className="gradient-brand-button text-white">
                Try again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

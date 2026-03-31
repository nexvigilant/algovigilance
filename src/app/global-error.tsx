"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">
              The error has been reported automatically.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";

const log = logger.scope("terminal-error");

interface TerminalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TerminalError({ error, reset }: TerminalErrorProps) {
  useEffect(() => {
    log.error("Terminal page error", error);
    reportError(error, {
      component: "TerminalError",
      route: "/nucleus/terminal",
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0f1a]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full border border-red-500/30 bg-red-500/10 p-3">
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Terminal Error</h2>
          <p className="mt-1 text-sm text-slate-400">
            {error.message || "An unexpected error occurred in the terminal."}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-slate-600">
              {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="rounded border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

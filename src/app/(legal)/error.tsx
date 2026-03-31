"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("(legal)/error");

export default function LegalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Legal page error:", error);
    reportError(error, {
      component: "LegalError",
      route: "/(legal)",
      digest: error.digest,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="generic" />;
}

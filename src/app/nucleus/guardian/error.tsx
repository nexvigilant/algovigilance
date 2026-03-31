"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("nucleus/guardian/error");

export default function GuardianError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Guardian error:", error);
    reportError(error, {
      component: "GuardianError",
      route: "/nucleus/guardian",
      digest: error.digest,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

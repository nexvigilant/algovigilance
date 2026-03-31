"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("error");

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Application error:", error);
    reportError(error, {
      component: "RootError",
      route: "/",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "RootError",
      route: "/",
      message: error.message,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="generic" />;
}

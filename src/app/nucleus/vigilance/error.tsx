"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("nucleus/vigilance/error");

export default function VigilanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Vigilance error:", error);
    reportError(error, {
      component: "VigilanceError",
      route: "/nucleus/vigilance",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "VigilanceError",
      route: "/nucleus/vigilance",
      message: error.message,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

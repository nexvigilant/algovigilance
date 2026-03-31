"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("nucleus/error");

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Dashboard error:", error);
    reportError(error, {
      component: "DashboardError",
      route: "/nucleus",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "DashboardError",
      route: "/nucleus",
      message: error.message,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

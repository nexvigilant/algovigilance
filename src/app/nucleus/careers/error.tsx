"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("careers/error");

export default function CareersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Careers error:", error);
    reportError(error, {
      component: "CareersError",
      route: "/nucleus/careers",
      digest: error.digest,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

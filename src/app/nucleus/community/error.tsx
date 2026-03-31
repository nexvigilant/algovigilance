"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("nucleus/community/error");

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Community error:", error);
    reportError(error, {
      component: "CommunityError",
      route: "/nucleus/community",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "CommunityError",
      route: "/nucleus/community",
      message: error.message,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("profile/error");

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Profile error:", error);
    reportError(error, {
      component: "ProfileError",
      route: "/nucleus/profile",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "ProfileError",
      route: "/nucleus/profile",
      message: error.message,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

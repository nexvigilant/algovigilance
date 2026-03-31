"use client";

import { useEffect } from "react";
import { VoiceError, type ErrorType } from "@/components/voice";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("academy/error");

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || "";
  if (message.includes("permission") || message.includes("denied")) {
    return "permission";
  }
  return "server";
}

export default function AcademyError({ error, reset }: ErrorProps) {
  useEffect(() => {
    log.error("[Academy Error Boundary]", error);
    reportError(error, {
      component: "AcademyError",
      route: "/nucleus/academy",
      digest: error.digest,
    });
    trackEvent("error_occurred", {
      component: "AcademyError",
      route: "/nucleus/academy",
      message: error.message,
    });
  }, [error]);

  const errorType = getErrorType(error);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <VoiceError
        type={errorType}
        error={error}
        onRetry={reset}
        variant="page"
        action={{
          label: "Back to Catalog",
          href: "/nucleus/academy",
        }}
      />
    </div>
  );
}

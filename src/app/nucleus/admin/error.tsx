"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("admin/error");

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Admin dashboard error:", error);
    reportError(error, {
      component: "AdminError",
      route: "/nucleus/admin",
      digest: error.digest,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

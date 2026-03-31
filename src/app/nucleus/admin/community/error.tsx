"use client";

import { useEffect } from "react";
import { VoiceErrorBoundary } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("admin/community/error");

export default function AdminCommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Admin community error:", error);
    reportError(error, {
      component: "AdminCommunityError",
      route: "/nucleus/admin/community",
      digest: error.digest,
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="server" />;
}

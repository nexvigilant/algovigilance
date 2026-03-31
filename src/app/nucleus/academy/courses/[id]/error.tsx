"use client";

import { useEffect } from "react";
import { VoiceError, type ErrorType } from "@/components/voice";

import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";
const log = logger.scope("[id]/error");

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || "";
  if (message.includes("not found") || message.includes("does not exist")) {
    return "course-not-found";
  }
  if (message.includes("permission") || message.includes("denied")) {
    return "permission";
  }
  return "server";
}

export default function CourseDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    log.error("[Course Detail Error]", error);
    reportError(error, {
      component: "CourseDetailError",
      route: "/nucleus/academy/courses/[id]",
      digest: error.digest,
    });
  }, [error]);

  const errorType = getErrorType(error);
  const isCourseNotFound = errorType === "course-not-found";

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <VoiceError
        type={errorType}
        error={error}
        onRetry={isCourseNotFound ? undefined : reset}
        variant="page"
        action={{
          label: "Browse Pathways",
          href: "/nucleus/academy/pathways",
        }}
      />
    </div>
  );
}

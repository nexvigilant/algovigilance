// 'use client' required — Next.js error boundaries must be client components
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COMMUNITY_ROUTES } from "@/lib/routes";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporting";

const log = logger.scope("community/settings/profile");

export default function ProfileSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Profile settings error boundary caught:", error);
    reportError(error, {
      component: "ProfileSettingsError",
      route: "/nucleus/community/settings/profile",
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">
        Something went wrong loading profile settings.
      </h2>
      <p className="text-muted-foreground">
        Please try again or return to the community hub.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Button asChild variant="outline">
          <Link href={COMMUNITY_ROUTES.ROOT}>Back to Community</Link>
        </Button>
      </div>
    </div>
  );
}

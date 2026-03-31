"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { logger } from "@/lib/logger";
const log = logger.scope("auth/signin");

function SignInContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (!user || redirecting || syncFailed) return;

    // Loop detection: if we've already tried syncing this session and
    // landed back here, the cookie sync is failing. Show the form instead
    // of looping forever. sessionStorage survives 307 redirects (same tab).
    const syncKey = "nucleus_auth_sync_attempted";
    const attemptCount = parseInt(sessionStorage.getItem(syncKey) || "0", 10);
    if (attemptCount >= 1) {
      log.warn(
        "[signin] Cookie sync failed (attempts: %d) — showing sign-in form",
        attemptCount,
      );
      sessionStorage.removeItem(syncKey);
      setSyncFailed(true);
      return;
    }

    setRedirecting(true);
    sessionStorage.setItem(syncKey, String(attemptCount + 1));

    // The onIdTokenChanged handler in use-auth.tsx already POSTs to /api/auth/token
    // to set the cookie. If we ALSO POST here, the two concurrent requests race:
    // our POST can get aborted by page navigation, and router.push fires before
    // the cookie is actually set, causing a 307 redirect loop.
    //
    // Instead: POST once here (single owner), wait for confirmation, then navigate.
    // Disable the duplicate sync in use-auth by using a dedicated flag if needed.
    const syncAndRedirect = async () => {
      try {
        const token = await user.getIdToken(true);

        // POST token to set the httpOnly cookie — this is the ONLY place
        // that syncs before redirect. use-auth's onIdTokenChanged also syncs,
        // but that's for token refresh on protected pages, not initial login.
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          log.error("[signin] Token sync failed:", res.status);
          sessionStorage.removeItem(syncKey);
          setSyncFailed(true);
          setRedirecting(false);
          return;
        }

        // Cookie confirmed set. Clear loop detector and redirect.
        sessionStorage.removeItem(syncKey);
        const returnUrl = searchParams.get("returnUrl") || "/nucleus";
        // Use window.location for a full navigation to ensure the proxy
        // sees the freshly-set cookie. router.push/replace uses RSC which
        // can race with cookie propagation and get 307'd back here.
        window.location.href = returnUrl;
      } catch (err) {
        log.error("[signin] Token sync error:", err);
        sessionStorage.removeItem(syncKey);
        setSyncFailed(true);
        setRedirecting(false);
      }
    };

    syncAndRedirect();
  }, [user, redirecting, syncFailed, searchParams]);

  // Show loading only during initial auth check or active redirect
  if (loading || (redirecting && !syncFailed)) {
    return <AuthLoading />;
  }

  // Auth form — shown when:
  // - No cached user (fresh visit)
  // - Token sync failed (loop broken — user needs to re-authenticate)
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-8 pcb-grid overflow-hidden">
      <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        {syncFailed && (
          <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-sm text-yellow-200">
            Session expired. Please sign in again.
          </div>
        )}
        <AuthForm mode="signin" googleOnly={true} />
      </div>
    </div>
  );
}

// Suspense boundary required for useSearchParams() in Next.js 16
export default function SignInPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <SignInContent />
    </Suspense>
  );
}

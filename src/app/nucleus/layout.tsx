"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EmailVerificationBanner,
  TrialBanner,
} from "@/components/shared/banners";
import { NucleusHeader } from "@/components/layout/headers";
import { checkOnboardingStatus } from "@/lib/actions/users";
import { Toaster } from "@/components/ui/toaster";
import {
  useBehaviorTracker,
  BehaviorTrackerProvider,
} from "@/hooks/behavior-tracking";
import {
  EmeraldCityBackground,
  EmeraldCityPresets,
} from "@/components/effects/emerald-city-background";
import { SkipToContent } from "@/components/shared/accessibility/skip-to-content";

import { logger } from "@/lib/logger";
const log = logger.scope("nucleus/layout");

export default function NucleusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BehaviorTrackerProvider>
      <NucleusLayoutInner>{children}</NucleusLayoutInner>
    </BehaviorTrackerProvider>
  );
}

function NucleusLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    checked: boolean;
    complete: boolean;
    error?: boolean;
  }>({ checked: false, complete: false });

  // Behavior tracking for Nucleus-level navigation
  const { trackNavigation, startSession, endSession } = useBehaviorTracker();

  // Start session on mount
  useEffect(() => {
    startSession();
    return () => endSession();
  }, [startSession, endSession]);

  // Track navigation between pages
  useEffect(() => {
    if (pathname && pathname !== previousPathRef.current) {
      const pageName = pathname.split("/").pop() || "nucleus";
      trackNavigation(pathname, pageName);
      previousPathRef.current = pathname;
    }
  }, [pathname, trackNavigation]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  // Check onboarding status (only after auth is confirmed)
  useEffect(() => {
    // DEMO MODE BYPASS: Skip onboarding for demo presentations
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      log.debug("[DEMO MODE] Bypassing onboarding check");
      setOnboardingStatus({ checked: true, complete: true });
      return;
    }

    // DEVELOPMENT BYPASS: Skip onboarding check entirely in dev mode
    if (process.env.NODE_ENV === "development") {
      log.debug("⚠️ [DEV MODE] Bypassing onboarding check");
      setOnboardingStatus({ checked: true, complete: true });
      return;
    }

    // TESTING BYPASS: Skip onboarding check when env variable is set (requires rebuild)
    if (process.env.NEXT_PUBLIC_SKIP_ONBOARDING === "true") {
      log.debug("⚠️ [TESTING MODE] Bypassing onboarding check");
      setOnboardingStatus({ checked: true, complete: true });
      return;
    }

    // RUNTIME BYPASS: Check localStorage for bypass flag (can be set via browser console)
    // To enable: localStorage.setItem('nexvigilant_skip_onboarding', 'true')
    // To disable: localStorage.removeItem('nexvigilant_skip_onboarding')
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("nexvigilant_skip_onboarding") === "true"
    ) {
      log.debug(
        "⚠️ [RUNTIME BYPASS] Skipping onboarding via localStorage flag",
      );
      setOnboardingStatus({ checked: true, complete: true });
      return;
    }

    // TEST ACCOUNT BYPASS: Skip for test email patterns
    if (
      user?.email &&
      (user.email.includes("+test@") ||
        user.email.endsWith("@test.nexvigilant.com") ||
        user.email.includes("test.account"))
    ) {
      log.debug(
        "⚠️ [TEST ACCOUNT] Bypassing onboarding for test email:",
        user.email,
      );
      setOnboardingStatus({ checked: true, complete: true });
      return;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    const BASE_DELAY = 500;

    async function checkOnboarding() {
      if (!user) return;

      // Skip onboarding check if already on onboarding page
      if (pathname === "/nucleus/onboarding") {
        setOnboardingStatus({ checked: true, complete: true }); // Allow access
        return;
      }

      try {
        // Fetch onboarding status from Firestore
        const status = await checkOnboardingStatus(user.uid);

        if ("loading" in status && status.loading) {
          // Still loading profile - implement exponential backoff with max retries
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(
              BASE_DELAY * Math.pow(2, retryCount - 1),
              5000,
            );
            log.debug(
              `Profile still loading, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`,
            );
            timeoutId = setTimeout(() => checkOnboarding(), delay);
            return;
          } else {
            // Max retries reached — let them through rather than blocking
            log.warn(
              "Max retries reached checking onboarding, allowing access",
            );
            setOnboardingStatus({ checked: true, complete: true });
            return;
          }
        }

        setOnboardingStatus({ checked: true, complete: status.complete });

        // Redirect to onboarding if not complete
        if (!status.complete) {
          router.push("/nucleus/onboarding");
        }
      } catch (error) {
        log.error("Error checking onboarding status:", error);
        // On error, let the user through rather than blocking access.
        // Profile completion can be prompted later — don't gate the first visit.
        setOnboardingStatus({ checked: true, complete: true });
      }
    }

    if (user && !authLoading) {
      checkOnboarding();
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, authLoading, pathname, router]);

  // Error state: Show if onboarding check failed after max retries
  if (onboardingStatus.error) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        <EmeraldCityBackground {...EmeraldCityPresets.work} />
        <div className="relative z-10 flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-24 w-24 rounded-full border-4 border-cyan/20 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-400">
            Unable to Load Profile
          </h2>
          <p className="text-slate-dim">
            We&#39;re having trouble loading your profile. Please refresh the
            page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 touch-target bg-transparent border border-cyan text-cyan rounded-lg hover:bg-cyan/10 hover:shadow-glow-cyan transition-all focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-nex-deep"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state: Show while auth or onboarding status is being checked
  if (authLoading || !user || !onboardingStatus.checked) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-nex-deep">
        <EmeraldCityBackground {...EmeraldCityPresets.work} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-24 w-24 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
          <p className="text-slate-dim animate-pulse">
            {!user ? "Authenticating..." : "Loading profile..."}
          </p>
        </div>
      </div>
    );
  }

  // Select background preset - work preset for minimal distraction (no circuits)
  // Supports URL param override for testing: ?preset=nucleus, ?preset=marketing, etc.
  const getBackgroundPreset = () => {
    // URL param override for testing (dev convenience)
    const presetOverride = searchParams?.get("preset") as
      | keyof typeof EmeraldCityPresets
      | null;
    if (presetOverride && presetOverride in EmeraldCityPresets) {
      return EmeraldCityPresets[presetOverride];
    }

    // All nucleus routes use work preset (no circuits) for cleaner UX
    return EmeraldCityPresets.work;
  };

  // Authenticated and onboarding complete (or on onboarding page) - render normally
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-nex-deep">
      {/* Skip Navigation Link - WCAG 2.4.1 Bypass Blocks */}
      <SkipToContent />

      {/* Emerald City Background - route-aware preset selection */}
      <EmeraldCityBackground {...getBackgroundPreset()} />

      <EmailVerificationBanner />
      <TrialBanner />
      <NucleusHeader />
      <Toaster />
      <main id="main-content" className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

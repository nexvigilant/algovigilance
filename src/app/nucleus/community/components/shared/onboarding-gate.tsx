'use client';

/**
 * Onboarding Gate Component
 *
 * Checks if the current user has completed their onboarding journey.
 * If not, redirects them to the onboarding page.
 *
 * Smart handling for existing users:
 * - Only redirects NEW users (account < 7 days old) who haven't started onboarding
 * - Existing users without journey data are allowed through
 * - Users with incomplete journeys are encouraged (not forced) to continue
 *
 * Use this in layouts or pages to ensure users complete onboarding
 * before accessing certain community features.
 *
 * @example
 * // In a layout or page
 * <OnboardingGate>
 *   <CommunityContent />
 * </OnboardingGate>
 */

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { hasCompletedJourney } from '../../actions/user/journey';
import { Loader2 } from 'lucide-react';

import { logger } from '@/lib/logger';
const log = logger.scope('components/onboarding-gate');

interface OnboardingGateProps {
  children: React.ReactNode;
  /** Skip the gate for these paths (e.g., the onboarding page itself) */
  allowedPaths?: string[];
  /** Force redirect even for existing users (default: false) */
  strict?: boolean;
}

// Paths that should not require onboarding
const DEFAULT_ALLOWED_PATHS = [
  '/nucleus/community/onboarding',
  '/nucleus/community/discover/matches', // Allow browsing during onboarding step 3
];

// Consider users "new" if account is less than 7 days old
const NEW_USER_THRESHOLD_DAYS = 7;

export function OnboardingGate({
  children,
  allowedPaths = DEFAULT_ALLOWED_PATHS,
  strict = false,
}: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  // Skip gate for allowed paths
  const isAllowedPath = allowedPaths.some((path) =>
    pathname?.startsWith(path)
  );

  // Check if user is "new" based on account creation date
  const isNewUser = useCallback(() => {
    if (!user?.metadata?.creationTime) return true; // Assume new if no data
    const creationDate = new Date(user.metadata.creationTime);
    const daysSinceCreation = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < NEW_USER_THRESHOLD_DAYS;
  }, [user]);

  useEffect(() => {
    async function checkOnboarding() {
      // Always allow access to allowed paths
      if (isAllowedPath) {
        setShouldRender(true);
        setIsChecking(false);
        return;
      }

      // Wait for auth to load
      if (!user) {
        setShouldRender(true);
        setIsChecking(false);
        return;
      }

      try {
        const result = await hasCompletedJourney();

        // If onboarding is complete, allow access
        if (result.completed) {
          setShouldRender(true);
          setIsChecking(false);
          return;
        }

        // For incomplete onboarding:
        // - New users (strict mode or account < 7 days): redirect to onboarding
        // - Existing users (non-strict): allow access, show nudge later
        const shouldRedirect = strict || isNewUser();

        if (shouldRedirect && result.progressPercent !== undefined) {
          // Has started but not completed - always redirect to continue
          router.replace('/nucleus/community/onboarding');
        } else if (shouldRedirect) {
          // Never started - redirect new users only
          router.replace('/nucleus/community/onboarding');
        } else {
          // Existing user without onboarding - allow access
          setShouldRender(true);
        }
      } catch (error) {
        // On error, allow access (don't block users due to errors)
        log.error('Error checking onboarding status:', error);
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, [router, isAllowedPath, user, strict, isNewUser]);

  // Show loading while checking
  if (isChecking && !isAllowedPath) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </div>
    );
  }

  // Render children once check is complete
  return shouldRender ? <>{children}</> : null;
}

/**
 * Hook to check onboarding status
 *
 * Returns the current journey status without triggering redirect.
 */
export function useOnboardingStatus() {
  const [status, setStatus] = useState<{
    isLoading: boolean;
    completed: boolean;
    progressPercent: number;
    currentStep?: string;
  }>({
    isLoading: true,
    completed: false,
    progressPercent: 0,
  });

  useEffect(() => {
    async function check() {
      try {
        const result = await hasCompletedJourney();
        setStatus({
          isLoading: false,
          completed: result.completed,
          progressPercent: result.progressPercent ?? 0,
          currentStep: result.currentStep,
        });
      } catch {
        setStatus({
          isLoading: false,
          completed: false,
          progressPercent: 0,
        });
      }
    }
    check();
  }, []);

  return status;
}

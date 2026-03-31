'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { VoiceLoading } from '@/components/voice';
import { ErrorBoundary } from '@/components/layout/boundaries';
import { CommunityTracker } from './components/shared/community-tracker';
import { CommunitySidebar } from './components/navigation/community-sidebar';
import { OnboardingGate } from './components/shared/onboarding-gate';

interface CommunityLayoutClientProps {
  children: React.ReactNode;
}

/**
 * Community Layout Client Component
 *
 * Handles client-side logic for the community layout:
 * - Authentication verification and redirection
 * - Loading states
 * - Community features (Tracker, OnboardingGate, Sidebar)
 */
export function CommunityLayoutClient({ children }: CommunityLayoutClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users to signin
  useEffect(() => {
    // Only redirect if explicitly not loading and user is null
    if (!authLoading && user === null) {
      const redirectUrl = `/auth/signin?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [user, authLoading, router, pathname]);

  // Show loading state while verifying authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-deep">
        <VoiceLoading context="community" variant="fullpage" message="Verifying access..." />
      </div>
    );
  }

  // User not authenticated (redirection in progress)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-deep">
        <VoiceLoading context="community" variant="fullpage" message="Redirecting to login..." />
      </div>
    );
  }

  // User is authenticated - render community content with Error Boundary
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-nex-deep">
        <CommunityTracker>
          <OnboardingGate>
            {/* Horizontal Navigation Bar */}
            <CommunitySidebar />

            {/* Main Content Area - uses div to avoid nested main elements (parent has main#main-content) */}
            <div className="min-w-0 flex-1" role="region" aria-label="Community content">
              <div className="container mx-auto px-4 py-6 md:px-6">
                {/* Page Content - breadcrumbs handled by parent nucleus/layout.tsx */}
                {children}
              </div>
            </div>
          </OnboardingGate>
        </CommunityTracker>
      </div>
    </ErrorBoundary>
  );
}

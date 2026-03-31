'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { VoiceLoading } from '@/components/voice';

/**
 * AuthRedirect Component
 *
 * Redirects authenticated users to the nucleus.
 * Shows loading spinner while checking auth state.
 * Renders children for unauthenticated users.
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to nucleus
    if (!loading && user) {
      router.push('/nucleus');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <VoiceLoading context="profile" variant="fullpage" message="Checking authentication..." />
    );
  }

  // If authenticated, show nothing (redirect is happening)
  if (user) {
    return null;
  }

  // If not authenticated, show children (landing page)
  return <>{children}</>;
}

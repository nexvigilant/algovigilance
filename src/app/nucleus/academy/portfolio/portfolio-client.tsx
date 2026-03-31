'use client';

import { useAuth } from '@/hooks/use-auth';
import { PortfolioViewer } from '@/components/academy';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';

export function PortfolioPageClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return <VoiceLoading context="academy" variant="skeleton" message="Loading your portfolio" />;
  }

  if (!user) {
    return (
      <VoiceEmptyState
        title="Sign in required"
        description="Please sign in to view your portfolio"
        icon="LogIn"
      />
    );
  }

  return <PortfolioViewer userId={user.uid} />;
}

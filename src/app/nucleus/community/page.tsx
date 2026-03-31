'use client';

import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CommunityStatsGrid } from './components/community-stats-grid';
import { CommunityPathway } from './components/community-pathway';

export default function CommunityHubPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col" aria-busy="true" aria-label="Loading community content">
        {/* Header Skeleton */}
        <header className="mb-golden-4 text-center">
          <Skeleton className="h-3 w-48 mx-auto mb-golden-1" />
          <Skeleton className="h-10 w-56 mx-auto mb-golden-1" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </header>

        {/* Stats Skeleton */}
        <div className="mb-golden-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 max-w-3xl w-full mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>

        {/* Pathway Skeleton */}
        <div className="max-w-2xl mx-auto w-full space-y-golden-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-golden-2">
              <div className="flex items-center gap-golden-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="ml-6 pl-golden-3 border-l border-nex-light/10 space-y-golden-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero header with stagger animation */}
      <motion.header
        className="mb-golden-4 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <p className="intel-label mb-golden-1">
          AlgoVigilance Network
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-golden-1 text-white tracking-tight">
          Community
        </h1>
        <p className="text-golden-sm text-slate-dim/70 max-w-lg mx-auto leading-golden" style={{ textWrap: 'balance' }}>
          Join the AlgoVigilances — vigilant professionals who guard what matters most,
          share intelligence, and sharpen each other
        </p>
        {user?.displayName && (
          <motion.p
            className="mt-golden-2 text-xs font-mono uppercase tracking-widest text-cyan/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome, {user.displayName.split(' ')[0]}
          </motion.p>
        )}
      </motion.header>

      {/* Tier 1: Community stats grid — with entrance animation */}
      <motion.div
        className="mb-golden-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        <CommunityStatsGrid />
      </motion.div>

      {/* Tier 2: Storybook Journey Pathway */}
      <div className="pb-golden-4">
        <CommunityPathway />
      </div>
    </div>
  );
}

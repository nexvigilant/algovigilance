'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { EPACard } from './epa-card';
import { EPAFilters } from './epa-filters';
import { enrollInEPA, getAllUserEPAProgress } from '../../epa/actions';
import type {
  EPACatalogCard,
  EPACatalogFilters,
  EPATier,
  UserEPAProgress,
} from '@/types/epa-pathway';

interface PathwaysClientProps {
  initialEPAs: EPACatalogCard[];
}

export function PathwaysClient({ initialEPAs }: PathwaysClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState<EPACatalogFilters>({});
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | EPATier>('all');
  const [userProgress, setUserProgress] = useState<UserEPAProgress[]>([]);

  // Fetch user progress when authenticated
  useEffect(() => {
    async function fetchProgress() {
      if (user?.uid) {
        const progress = await getAllUserEPAProgress(user.uid);
        setUserProgress(progress);
      }
    }
    fetchProgress();
  }, [user?.uid]);

  // Merge user progress into EPAs
  const epasWithProgress: EPACatalogCard[] = useMemo(() => {
    return initialEPAs.map((epa) => {
      const progress = userProgress.find((p) => p.epaId === epa.id);
      return {
        ...epa,
        userProgress: progress
          ? {
              status: progress.status,
              currentLevel: progress.proficiencyProgress.currentLevel,
              progressPercent: progress.proficiencyProgress.progressPercent,
            }
          : undefined,
      };
    });
  }, [initialEPAs, userProgress]);

  // Filter EPAs based on current filters
  const filteredEPAs = useMemo(() => {
    let result = epasWithProgress;

    // Apply tab filter (tier)
    if (activeTab !== 'all') {
      result = result.filter((epa) => epa.tier === activeTab);
    }

    // Apply additional filters
    if (filters.tier) {
      result = result.filter((epa) => epa.tier === filters.tier);
    }
    if (filters.difficulty) {
      result = result.filter((epa) => epa.pathway.difficulty === filters.difficulty);
    }
    if (filters.minContentCoverage) {
      result = result.filter(
        (epa) => epa.contentCoverage >= (filters.minContentCoverage ?? 0)
      );
    }

    return result;
  }, [epasWithProgress, activeTab, filters]);

  // Group EPAs by tier for stats
  const tierStats = useMemo(() => {
    const stats: Record<EPATier | 'all', number> = {
      all: initialEPAs.length,
      Core: initialEPAs.filter((e) => e.tier === 'Core').length,
      Executive: initialEPAs.filter((e) => e.tier === 'Executive').length,
      Network: initialEPAs.filter((e) => e.tier === 'Network').length,
    };
    return stats;
  }, [initialEPAs]);

  const handleEnroll = useCallback(
    async (epaId: string) => {
      if (!user?.uid) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to enroll in pathways.',
          variant: 'destructive',
        });
        router.push('/auth/signin?redirect=/nucleus/academy/pathways');
        return;
      }

      setEnrollingId(epaId);
      try {
        const result = await enrollInEPA(user.uid, epaId, 'catalog');
        if (result.success) {
          toast({
            title: 'Enrollment Successful',
            description: 'You have been enrolled in this pathway.',
          });
          // Refresh progress
          const progress = await getAllUserEPAProgress(user.uid);
          setUserProgress(progress);
        } else {
          toast({
            title: 'Enrollment Failed',
            description: result.error || 'Unable to enroll. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (_error) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setEnrollingId(null);
      }
    },
    [user?.uid, router, toast]
  );

  return (
    <div>
      {/* Tier Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'all' | EPATier)}
        className="mb-6"
      >
        <TabsList className="bg-nex-surface border border-nex-border">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep"
          >
            All Pathways ({tierStats.all})
          </TabsTrigger>
          <TabsTrigger
            value="Core"
            className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep"
          >
            Core ({tierStats.Core})
          </TabsTrigger>
          <TabsTrigger
            value="Executive"
            className="data-[state=active]:bg-gold data-[state=active]:text-nex-deep"
          >
            Executive ({tierStats.Executive})
          </TabsTrigger>
          <TabsTrigger
            value="Network"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-nex-deep"
          >
            Network ({tierStats.Network})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <EPAFilters filters={filters} onFiltersChange={setFilters} />

      {/* EPA Grid */}
      {filteredEPAs.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-slate-dim">
            No pathways match your current filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEPAs.map((epa) => (
            <EPACard
              key={epa.id}
              epa={epa}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === epa.id}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-12 p-6 rounded-xl bg-nex-surface border border-nex-border">
        <h3 className="text-sm font-mono uppercase tracking-wider text-cyan/60 mb-4">
          Pathway Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-nex-deep/50">
            <div className="text-2xl font-mono text-gold">{tierStats.all}</div>
            <div className="text-xs text-slate-dim mt-1">Total Pathways</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-nex-deep/50">
            <div className="text-2xl font-mono text-cyan">
              {initialEPAs.reduce((sum, e) => sum + e.ksbStats.total, 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-dim mt-1">Total KSBs</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-nex-deep/50">
            <div className="text-2xl font-mono text-cyan">
              {Math.round(
                initialEPAs.reduce((sum, e) => sum + e.contentCoverage, 0) /
                  initialEPAs.length
              )}
              %
            </div>
            <div className="text-xs text-slate-dim mt-1">Avg Coverage</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-nex-deep/50">
            <div className="text-2xl font-mono text-emerald-400">
              {epasWithProgress.filter((e) => e.userProgress).length}
            </div>
            <div className="text-xs text-slate-dim mt-1">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}

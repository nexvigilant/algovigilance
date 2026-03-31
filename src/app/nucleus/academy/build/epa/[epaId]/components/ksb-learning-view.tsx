'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, Clock, Target, BookOpen, Lightbulb, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { KSBViewer } from '@/components/academy/ksb-viewer';
import { GlassBridge } from '@/components/academy/glass-bridge';
import type { EPAPathway, UserEPAProgress, KSBId } from '@/types/epa-pathway';
import type { CapabilityComponent, KSBProgress, PortfolioArtifact } from '@/types/pv-curriculum';

import { createPortfolioArtifact } from '@/app/nucleus/academy/portfolio/actions';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/epa/KSBLearningView');

interface KSBLearningViewProps {
  ksb: CapabilityComponent;
  epa: EPAPathway;
  userProgress: UserEPAProgress | null;
  onBack: () => void;
  onComplete: (ksbId: string, score?: number, activityType?: 'red_pen' | 'triage' | 'synthesis' | 'assessment') => Promise<void>;
}

const typeConfig: Record<string, {
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  knowledge: {
    icon: BookOpen,
    color: 'text-cyan',
    bgColor: 'bg-cyan/10',
    borderColor: 'border-cyan/30',
    label: 'Knowledge',
  },
  skill: {
    icon: Lightbulb,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/30',
    label: 'Skill',
  },
  behavior: {
    icon: Heart,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
    label: 'Behavior',
  },
  ai_integration: {
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    label: 'AI Integration',
  },
};

export function KSBLearningView({
  ksb,
  epa,
  userProgress,
  onBack,
  onComplete,
}: KSBLearningViewProps) {
  const { user } = useAuth();
  const [localProgress, setLocalProgress] = useState<Partial<KSBProgress>>({});

  const config = typeConfig[ksb.type] || typeConfig.knowledge;
  const TypeIcon = config.icon;
  const hasContent = Boolean(ksb.hook && ksb.concept && ksb.activity);
  const isCompleted = userProgress?.completedKSBs.includes(ksb.id as KSBId);

  const handleProgressUpdate = useCallback((progress: Partial<KSBProgress>) => {
    setLocalProgress((prev) => ({ ...prev, ...progress }));

    // If completed, trigger the onComplete callback
    if (progress.status === 'completed') {
      const score = progress.bestScore;
      const activityType = ksb.activity?.engineType as 'red_pen' | 'triage' | 'synthesis' | undefined;
      onComplete(ksb.id, score, activityType).catch((error) => {
        log.error('Error in onComplete:', error);
      });
    }
  }, [ksb.id, ksb.activity?.engineType, onComplete]);

  const handleArtifactCreate = useCallback(
    async (artifact: Omit<PortfolioArtifact, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await createPortfolioArtifact(artifact);
        if (result.success) {
          log.info('Portfolio artifact created:', result.id);
        } else {
          log.error('Failed to create portfolio artifact:', result.error);
        }
      } catch (error) {
        log.error('Error creating portfolio artifact:', error);
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-nex-deep">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-nex-surface border-b border-nex-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-dim hover:text-slate-light"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Level
            </Button>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn('font-mono text-xs', config.bgColor, config.color, config.borderColor)}
              >
                <TypeIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              {ksb.activityMetadata?.estimatedMinutes && (
                <Badge variant="outline" className="text-slate-dim">
                  <Clock className="h-3 w-3 mr-1" />
                  {ksb.activityMetadata.estimatedMinutes} min
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* KSB Title */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-cyan/60">{ksb.id}</span>
              <span className="text-slate-dim">|</span>
              <span className="font-mono text-xs text-slate-dim">
                {epa.shortName}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-light">
              {ksb.itemName}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {hasContent && user?.uid ? (
          <KSBViewer
            ksb={ksb}
            progress={localProgress as KSBProgress}
            onProgressUpdate={handleProgressUpdate}
            onArtifactCreate={handleArtifactCreate}
            userId={user.uid}
          />
        ) : (
          <div className="space-y-6">
            {!user?.uid ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-xl bg-nex-surface border border-nex-border flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-slate-dim" />
                </div>
                <h2 className="text-lg font-semibold text-slate-light mb-2">Sign In Required</h2>
                <p className="text-slate-dim max-w-md mx-auto">
                  Please sign in to access learning activities.
                </p>
                <Button onClick={onBack} variant="outline" className="mt-6">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Return to Level
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center py-8">
                  <p className="text-sm text-slate-dim mb-1">
                    Guided activity for this competency is coming soon.
                  </p>
                  <p className="text-xs font-mono text-cyan/50">{ksb.id}</p>
                </div>
                <GlassBridge domainId={ksb.domainId} />
                <div className="flex justify-center">
                  <Button onClick={onBack} variant="ghost" size="sm" className="text-slate-dim">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Return to Level
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

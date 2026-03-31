'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  Award,
  Eye,
  EyeOff,
  GitBranch,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { useCelebration } from '@/components/academy/celebration-effects';
import { cn } from '@/lib/utils';
import { LevelNavigation } from './level-navigation';
import { KSBListPanel } from './ksb-list-panel';
import { KSBLearningView } from './ksb-learning-view';
import { getUserEPAProgress, recordKSBCompletion } from '../../../../epa/actions';
import { getKSBsForEPA } from '../actions';
import { submitReview } from '@/lib/actions/fsrs';
import { Rating } from '@/lib/academy/fsrs/fsrs-types';
import type { EPAPathway, ProficiencyLevel, UserEPAProgress, KSBId } from '@/types/epa-pathway';
import type { CapabilityComponent } from '@/types/pv-curriculum';
import { PathwayDAG } from '@/components/academy/pathway-dag';
import { convertKSBsToDAG } from '@/lib/academy/ksb-to-dag';

import { EPA_LEVEL_LABELS, DEFAULT_ENTRUSTMENT_LEVELS } from '@/config/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/epa/EPALearnClient');

interface EPALearnClientProps {
  epa: EPAPathway;
}

export function EPALearnClient({ epa }: EPALearnClientProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRole();
  const { celebrateKSB, celebrateEPALevel, celebrateEPA } = useCelebration();
  const [userProgress, setUserProgress] = useState<UserEPAProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>('L1');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Safely access entrustment levels with fallback
  const entrustmentLevels = epa.entrustmentLevels || DEFAULT_ENTRUSTMENT_LEVELS;
  const [ksbsByLevel, setKsbsByLevel] = useState<Record<ProficiencyLevel, CapabilityComponent[]>>({
    L1: [],
    L2: [],
    L3: [],
    L4: [],
    L5: [],
    'L5+': [],
  });
  const [selectedKSB, setSelectedKSB] = useState<CapabilityComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'dag'>('list');

  // Admin/moderators can toggle preview mode to see draft content
  const canPreview = isAdmin || isModerator;

  // Fetch user progress and KSBs
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch user progress if authenticated
        if (user?.uid) {
          const progress = await getUserEPAProgress(user.uid, epa.id);
          setUserProgress(progress);

          // Set initial level to user's current level
          if (progress?.proficiencyProgress.currentLevel) {
            setSelectedLevel(progress.proficiencyProgress.currentLevel);
          }
        }

        // Fetch KSBs organized by level
        // Admin/moderators in preview mode can see draft content
        const includeAllStatuses = canPreview && isPreviewMode;
        const ksbs = await getKSBsForEPA(epa.id, { includeAllStatuses });
        setKsbsByLevel(ksbs);
      } catch (error) {
        log.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pathway data. Please refresh.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.uid, epa.id, toast, canPreview, isPreviewMode]);

  const handleKSBComplete = useCallback(
    async (ksbId: string, score?: number, activityType?: 'red_pen' | 'triage' | 'synthesis' | 'assessment') => {
      if (!user?.uid) return;

      try {
        // Record completion to user progress (EPA tracking)
        const result = await recordKSBCompletion(
          user.uid,
          epa.id,
          ksbId,
          score,
          activityType || 'assessment'
        );

        // Submit to FSRS for spaced repetition scheduling
        // Auto-rate as "Good" since completion indicates understanding
        // Higher scores get "Easy", lower scores get "Hard"
        const fsrsRating = score !== undefined
          ? score >= 90 ? Rating.Easy
            : score >= 70 ? Rating.Good
            : Rating.Hard
          : Rating.Good;

        try {
          await submitReview(user.uid, ksbId, fsrsRating);
          log.info(`FSRS review submitted for ${ksbId}`, { rating: Rating[fsrsRating], score });
        } catch (fsrsError) {
          // FSRS failure shouldn't block the completion flow
          log.warn('FSRS submission failed (non-blocking)', { ksbId, error: fsrsError });
        }

        if (result.success) {
          // Refresh progress
          const updatedProgress = await getUserEPAProgress(user.uid, epa.id);
          setUserProgress(updatedProgress);

          if (result.levelAdvanced && result.newLevel) {
            // Level advancement - bigger celebration
            celebrateEPALevel();
            toast({
              title: 'Level Up!',
              description: `You've advanced to ${EPA_LEVEL_LABELS[result.newLevel]}!`,
            });
            setSelectedLevel(result.newLevel);
          } else if (result.epaCompleted) {
            // EPA fully completed - epic celebration
            celebrateEPA();
            toast({
              title: 'EPA Mastered!',
              description: 'You have completed all levels of this EPA!',
            });
          } else {
            // KSB completion - standard celebration
            celebrateKSB();
            toast({
              title: 'KSB Completed',
              description: 'Your progress has been saved.',
            });
          }
        }
      } catch (error) {
        log.error('Error recording completion:', error);
        toast({
          title: 'Error',
          description: 'Failed to save progress. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [user?.uid, epa.id, toast, celebrateKSB, celebrateEPALevel, celebrateEPA]
  );

  const handleKSBSelect = (ksb: CapabilityComponent) => {
    setSelectedKSB(ksb);
  };

  const handleBackToList = () => {
    setSelectedKSB(null);
  };

  const currentLevelKSBs = ksbsByLevel[selectedLevel] || [];
  const completedInLevel = currentLevelKSBs.filter(
    (ksb) => userProgress?.completedKSBs.includes(ksb.id as KSBId)
  ).length;
  const levelProgressPercent = currentLevelKSBs.length > 0
    ? Math.round((completedInLevel / currentLevelKSBs.length) * 100)
    : 0;

  // Generate DAG data for visualization
  const dagData = useMemo(() => {
    return convertKSBsToDAG(
      ksbsByLevel,
      userProgress?.completedKSBs || [],
      userProgress?.proficiencyProgress.currentLevel || 'L1',
      {
        epaId: epa.id,
        epaName: epa.shortName,
      }
    );
  }, [ksbsByLevel, userProgress, epa.id, epa.shortName]);

  // Handle DAG node click - find and select the KSB
  const handleDAGNodeClick = useCallback(
    (nodeId: string) => {
      // Skip checkpoint nodes
      if (nodeId.startsWith('checkpoint-')) return;

      // Find the KSB across all levels
      for (const level of Object.keys(ksbsByLevel) as ProficiencyLevel[]) {
        const ksb = ksbsByLevel[level].find((k) => k.id === nodeId);
        if (ksb) {
          setSelectedLevel(level);
          handleKSBSelect(ksb);
          return;
        }
      }
    },
    [ksbsByLevel]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-nex-deep">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-dim">Loading pathway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-nex-deep">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-nex-border bg-nex-surface transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-80'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-nex-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-dim hover:text-slate-light"
              >
                <Link href={`/nucleus/academy/pathways/${epa.id}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="text-slate-dim hover:text-slate-light"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-4 space-y-3">
              <div>
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-cyan border-cyan/30 mb-2"
                >
                  {epa.tier} EPA {epa.epaNumber}
                </Badge>
                <h1 className="text-lg font-semibold text-gold line-clamp-2">
                  {epa.shortName}
                </h1>
              </div>

              {/* Overall Progress */}
              {userProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-dim">Overall Progress</span>
                    <span className="font-mono text-cyan">
                      {userProgress.proficiencyProgress.progressPercent}%
                    </span>
                  </div>
                  <Progress
                    value={userProgress.proficiencyProgress.progressPercent}
                    className="h-1.5 bg-nex-deep"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-dim">
                    <span>{userProgress.completedKSBs.length} KSBs</span>
                    <span>Level {userProgress.proficiencyProgress.currentLevel}</span>
                  </div>
                </div>
              )}

              {/* Admin Preview Mode Toggle */}
              {canPreview && (
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={cn(
                    'flex items-center gap-2 w-full p-2 rounded-lg text-xs transition-colors',
                    isPreviewMode
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                      : 'bg-nex-deep border border-nex-border text-slate-dim hover:text-slate-light'
                  )}
                >
                  {isPreviewMode ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview Mode (showing drafts)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Enable Preview Mode</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Level Navigation */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-nex-border">
            <LevelNavigation
              levels={entrustmentLevels}
              selectedLevel={selectedLevel}
              currentUserLevel={userProgress?.proficiencyProgress.currentLevel}
              onSelectLevel={setSelectedLevel}
              ksbsByLevel={ksbsByLevel}
              completedKSBs={userProgress?.completedKSBs || []}
            />
          </div>
        )}

        {/* KSB List */}
        {!sidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-slate-light">
                  {EPA_LEVEL_LABELS[selectedLevel]} KSBs
                </h2>
                <Badge variant="outline" className="text-xs text-slate-dim">
                  {completedInLevel}/{currentLevelKSBs.length}
                </Badge>
              </div>

              <Progress value={levelProgressPercent} className="h-1 mb-4 bg-nex-deep" />

              <KSBListPanel
                ksbs={currentLevelKSBs}
                completedKSBs={userProgress?.completedKSBs || []}
                selectedKSB={selectedKSB}
                onSelectKSB={handleKSBSelect}
                isLevelLocked={
                  userProgress
                    ? getLevelIndex(selectedLevel) > getLevelIndex(userProgress.proficiencyProgress.currentLevel)
                    : selectedLevel !== 'L1'
                }
                showStatusBadges={isPreviewMode}
              />
            </div>
          </ScrollArea>
        )}

        {/* Collapsed sidebar icons */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 space-y-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-slate-dim hover:text-cyan"
            >
              <Link href={`/nucleus/academy/pathways/${epa.id}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="w-8 h-px bg-nex-border" />
            {(['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'] as ProficiencyLevel[]).map((level) => {
              const isCurrentLevel = userProgress?.proficiencyProgress.currentLevel === level;
              const isSelected = selectedLevel === level;
              const levelKsbs = ksbsByLevel[level] || [];
              const completedCount = levelKsbs.filter(
                (ksb) => userProgress?.completedKSBs.includes(ksb.id as KSBId)
              ).length;
              const allComplete = levelKsbs.length > 0 && completedCount === levelKsbs.length;

              return (
                <Button
                  key={level}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLevel(level)}
                  aria-label={`Select level ${level} - ${EPA_LEVEL_LABELS[level]}`}
                  aria-current={isSelected ? 'true' : undefined}
                  className={cn(
                    'relative',
                    isSelected && 'bg-cyan/20 text-cyan',
                    isCurrentLevel && !isSelected && 'ring-1 ring-cyan/50',
                    allComplete && 'text-emerald-400'
                  )}
                  title={`${level} - ${EPA_LEVEL_LABELS[level]}`}
                >
                  <span className="font-mono text-xs">{level}</span>
                  {allComplete && (
                    <CheckCircle2 className="absolute -top-1 -right-1 h-3 w-3 text-emerald-400" />
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {selectedKSB ? (
          <KSBLearningView
            ksb={selectedKSB}
            epa={epa}
            userProgress={userProgress}
            onBack={handleBackToList}
            onComplete={handleKSBComplete}
          />
        ) : (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Level Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="font-mono text-cyan border-cyan/30"
                    >
                      {selectedLevel}
                    </Badge>
                    <h1 className="text-2xl font-bold text-gold">
                      {EPA_LEVEL_LABELS[selectedLevel]}
                    </h1>
                  </div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-nex-surface rounded-lg border border-nex-border">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'h-8 px-3',
                        viewMode === 'list' && 'bg-cyan/20 text-cyan'
                      )}
                    >
                      <List className="h-4 w-4 mr-1.5" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'dag' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('dag')}
                      className={cn(
                        'h-8 px-3',
                        viewMode === 'dag' && 'bg-cyan/20 text-cyan'
                      )}
                    >
                      <GitBranch className="h-4 w-4 mr-1.5" />
                      Pathway
                    </Button>
                  </div>
                </div>
                <p className="text-slate-dim">
                  {entrustmentLevels[selectedLevel]?.description ||
                    `Build ${EPA_LEVEL_LABELS[selectedLevel].toLowerCase()} capability in ${epa.shortName}.`}
                </p>
              </div>

              {/* Level Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-nex-surface border border-nex-border">
                  <div className="flex items-center gap-2 text-slate-dim mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">KSBs</span>
                  </div>
                  <div className="text-2xl font-mono text-cyan">
                    {completedInLevel}/{currentLevelKSBs.length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-nex-surface border border-nex-border">
                  <div className="flex items-center gap-2 text-slate-dim mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Progress</span>
                  </div>
                  <div className="text-2xl font-mono text-gold">
                    {levelProgressPercent}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-nex-surface border border-nex-border">
                  <div className="flex items-center gap-2 text-slate-dim mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Est. Time</span>
                  </div>
                  <div className="text-2xl font-mono text-slate-light">
                    {entrustmentLevels[selectedLevel]?.estimatedHours || '—'}h
                  </div>
                </div>
              </div>

              {/* View Mode: DAG or List */}
              {viewMode === 'dag' ? (
                <PathwayDAG
                  dag={dagData}
                  onNodeClick={handleDAGNodeClick}
                  className="max-w-none"
                />
              ) : currentLevelKSBs.length === 0 ? (
                <div className="p-12 rounded-xl bg-nex-surface border border-nex-border text-center">
                  <Lock className="h-12 w-12 text-slate-dim mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-light mb-2">
                    Content Coming Soon
                  </h3>
                  <p className="text-slate-dim max-w-md mx-auto">
                    Practice activities for this level are being developed and reviewed.
                    Check back soon for new learning content!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-sm font-mono uppercase tracking-wider text-cyan/60">
                    Select a KSB to Begin
                  </h2>
                  <div className="grid gap-3" role="list" aria-label="KSB list">
                    {currentLevelKSBs.slice(0, 10).map((ksb) => {
                      const isCompleted = userProgress?.completedKSBs.includes(ksb.id as KSBId);
                      const hasContent = Boolean(ksb.hook && ksb.concept && ksb.activity);

                      return (
                        <button
                          key={ksb.id}
                          type="button"
                          onClick={() => handleKSBSelect(ksb)}
                          aria-label={`${isCompleted ? 'Completed: ' : hasContent ? 'Start: ' : 'Locked: '}${ksb.itemName}`}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                            'hover:border-cyan/50 hover:bg-nex-surface',
                            isCompleted
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-nex-border bg-nex-deep'
                          )}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                              isCompleted ? 'bg-emerald-500/20' : 'bg-nex-surface'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : hasContent ? (
                              <Play className="h-5 w-5 text-cyan" />
                            ) : (
                              <Lock className="h-5 w-5 text-slate-dim" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-cyan/60">
                                {ksb.id}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {ksb.type}
                              </Badge>
                              {isPreviewMode && ksb.status === 'draft' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-500/20 border-amber-500/30 text-amber-400"
                                >
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-light line-clamp-1">
                              {ksb.itemName}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-dim flex-shrink-0" />
                        </button>
                      );
                    })}
                    {currentLevelKSBs.length > 10 && (
                      <p className="text-center text-sm text-slate-dim py-2">
                        Use the sidebar to see all {currentLevelKSBs.length} KSBs
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Level Completion */}
              {levelProgressPercent === 100 && (
                <div className="mt-8 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <Award className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                    Level Complete!
                  </h3>
                  <p className="text-slate-dim">
                    You&apos;ve completed all KSBs at the {EPA_LEVEL_LABELS[selectedLevel]} level.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getLevelIndex(level: ProficiencyLevel): number {
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
  return levels.indexOf(level);
}

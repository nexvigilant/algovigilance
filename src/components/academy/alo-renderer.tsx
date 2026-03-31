'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  BookOpen,
  Target,
  Brain,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ALO,
  ALOSerialized,
  ALOSectionCompletion,
  ALOActivityResult,
} from '@/types/alo';

// Import activity engines
import { RedPenEngine } from './activity-engines/red-pen-engine';
import { TriageEngine } from './activity-engines/triage-engine';
import { SynthesisEngine } from './activity-engines/synthesis-engine';
import { CalculatorEngine } from './activity-engines/calculator-engine';
import { TimelineEngine } from './activity-engines/timeline-engine';
import { CodePlaygroundEngine } from './activity-engines/code-playground-engine';

import { logger } from '@/lib/logger';
const log = logger.scope('ALORenderer');

// ============================================================================
// TYPES
// ============================================================================

interface ALORendererProps {
  /** The ALO to render */
  alo: ALO | ALOSerialized;
  /** User ID for tracking */
  userId: string;
  /** Initial section to start from */
  initialSection?: ALOSection;
  /** Callback when ALO is completed */
  onComplete?: (result: ALOCompletionResult) => void;
  /** Callback when section changes */
  onSectionChange?: (section: ALOSection, completion: ALOSectionCompletion) => void;
  /** Callback when user exits */
  onExit?: () => void;
  /** Whether to show navigation controls */
  showNavigation?: boolean;
  /** Whether to auto-advance after completing sections */
  autoAdvance?: boolean;
}

export type ALOSection = 'hook' | 'concept' | 'activity' | 'reflection';

export interface ALOCompletionResult {
  aloId: string;
  userId: string;
  sectionsCompleted: ALOSectionCompletion;
  activityResult?: ALOActivityResult;
  reflectionResponse?: string;
  totalTimeSpent: number;
  completed: boolean;
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

interface SectionProps {
  alo: ALO | ALOSerialized;
  onComplete: () => void;
}

function HookSection({ alo, onComplete }: SectionProps) {
  return (
    <Card className="max-w-3xl mx-auto border-gold/30 bg-gold/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-gold" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gold/60">
              Hook · 30 seconds
            </p>
            <CardTitle className="text-xl text-slate-light">
              Why This Matters Now
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Badge variant="outline" className="capitalize">
          {alo.hook.scenarioType.replace('_', ' ')}
        </Badge>

        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-slate-light text-lg leading-relaxed">
            {alo.hook.content}
          </p>
        </div>

        <Button onClick={onComplete} className="w-full bg-gold hover:bg-gold/80 text-nex-deep">
          Continue to Concept
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ConceptSection({ alo, onComplete }: SectionProps) {
  return (
    <Card className="max-w-3xl mx-auto border-cyan/30 bg-cyan/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-cyan" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-cyan/60">
              Concept · 2 minutes
            </p>
            <CardTitle className="text-xl text-slate-light">
              Core Knowledge
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Content */}
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-slate-light leading-relaxed">
            {alo.concept.content}
          </p>
        </div>

        {/* Key Points */}
        {alo.concept.keyPoints.length > 0 && (
          <div className="p-4 rounded-lg bg-nex-surface border border-nex-border">
            <h4 className="text-sm font-semibold text-cyan mb-3">Key Points</h4>
            <ul className="space-y-2">
              {alo.concept.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-light">
                  <CheckCircle2 className="h-4 w-4 text-cyan flex-shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {alo.concept.examples.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-light">Examples</h4>
            {alo.concept.examples.map((example, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-nex-deep border border-nex-border">
                <p className="text-sm font-medium text-slate-light">{example.title}</p>
                <p className="text-sm text-slate-dim mt-1">{example.content}</p>
                {example.context && (
                  <p className="text-xs text-slate-dim/70 mt-1 italic">{example.context}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resources */}
        {alo.concept.resources && alo.concept.resources.length > 0 && (
          <div className="p-4 rounded-lg bg-nex-surface/50 border border-nex-border">
            <h4 className="text-sm font-semibold text-slate-light mb-2">Additional Resources</h4>
            <div className="space-y-2">
              {alo.concept.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-cyan hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {resource.title}
                  <Badge variant="outline" className="text-xs ml-auto">
                    {resource.type}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onComplete} className="w-full bg-cyan hover:bg-cyan-glow text-nex-deep">
          Continue to Activity
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface ActivitySectionProps extends SectionProps {
  onActivityComplete: (result: ALOActivityResult) => void;
}

function ActivitySection({ alo, onComplete: _onComplete, onActivityComplete }: ActivitySectionProps) {
  // Generic handler that extracts common result properties from any engine
  const handleEngineComplete = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (engineResult: any) => {
      // Extract score - engines use different property names
      const score = engineResult.totalScore ?? engineResult.score ?? 0;

      // Extract passed status - some use 'completed', others 'passed'
      const passed = engineResult.completed ?? engineResult.passed ?? (score >= 70);

      // Extract time spent - various property names
      const timeSpentSeconds = engineResult.totalTimeSpent ??
                               engineResult.totalTimeSpentSeconds ??
                               engineResult.timeSpentSeconds ?? 0;

      const result: ALOActivityResult = {
        engineType: alo.activity.engineType,
        score,
        passed,
        timeSpentSeconds,
        attempts: engineResult.attempts ?? 1,
      };

      onActivityComplete(result);
      log.info('Activity completed', { engineType: alo.activity.engineType, score: result.score });
    },
    [alo.activity.engineType, onActivityComplete]
  );

  const renderEngine = () => {
    const config = alo.activity.config;

    switch (alo.activity.engineType) {
      case 'red_pen':
        return (
          <RedPenEngine
            config={config as Parameters<typeof RedPenEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      case 'triage':
        return (
          <TriageEngine
            config={config as Parameters<typeof TriageEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      case 'synthesis':
        return (
          <SynthesisEngine
            config={config as Parameters<typeof SynthesisEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      case 'calculator':
        return (
          <CalculatorEngine
            config={config as Parameters<typeof CalculatorEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      case 'timeline':
        return (
          <TimelineEngine
            config={config as Parameters<typeof TimelineEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      case 'code_playground':
        return (
          <CodePlaygroundEngine
            config={config as Parameters<typeof CodePlaygroundEngine>[0]['config']}
            onComplete={handleEngineComplete}
          />
        );

      default:
        return (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertDescription>
              Activity engine "{alo.activity.engineType}" is not yet implemented.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-emerald-400/60">
                Activity · 5 minutes
              </p>
              <CardTitle className="text-lg text-slate-light">
                Practice Application
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-dim">{alo.activity.instructions}</p>
        </CardContent>
      </Card>

      {renderEngine()}
    </div>
  );
}

interface ReflectionSectionProps extends SectionProps {
  onReflectionComplete: (response: string) => void;
}

function ReflectionSection({ alo, onComplete, onReflectionComplete }: ReflectionSectionProps) {
  const [response, setResponse] = useState('');

  const handleSubmit = () => {
    onReflectionComplete(response);
    onComplete();
  };

  return (
    <Card className="max-w-3xl mx-auto border-purple-500/30 bg-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Brain className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-purple-400/60">
              Reflection · 30 seconds
            </p>
            <CardTitle className="text-xl text-slate-light">
              Capture Your Learning
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-nex-surface border border-nex-border">
          <p className="text-slate-light">{alo.reflection.prompt}</p>
        </div>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Capture your key takeaway or insight..."
          className="w-full h-32 p-4 rounded-lg bg-nex-deep border border-nex-border text-slate-light placeholder:text-slate-dim/50 resize-none focus:outline-none focus:border-purple-500/50"
        />

        {alo.reflection.portfolioArtifact && (
          <Alert className="border-purple-500/30 bg-purple-500/10">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-slate-light">
              <strong>{alo.reflection.portfolioArtifact.title}</strong>: Your reflection will be saved to your portfolio.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={response.trim().length < 10}
          className="w-full bg-purple-500 hover:bg-purple-400 text-white"
        >
          Complete ALO
          <CheckCircle2 className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SECTION_ORDER: ALOSection[] = ['hook', 'concept', 'activity', 'reflection'];

const SECTION_CONFIG: Record<ALOSection, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  hook: { label: 'Hook', icon: Lightbulb, color: 'text-gold' },
  concept: { label: 'Concept', icon: BookOpen, color: 'text-cyan' },
  activity: { label: 'Activity', icon: Target, color: 'text-emerald-400' },
  reflection: { label: 'Reflection', icon: Brain, color: 'text-purple-400' },
};

export function ALORenderer({
  alo,
  userId,
  initialSection = 'hook',
  onComplete,
  onSectionChange,
  onExit,
  showNavigation = true,
  autoAdvance = true,
}: ALORendererProps) {
  const [currentSection, setCurrentSection] = useState<ALOSection>(initialSection);
  const [sectionsCompleted, setSectionsCompleted] = useState<ALOSectionCompletion>({
    hook: false,
    concept: false,
    activity: false,
    reflection: false,
  });
  const [activityResult, setActivityResult] = useState<ALOActivityResult | undefined>();
  const [_reflectionResponse, setReflectionResponse] = useState<string | undefined>();
  const [startTime] = useState<number>(Date.now());

  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  const progress = useMemo(() => {
    const completed = Object.values(sectionsCompleted).filter(Boolean).length;
    return (completed / 4) * 100;
  }, [sectionsCompleted]);

  const handleSectionComplete = useCallback(
    (section: ALOSection) => {
      const newCompletion = { ...sectionsCompleted, [section]: true };
      setSectionsCompleted(newCompletion);
      onSectionChange?.(section, newCompletion);

      // Auto-advance to next section
      if (autoAdvance) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < SECTION_ORDER.length) {
          setCurrentSection(SECTION_ORDER[nextIndex]);
        }
      }
    },
    [sectionsCompleted, currentIndex, autoAdvance, onSectionChange]
  );

  const handleActivityComplete = useCallback((result: ALOActivityResult) => {
    setActivityResult(result);
    handleSectionComplete('activity');
  }, [handleSectionComplete]);

  const handleReflectionComplete = useCallback((response: string) => {
    setReflectionResponse(response);

    // ALO is complete
    const totalTimeSpent = Math.round((Date.now() - startTime) / 1000);
    const result: ALOCompletionResult = {
      aloId: alo.id,
      userId,
      sectionsCompleted: { ...sectionsCompleted, reflection: true },
      activityResult,
      reflectionResponse: response,
      totalTimeSpent,
      completed: true,
    };

    onComplete?.(result);
    log.info('ALO completed', { aloId: alo.id, totalTimeSpent });
  }, [alo.id, userId, sectionsCompleted, activityResult, startTime, onComplete]);

  const navigateTo = useCallback((section: ALOSection) => {
    setCurrentSection(section);
  }, []);

  return (
    <div className="min-h-screen bg-nex-dark py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-cyan/60">
                {alo.domainId} · {alo.ksbId}
              </p>
              <h1 className="text-2xl font-bold text-slate-light">{alo.title}</h1>
            </div>
            {onExit && (
              <Button variant="ghost" onClick={onExit} className="text-slate-dim">
                Exit
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-dim" />
                <span className="text-slate-dim">
                  ~{alo.metadata.estimatedMinutes} min
                </span>
              </div>
              <span className="text-slate-dim">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Section Navigation */}
        {showNavigation && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2">
              {SECTION_ORDER.map((section, _idx) => {
                const config = SECTION_CONFIG[section];
                const Icon = config.icon;
                const isCompleted = sectionsCompleted[section];
                const isCurrent = section === currentSection;

                return (
                  <button
                    key={section}
                    onClick={() => navigateTo(section)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                      isCurrent
                        ? `bg-nex-surface border border-${config.color.replace('text-', '')}/30`
                        : 'hover:bg-nex-surface/50',
                      isCompleted && !isCurrent && 'opacity-60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isCurrent ? config.color : 'text-slate-dim'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm',
                        isCurrent ? 'text-slate-light' : 'text-slate-dim'
                      )}
                    >
                      {config.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Content */}
        <div className="pb-12">
          {currentSection === 'hook' && (
            <HookSection alo={alo} onComplete={() => handleSectionComplete('hook')} />
          )}

          {currentSection === 'concept' && (
            <ConceptSection alo={alo} onComplete={() => handleSectionComplete('concept')} />
          )}

          {currentSection === 'activity' && (
            <ActivitySection
              alo={alo}
              onComplete={() => {}}
              onActivityComplete={handleActivityComplete}
            />
          )}

          {currentSection === 'reflection' && (
            <ReflectionSection
              alo={alo}
              onComplete={() => handleSectionComplete('reflection')}
              onReflectionComplete={handleReflectionComplete}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {showNavigation && (
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigateTo(SECTION_ORDER[currentIndex - 1])}
              disabled={currentIndex === 0}
              className="text-slate-dim"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentIndex < SECTION_ORDER.length - 1 && (
              <Button
                onClick={() => navigateTo(SECTION_ORDER[currentIndex + 1])}
                disabled={!sectionsCompleted[currentSection]}
                className="bg-cyan hover:bg-cyan-glow text-nex-deep"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ALORenderer;

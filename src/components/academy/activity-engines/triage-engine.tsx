'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Timer, Trophy, GitBranch } from 'lucide-react';
import type { TriageConfig, BranchCondition } from '@/types/pv-curriculum';

interface TriageEngineProps {
  config: TriageConfig;
  onComplete: (result: TriageResult) => void;
  onCancel?: () => void;
}

export interface TriageResult {
  decisions: DecisionResult[];
  totalScore: number;
  accuracyScore: number;
  speedScore: number;
  justificationScore: number;
  totalTimeSpent: number;
  completed: boolean;
}

interface DecisionResult {
  decisionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
  justification?: string;
}

type EngineState = 'intro' | 'decision' | 'feedback' | 'results';

export function TriageEngine({ config, onComplete, onCancel }: TriageEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(config.timeConstraint);
  const [decisionStartTime, setDecisionStartTime] = useState<number>(0);
  const [results, setResults] = useState<DecisionResult[]>([]);
  const [showRationale, setShowRationale] = useState(false);

  // Branching state
  const [currentDecisionId, setCurrentDecisionId] = useState<string | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<Map<string, string>>(new Map());
  const [visitedDecisions, setVisitedDecisions] = useState<string[]>([]);

  // Get current decision - supports both linear and branching modes
  const getCurrentDecision = useCallback(() => {
    if (config.branchingEnabled && currentDecisionId) {
      return config.decisions.find((d) => d.id === currentDecisionId);
    }
    return config.decisions[currentIndex];
  }, [config.branchingEnabled, currentDecisionId, config.decisions, currentIndex]);

  const currentDecision = getCurrentDecision();
  const totalDecisions = config.branchingEnabled
    ? visitedDecisions.length + 1 // In branching mode, count visited + current
    : config.decisions.length;

  // Refs to hold latest values for timeout handler to avoid stale closures
  const submitRef = useRef<() => void>(() => {});
  const selectedOptionRef = useRef<string | null>(null);
  const hasTimedOutRef = useRef(false);

  // Keep selectedOption ref in sync
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  // Timer effect - only decrements, doesn't call side effects
  useEffect(() => {
    if (state !== 'decision') {
      // Reset timeout flag when leaving decision state
      hasTimedOutRef.current = false;
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [state, currentIndex, config.timeConstraint]);

  // Separate effect to handle timeout - avoids side effects in state updater
  useEffect(() => {
    if (state === 'decision' && timeRemaining === 0 && !hasTimedOutRef.current) {
      hasTimedOutRef.current = true;
      // Only auto-submit if there's a valid selection made
      if (selectedOptionRef.current) {
        submitRef.current();
      }
      // If no selection when time runs out, don't auto-submit empty answer
      // User can still manually submit if they want, or use the skip behavior
    }
  }, [state, timeRemaining]);

  // Evaluate branch conditions
  const evaluateCondition = useCallback(
    (condition: BranchCondition): boolean => {
      switch (condition.type) {
        case 'previous_answer':
          if (!condition.decisionId || !condition.requiredOptionId) return false;
          return decisionHistory.get(condition.decisionId) === condition.requiredOptionId;

        case 'score_threshold': {
          if (condition.minScore === undefined) return false;
          const correctCount = results.filter((r) => r.isCorrect).length;
          const currentScore = results.length > 0 ? (correctCount / results.length) * 100 : 0;
          return currentScore >= condition.minScore;
        }

        case 'all_of':
          return (condition.conditions || []).every((c) => evaluateCondition(c));

        case 'any_of':
          return (condition.conditions || []).some((c) => evaluateCondition(c));

        default:
          return true;
      }
    },
    [decisionHistory, results]
  );

  // Filter options based on show conditions
  const getVisibleOptions = useCallback(() => {
    if (!currentDecision) return [];
    return currentDecision.options.filter((option) => {
      if (!option.showCondition) return true;
      return evaluateCondition(option.showCondition);
    });
  }, [currentDecision, evaluateCondition]);

  const handleStart = () => {
    setState('decision');
    setDecisionStartTime(Date.now());
    setTimeRemaining(config.timeConstraint);

    // Initialize branching mode
    if (config.branchingEnabled) {
      const startId = config.startDecisionId || config.decisions[0]?.id;
      setCurrentDecisionId(startId);
      setVisitedDecisions([]);
      setDecisionHistory(new Map());
    }
  };

  const handleSubmitDecision = useCallback(() => {
    if (!currentDecision) return;

    const timeSpent = (Date.now() - decisionStartTime) / 1000;
    const isCorrect = selectedOption === currentDecision.correctOptionId;

    const result: DecisionResult = {
      decisionId: currentDecision.id,
      selectedOptionId: selectedOption || '',
      isCorrect,
      timeSpent,
      justification: justification || undefined,
    };

    setResults((prev) => [...prev, result]);

    // Track decision history for branching
    if (config.branchingEnabled && selectedOption) {
      setDecisionHistory((prev) => new Map(prev).set(currentDecision.id, selectedOption));
      setVisitedDecisions((prev) => [...prev, currentDecision.id]);
    }

    setState('feedback');
    setShowRationale(true);
  }, [selectedOption, currentDecision, decisionStartTime, justification, config.branchingEnabled]);

  // Keep ref updated with latest callback
  useEffect(() => {
    submitRef.current = handleSubmitDecision;
  }, [handleSubmitDecision]);

  const handleNextDecision = () => {
    // Handle branching mode
    if (config.branchingEnabled && currentDecision) {
      // Find the selected option to get nextDecisionId
      const selectedOpt = currentDecision.options.find((o) => o.id === selectedOption);
      const nextId = selectedOpt?.nextDecisionId;

      // Check if this is an end decision
      const isEndDecision =
        config.endDecisionIds?.includes(currentDecision.id) || !nextId;

      if (isEndDecision) {
        calculateFinalResults();
        return;
      }

      // Move to next decision in branch
      setCurrentDecisionId(nextId);
      setSelectedOption(null);
      setJustification('');
      setTimeRemaining(config.timeConstraint);
      setDecisionStartTime(Date.now());
      setShowRationale(false);
      setState('decision');
      return;
    }

    // Linear mode (original behavior)
    if (currentIndex < config.decisions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setJustification('');
      setTimeRemaining(config.timeConstraint);
      setDecisionStartTime(Date.now());
      setShowRationale(false);
      setState('decision');
    } else {
      calculateFinalResults();
    }
  };

  const calculateFinalResults = () => {
    const { accuracy, speed, justification: justWeight } = config.scoringWeights;

    // Calculate accuracy score (percentage correct)
    const correctCount = results.length > 0
      ? results.filter((r) => r.isCorrect).length
      : 0;
    const accuracyScore = (correctCount / totalDecisions) * 100;

    // Calculate speed score (based on average time vs constraint)
    const avgTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length
      : config.timeConstraint;
    const speedRatio = Math.max(0, 1 - avgTime / config.timeConstraint);
    const speedScore = speedRatio * 100;

    // Calculate justification score (based on whether justifications were provided)
    const withJustification = results.filter((r) => r.justification && r.justification.length > 10).length;
    const justificationScore = (withJustification / totalDecisions) * 100;

    // Weighted total score
    const totalScore =
      accuracyScore * accuracy +
      speedScore * speed +
      justificationScore * justWeight;

    const totalTimeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0);

    const finalResult: TriageResult = {
      decisions: results,
      totalScore,
      accuracyScore,
      speedScore,
      justificationScore,
      totalTimeSpent,
      completed: true,
    };

    setState('results');
    onComplete(finalResult);
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / config.timeConstraint) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Intro screen
  if (state === 'intro') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Triage Activity
          </CardTitle>
          <CardDescription>
            Rapid decision-making under time pressure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm">
            <h4>Scenario</h4>
            <p>{config.scenario}</p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You will have <strong>{config.timeConstraint} seconds</strong> to make each decision.
              There are <strong>{totalDecisions} decisions</strong> to complete.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Scoring Weights</h4>
            <ul className="space-y-1 text-sm">
              <li>Accuracy: {(config.scoringWeights.accuracy * 100).toFixed(0)}%</li>
              <li>Speed: {(config.scoringWeights.speed * 100).toFixed(0)}%</li>
              <li>Justification: {(config.scoringWeights.justification * 100).toFixed(0)}%</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleStart} className="flex-1">
              Begin Triage
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Decision screen
  if (state === 'decision') {
    if (!currentDecision) {
      return null; // Guard against missing decision
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              {config.branchingEnabled ? (
                <>
                  <GitBranch className="inline-block mr-1 h-3 w-3" />
                  Step {visitedDecisions.length + 1}
                </>
              ) : (
                `Decision ${currentIndex + 1} of ${totalDecisions}`
              )}
            </Badge>
            <div className={`flex items-center gap-2 font-mono text-lg ${getTimerColor()}`}>
              <Clock className="h-5 w-5" />
              {timeRemaining}s
            </div>
          </div>
          <Progress
            value={
              config.branchingEnabled
                ? ((visitedDecisions.length + 1) / Math.max(totalDecisions, visitedDecisions.length + 1)) * 100
                : ((currentIndex + 1) / totalDecisions) * 100
            }
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-medium">{currentDecision.prompt}</div>

          <RadioGroup value={selectedOption || ''} onValueChange={setSelectedOption}>
            {getVisibleOptions().map((option) => (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">
                    {option.label}
                    {config.branchingEnabled && option.nextDecisionId && (
                      <GitBranch className="inline-block ml-2 h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  {option.description && (
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="justification">Brief justification (optional)</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why did you choose this option?"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmitDecision}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Decision
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Feedback screen
  if (state === 'feedback') {
    if (!currentDecision) {
      return null; // Guard against missing decision
    }

    const lastResult = results[results.length - 1];
    const isCorrect = lastResult?.isCorrect;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Correct!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Incorrect
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Time taken: {lastResult?.timeSpent.toFixed(1)}s
          </div>

          {showRationale && (
            <Alert className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                <strong>Rationale:</strong> {currentDecision.rationale}
              </AlertDescription>
            </Alert>
          )}

          {currentDecision.followUp && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{currentDecision.followUp}</p>
            </div>
          )}

          <Button onClick={handleNextDecision} className="w-full">
            {currentIndex < totalDecisions - 1 ? 'Next Decision' : 'View Results'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (state === 'results') {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Triage Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{correctCount}/{totalDecisions}</div>
              <div className="text-sm text-muted-foreground">Correct Decisions</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{avgTime.toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Decision Summary</h4>
            {results.map((result, index) => (
              <div
                key={result.decisionId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span>Decision {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {result.timeSpent.toFixed(1)}s
                  </span>
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default TriageEngine;

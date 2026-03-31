'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Clock,
  ArrowRight,
  Lightbulb,
  Target,
} from 'lucide-react';
import type { CalculatorConfig, CalculatorResult, CalculatorTaskResult } from '@/types/pv-curriculum';

interface CalculatorEngineProps {
  config: CalculatorConfig;
  onComplete: (result: CalculatorResult) => void;
  onCancel?: () => void;
}

type EngineState = 'intro' | 'calculate' | 'review' | 'results';

export function CalculatorEngine({ config, onComplete, onCancel }: CalculatorEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  // Track when user actually starts calculating (not component mount time)
  const [actualStartTime, setActualStartTime] = useState<number | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [interpretations, setInterpretations] = useState<Record<string, string>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [taskStartTimes, setTaskStartTimes] = useState<Record<string, number>>({});

  const currentTask = config.calculations[currentTaskIndex];
  const totalTasks = config.calculations.length;
  const progress = ((currentTaskIndex + 1) / totalTasks) * 100;

  // Check if answer is within tolerance
  const isWithinTolerance = useCallback(
    (userAnswer: number, expected: number) => {
      const percentError = Math.abs((userAnswer - expected) / expected);
      return percentError <= config.tolerance;
    },
    [config.tolerance]
  );

  // Calculate results (memoized for use in results state)
  const calculateResults = useCallback((): CalculatorResult => {
    // Use actualStartTime if set, otherwise fall back to current time (shouldn't happen in normal flow)
    const effectiveStartTime = actualStartTime ?? Date.now();

    const taskResults: CalculatorTaskResult[] = config.calculations.map((task) => {
      const userAnswer = answers[task.id];
      // Use typeof check to handle both null and undefined - answers[task.id] can be undefined if key doesn't exist
      const hasValidAnswer = typeof userAnswer === 'number' && !Number.isNaN(userAnswer);
      const isCorrect = hasValidAnswer && userAnswer === task.expectedAnswer;
      const isClose = hasValidAnswer && isWithinTolerance(userAnswer, task.expectedAnswer);
      const percentageError = hasValidAnswer
        ? Math.abs((userAnswer - task.expectedAnswer) / task.expectedAnswer) * 100
        : 100;

      let interpretationCorrect: boolean | undefined;
      if (task.interpretation) {
        interpretationCorrect = interpretations[task.id] === task.interpretation.correctOptionId;
      }

      return {
        taskId: task.id,
        userAnswer,
        expectedAnswer: task.expectedAnswer,
        isCorrect,
        isWithinTolerance: isClose,
        percentageError,
        timeSpent: Math.round(((taskStartTimes[`${task.id}_end`] || Date.now()) - (taskStartTimes[task.id] || effectiveStartTime)) / 1000),
        hintsUsed: hintsUsed[task.id] || 0,
        interpretationCorrect,
      };
    });

    const correctCount = taskResults.filter((r) => r.isCorrect || r.isWithinTolerance).length;
    const interpretationResults = taskResults.filter((r) => r.interpretationCorrect !== undefined);
    const interpretationsCorrect = interpretationResults.filter((r) => r.interpretationCorrect).length;

    // Score: 70% calculations, 30% interpretations (if any)
    const calcScore = (correctCount / totalTasks) * 100;
    const interpScore =
      interpretationResults.length > 0
        ? (interpretationsCorrect / interpretationResults.length) * 100
        : calcScore;
    const totalScore = interpretationResults.length > 0 ? calcScore * 0.7 + interpScore * 0.3 : calcScore;

    return {
      totalScore: Math.round(totalScore),
      totalTimeSpent: Math.round((Date.now() - effectiveStartTime) / 1000),
      calculations: taskResults,
      interpretationsCorrect,
      interpretationsTotal: interpretationResults.length,
    };
  }, [answers, interpretations, hintsUsed, taskStartTimes, config.calculations, totalTasks, actualStartTime, isWithinTolerance]);

  // Pre-calculate results (must be called unconditionally per React rules)
  const results = useMemo(() => calculateResults(), [calculateResults]);

  const handleStartTask = () => {
    const now = Date.now();
    // Set the actual start time when user clicks "Start Calculations"
    setActualStartTime(now);
    setTaskStartTimes((prev) => ({ ...prev, [currentTask.id]: now }));
    setState('calculate');
  };

  const handleAnswerChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setAnswers((prev) => ({ ...prev, [currentTask.id]: numValue }));
  };

  const handleInterpretationChange = (value: string) => {
    setInterpretations((prev) => ({ ...prev, [currentTask.id]: value }));
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed((prev) => ({
      ...prev,
      [currentTask.id]: (prev[currentTask.id] || 0) + 1,
    }));
  };

  const handleNextTask = () => {
    setTaskStartTimes((prev) => ({ ...prev, [`${currentTask.id}_end`]: Date.now() }));
    setShowHint(false);

    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
      setTaskStartTimes((prev) => ({ ...prev, [config.calculations[currentTaskIndex + 1].id]: Date.now() }));
    } else {
      setState('review');
    }
  };

  const handleComplete = () => {
    const results = calculateResults();
    setState('results');
    onComplete(results);
  };

  // Render 2x2 contingency table
  const renderContingencyTable = () => {
    if (config.dataTable.type !== '2x2' || !config.dataTable.contingencyTable) return null;
    const { headers, cells, labels } = config.dataTable.contingencyTable;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-nex-border p-2 bg-nex-deep"></th>
              <th className="border border-nex-border p-2 bg-nex-deep text-cyan">{headers.col} (+)</th>
              <th className="border border-nex-border p-2 bg-nex-deep text-slate-dim">{headers.col} (-)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border border-nex-border p-2 bg-nex-deep text-gold">{headers.row} (+)</th>
              <td className="border border-nex-border p-3 text-center">
                <span className="font-mono text-lg text-cyan">{cells.a}</span>
                {labels?.a && <span className="block text-xs text-slate-dim">{labels.a}</span>}
              </td>
              <td className="border border-nex-border p-3 text-center">
                <span className="font-mono text-lg">{cells.b}</span>
                {labels?.b && <span className="block text-xs text-slate-dim">{labels.b}</span>}
              </td>
            </tr>
            <tr>
              <th className="border border-nex-border p-2 bg-nex-deep text-slate-dim">{headers.row} (-)</th>
              <td className="border border-nex-border p-3 text-center">
                <span className="font-mono text-lg">{cells.c}</span>
                {labels?.c && <span className="block text-xs text-slate-dim">{labels.c}</span>}
              </td>
              <td className="border border-nex-border p-3 text-center">
                <span className="font-mono text-lg">{cells.d}</span>
                {labels?.d && <span className="block text-xs text-slate-dim">{labels.d}</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render multi-row data table
  const renderMultiRowTable = () => {
    if (config.dataTable.type !== 'multi_row' || !config.dataTable.rows) return null;
    const { rows, columns } = config.dataTable;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-nex-border p-2 bg-nex-deep"></th>
              {columns?.map((col, i) => (
                <th key={i} className="border border-nex-border p-2 bg-nex-deep text-cyan">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.highlight ? 'bg-cyan/10' : ''}>
                <th className="border border-nex-border p-2 bg-nex-deep text-slate-light">
                  {row.label}
                </th>
                {row.values.map((val, j) => (
                  <td key={j} className="border border-nex-border p-2 text-center font-mono">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // INTRO STATE
  if (state === 'intro') {
    return (
      <Card className="max-w-3xl mx-auto bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gold">
            <Calculator className="h-6 w-6" />
            Calculator Activity
          </CardTitle>
          <CardDescription>Quantitative Analysis Exercise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm prose-invert">
            <p className="text-slate-light">{config.scenario}</p>
          </div>

          {config.dataTable.title && (
            <h3 className="text-sm font-semibold text-slate-light">{config.dataTable.title}</h3>
          )}

          {renderContingencyTable()}
          {renderMultiRowTable()}

          <div className="flex items-center gap-4 text-sm text-slate-dim">
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              {totalTasks} calculations
            </Badge>
            {config.timeLimitSeconds && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(config.timeLimitSeconds / 60)} min limit
              </Badge>
            )}
            {config.showFormulas && (
              <Badge variant="outline" className="text-cyan">
                <Lightbulb className="h-3 w-3 mr-1" />
                Formulas shown
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleStartTask} className="bg-cyan hover:bg-cyan-glow text-nex-deep">
              Start Calculations
              <ArrowRight className="h-4 w-4 ml-2" />
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

  // CALCULATE STATE
  if (state === 'calculate') {
    const currentAnswer = answers[currentTask.id];
    const currentInterpretation = interpretations[currentTask.id];
    const currentHintIndex = (hintsUsed[currentTask.id] || 0) - 1;

    return (
      <Card className="max-w-3xl mx-auto bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-gold">{currentTask.name}</CardTitle>
              <CardDescription>
                Task {currentTaskIndex + 1} of {totalTasks}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Table Reference */}
          <div className="p-4 rounded-lg bg-nex-deep border border-nex-border">
            {renderContingencyTable()}
            {renderMultiRowTable()}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <p className="text-slate-light">{currentTask.description}</p>

            {/* Formula hint */}
            {config.showFormulas && currentTask.formula && (
              <div className="p-3 rounded bg-cyan/10 border border-cyan/30">
                <p className="text-xs text-cyan/70 uppercase tracking-wide mb-1">Formula</p>
                <code className="text-sm font-mono text-cyan">{currentTask.formula}</code>
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <Label htmlFor="answer" className="text-slate-light">
              Your Answer {currentTask.unit && `(${currentTask.unit})`}
            </Label>
            <div className="flex gap-2">
              <Input
                id="answer"
                type="number"
                step="any"
                value={currentAnswer ?? ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={`Enter value (${currentTask.decimalPlaces} decimal places)`}
                className="font-mono bg-nex-deep border-nex-border"
              />
              {config.calculatorAllowed && (
                <Button variant="outline" size="icon" title="Calculator allowed">
                  <Calculator className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Interpretation (if any) */}
          {currentTask.interpretation && currentAnswer !== null && (
            <div className="space-y-3 pt-4 border-t border-nex-border">
              <Label className="text-slate-light">{currentTask.interpretation.prompt}</Label>
              <RadioGroup value={currentInterpretation || ''} onValueChange={handleInterpretationChange}>
                {currentTask.interpretation.options.map((option) => (
                  <div key={option.id} className="flex items-start space-x-3 p-2 rounded hover:bg-nex-deep">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="text-sm text-slate-dim cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Hints */}
          {currentTask.hints && currentTask.hints.length > 0 && (
            <div className="space-y-2">
              {showHint && currentHintIndex >= 0 && (
                <Alert className="bg-gold/10 border-gold/30">
                  <HelpCircle className="h-4 w-4 text-gold" />
                  <AlertDescription className="text-slate-light">
                    {currentTask.hints[Math.min(currentHintIndex, currentTask.hints.length - 1)]}
                  </AlertDescription>
                </Alert>
              )}
              {currentHintIndex < currentTask.hints.length - 1 && (
                <Button variant="ghost" size="sm" onClick={handleShowHint} className="text-slate-dim">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  {showHint ? 'Next Hint' : 'Need a Hint?'}
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleNextTask}
              disabled={currentAnswer === null}
              className="bg-cyan hover:bg-cyan-glow text-nex-deep ml-auto"
            >
              {currentTaskIndex < totalTasks - 1 ? 'Next Calculation' : 'Review Answers'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // REVIEW STATE
  if (state === 'review') {
    return (
      <Card className="max-w-3xl mx-auto bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-gold">Review Your Answers</CardTitle>
          <CardDescription>Check your calculations before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.calculations.map((task, index) => {
            const userAnswer = answers[task.id];
            return (
              <div key={task.id} className="flex items-center justify-between p-3 rounded bg-nex-deep">
                <div>
                  <p className="font-medium text-slate-light">{task.name}</p>
                  <p className="text-sm text-slate-dim">{task.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg text-cyan">
                    {userAnswer?.toFixed(task.decimalPlaces) ?? '—'}
                    {task.unit && <span className="text-sm text-slate-dim ml-1">{task.unit}</span>}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentTaskIndex(index);
                      setState('calculate');
                    }}
                    className="text-xs text-cyan"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setState('calculate')}>
              Back to Calculations
            </Button>
            <Button onClick={handleComplete} className="bg-cyan hover:bg-cyan-glow text-nex-deep">
              Submit Answers
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // RESULTS STATE (results already calculated above)
  return (
    <Card className="max-w-3xl mx-auto bg-nex-surface border-nex-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Trophy className="h-6 w-6" />
          Results
        </CardTitle>
        <CardDescription>Calculation Activity Complete</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score */}
        <div className="text-center p-6 rounded-xl bg-nex-deep">
          <p className="text-5xl font-mono font-bold text-cyan">{results.totalScore}%</p>
          <p className="text-slate-dim mt-2">Overall Score</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-nex-deep">
            <p className="text-lg font-mono text-emerald-400">
              {results.calculations.filter((r) => r.isCorrect || r.isWithinTolerance).length}/{totalTasks}
            </p>
            <p className="text-xs text-slate-dim">Correct</p>
          </div>
          <div className="p-3 rounded-lg bg-nex-deep">
            <p className="text-lg font-mono text-gold">{results.totalTimeSpent}s</p>
            <p className="text-xs text-slate-dim">Time</p>
          </div>
          {results.interpretationsTotal > 0 && (
            <div className="p-3 rounded-lg bg-nex-deep">
              <p className="text-lg font-mono text-cyan">
                {results.interpretationsCorrect}/{results.interpretationsTotal}
              </p>
              <p className="text-xs text-slate-dim">Interpretations</p>
            </div>
          )}
        </div>

        {/* Detailed Results */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-light">Detailed Results</h3>
          {results.calculations.map((result) => {
            const task = config.calculations.find((t) => t.id === result.taskId);
            if (!task) return null;
            const isPass = result.isCorrect || result.isWithinTolerance;

            return (
              <div
                key={result.taskId}
                className={`p-3 rounded-lg border ${
                  isPass ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {isPass ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="font-medium text-slate-light">{task.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">
                      <span className={isPass ? 'text-emerald-400' : 'text-red-400'}>
                        {result.userAnswer?.toFixed(task.decimalPlaces) ?? '—'}
                      </span>
                      {!isPass && (
                        <span className="text-slate-dim ml-2">
                          (expected: {result.expectedAnswer.toFixed(task.decimalPlaces)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {!isPass && result.percentageError < 100 && (
                  <p className="text-xs text-slate-dim mt-1">
                    Error: {result.percentageError.toFixed(1)}% (tolerance: {config.tolerance * 100}%)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

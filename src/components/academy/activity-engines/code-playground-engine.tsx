'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Clock,
  Trophy,
  Eye,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import type { CodePlaygroundConfig } from '@/types/pv-curriculum';
import type { Playground } from 'livecodes/react';

// Dynamic import for LiveCodes to avoid SSR issues
const LiveCodes = dynamic(() => import('livecodes/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Code2 className="h-5 w-5 animate-pulse" />
        Loading playground...
      </div>
    </div>
  ),
});

interface CodePlaygroundEngineProps {
  config: CodePlaygroundConfig;
  onComplete: (result: CodePlaygroundResult) => void;
  onCancel?: () => void;
}

export interface CodePlaygroundResult {
  code: string;
  testResults: TestResult[];
  totalScore: number;
  hintsUsed: number;
  hintPenalty: number;
  timeSpent: number;
  attempts: number;
  completed: boolean;
}

interface TestResult {
  testId: string;
  description: string;
  passed: boolean;
  output?: string;
  expectedOutput: string;
  weight: number;
}

type EngineState = 'intro' | 'coding' | 'results';

/**
 * Escape regex special characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Code Playground Engine
 * Interactive coding exercises using LiveCodes for PV data analysis
 */
export function CodePlaygroundEngine({ config, onComplete, onCancel }: CodePlaygroundEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  const [currentCode, setCurrentCode] = useState(config.starterCode);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    config.timeLimitMinutes ? config.timeLimitMinutes * 60 : 0
  );
  const [startTime, setStartTime] = useState<number>(0);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // Refs to avoid stale closures in timer
  const currentCodeRef = useRef(currentCode);
  const hintsUsedRef = useRef(hintsUsed);
  const attemptsRef = useRef(attempts);
  const startTimeRef = useRef(startTime);

  // Keep refs in sync
  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);
  useEffect(() => {
    hintsUsedRef.current = hintsUsed;
  }, [hintsUsed]);
  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Test runner - defined early so it can be used by handlers
  const runTests = useCallback(
    (code: string): TestResult[] => {
      // Simplified test runner - validates code structure, not just string presence
      // In production, integrate with LiveCodes execution API for actual code running
      return config.testCases.map((testCase) => {
        // Strip comments and strings to prevent gaming via comments
        const strippedCode = code
          .replace(/["'`][\s\S]*?["'`]/g, '') // Remove string literals
          .replace(/#.*$/gm, '')              // Remove Python comments
          .replace(/\/\/.*$/gm, '')           // Remove JS single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove JS multi-line comments

        // Check for expected output in executable context (print, return, console.log)
        const executablePatterns = [
          new RegExp(`print\\s*\\([^)]*${escapeRegex(testCase.expectedOutput)}`),
          new RegExp(`return\\s+[^;]*${escapeRegex(testCase.expectedOutput)}`),
          new RegExp(`console\\.log\\s*\\([^)]*${escapeRegex(testCase.expectedOutput)}`),
        ];

        const outputInExecutableContext = executablePatterns.some((pattern) =>
          pattern.test(strippedCode)
        );

        // Also check if input is properly used (not just present in comments)
        const inputUsed = testCase.input
          ? strippedCode.includes(testCase.input)
          : true;

        const passed = outputInExecutableContext && inputUsed;

        return {
          testId: testCase.id,
          description: testCase.description,
          passed,
          expectedOutput: testCase.expectedOutput,
          weight: testCase.weight,
        };
      });
    },
    [config.testCases]
  );

  // Submit handler that uses refs (for timer callback)
  const handleSubmitWithRefs = useCallback(() => {
    const code = currentCodeRef.current;
    const hints = hintsUsedRef.current;
    const attemptCount = attemptsRef.current;
    const start = startTimeRef.current;

    const results = runTests(code);
    const timeSpent = (Date.now() - start) / 1000;

    // Calculate total weight for normalization
    const totalWeight = config.testCases.reduce((sum, tc) => sum + tc.weight, 0);
    const normalizedWeight = totalWeight > 0 ? totalWeight : 1;

    // Calculate normalized score (0-100)
    const baseScore = results.reduce(
      (sum, r) => sum + (r.passed ? (r.weight / normalizedWeight) * 100 : 0),
      0
    );

    // Apply hint penalty
    const hintPenalty = (config.hints || [])
      .filter((h) => hints.includes(h.id))
      .reduce((sum, h) => sum + h.scorePenalty * 100, 0);

    // Clamp final score to 0-100
    const totalScore = Math.max(0, Math.min(100, baseScore - hintPenalty));

    const result: CodePlaygroundResult = {
      code,
      testResults: results,
      totalScore,
      hintsUsed: hints.length,
      hintPenalty,
      timeSpent,
      attempts: attemptCount,
      completed: totalScore >= config.passingScore,
    };

    setState('results');
    onComplete(result);
  }, [config.testCases, config.hints, config.passingScore, runTests, onComplete]);

  // Timer effect - uses refs to avoid stale closure (must be after handleSubmitWithRefs)
  useEffect(() => {
    if (state !== 'coding' || !config.timeLimitMinutes) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Use refs to get current values, avoiding stale closure
          handleSubmitWithRefs();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, config.timeLimitMinutes, handleSubmitWithRefs]);

  const handleStart = () => {
    setState('coding');
    setStartTime(Date.now());
    if (config.timeLimitMinutes) {
      setTimeRemaining(config.timeLimitMinutes * 60);
    }
  };

  const getAvailableHints = useCallback(() => {
    return (config.hints || []).filter(
      (hint) => hint.showAfterAttempts <= attempts && !hintsUsed.includes(hint.id)
    );
  }, [config.hints, attempts, hintsUsed]);

  const handleHintActivation = (hintId: string) => {
    if (!hintsUsed.includes(hintId)) {
      setHintsUsed((prev) => [...prev, hintId]);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setAttempts((prev) => prev + 1);

    // Simulate running the code
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const results = runTests(currentCode);
    setTestResults(results);
    setIsRunning(false);

    // Update console output
    const passedCount = results.filter((r) => r.passed).length;
    setConsoleOutput(
      `Ran ${results.length} tests: ${passedCount} passed, ${results.length - passedCount} failed`
    );
  };

  const handleSubmit = () => {
    const results = runTests(currentCode);
    const timeSpent = (Date.now() - startTime) / 1000;

    // Calculate total weight for normalization
    const totalWeight = config.testCases.reduce((sum, tc) => sum + tc.weight, 0);
    const normalizedWeight = totalWeight > 0 ? totalWeight : 1;

    // Calculate normalized score (0-100)
    const baseScore = results.reduce(
      (sum, r) => sum + (r.passed ? (r.weight / normalizedWeight) * 100 : 0),
      0
    );

    // Apply hint penalty
    const hintPenalty = (config.hints || [])
      .filter((h) => hintsUsed.includes(h.id))
      .reduce((sum, h) => sum + h.scorePenalty * 100, 0);

    // Clamp final score to 0-100
    const totalScore = Math.max(0, Math.min(100, baseScore - hintPenalty));

    const result: CodePlaygroundResult = {
      code: currentCode,
      testResults: results,
      totalScore,
      hintsUsed: hintsUsed.length,
      hintPenalty,
      timeSpent,
      attempts,
      completed: totalScore >= config.passingScore,
    };

    setState('results');
    onComplete(result);
  };

  const handleReset = () => {
    setCurrentCode(config.starterCode);
    setTestResults([]);
    setConsoleOutput('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageLabel = () => {
    const labels: Record<string, string> = {
      python: 'Python',
      sql: 'SQL',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
    };
    return labels[config.language] || config.language;
  };

  // Intro screen
  if (state === 'intro') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            {config.title}
          </CardTitle>
          <CardDescription>
            Interactive coding exercise in {getLanguageLabel()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert">
            <p>{config.instructions}</p>
          </div>

          {config.pvContext?.scenario && (
            <Alert>
              <FileCode className="h-4 w-4" />
              <AlertDescription>
                <strong>Scenario:</strong> {config.pvContext.scenario}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Test Cases</div>
              <div className="text-2xl font-bold">{config.testCases.length}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Passing Score</div>
              <div className="text-2xl font-bold">{config.passingScore}%</div>
            </div>
          </div>

          {config.timeLimitMinutes && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Time limit: <strong>{config.timeLimitMinutes} minutes</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleStart} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Coding
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

  // Coding screen
  if (state === 'coding') {
    const availableHints = getAvailableHints();
    const visibleTests = config.testCases.filter((t) => !t.hidden);

    return (
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="outline">{getLanguageLabel()}</Badge>
            <span className="text-sm text-muted-foreground">
              Attempts: {attempts}
            </span>
          </div>
          {config.timeLimitMinutes && (
            <div
              className={`flex items-center gap-2 font-mono text-lg ${
                timeRemaining < 60 ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Code Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">{config.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSolution(!showSolution)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showSolution ? 'Hide' : 'Show'} Solution
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] border-y">
                  <LiveCodes
                    config={{
                      script: {
                        language: config.language,
                        content: showSolution ? config.solutionCode : currentCode,
                      },
                      tools: {
                        enabled: ['console'],
                        active: 'console',
                        status: 'open',
                      },
                    }}
                    view="editor"
                    loading="eager"
                    onReady={(playground: Playground) => {
                      // Watch for code changes and update state
                      playground.watch('code', (data) => {
                        const codeData = data as { code?: { script?: { content?: string } } };
                        const newCode = codeData?.code?.script?.content;
                        if (newCode !== undefined && !showSolution) {
                          setCurrentCode(newCode);
                        }
                      });
                    }}
                  />
                </div>
                {consoleOutput && (
                  <div className="p-3 bg-muted font-mono text-sm">
                    {consoleOutput}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Instructions */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{config.instructions}</p>
                {config.pvContext?.sampleData && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {config.pvContext.sampleData}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Test Cases */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visibleTests.map((test, index) => {
                    const result = testResults.find((r) => r.testId === test.id);
                    return (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <span>
                          {index + 1}. {test.description}
                        </span>
                        {result && (
                          result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )
                        )}
                      </div>
                    );
                  })}
                  {config.testCases.some((t) => t.hidden) && (
                    <div className="text-xs text-muted-foreground italic">
                      + hidden test cases
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hints */}
            {availableHints.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Hints Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={availableHints[0]?.id}>
                    <TabsList className="w-full">
                      {availableHints.map((hint, index) => (
                        <TabsTrigger
                          key={hint.id}
                          value={hint.id}
                          onClick={() => handleHintActivation(hint.id)}
                        >
                          Hint {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {availableHints.map((hint) => (
                      <TabsContent key={hint.id} value={hint.id}>
                        <p className="text-sm">{hint.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Score penalty: -{hint.scorePenalty * 100}%
                        </p>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleRun} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={testResults.length === 0}
              >
                Submit Solution
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (state === 'results') {
    const passedTests = testResults.filter((r) => r.passed).length;
    const score = testResults.reduce(
      (sum, r) => sum + (r.passed ? r.weight * 100 : 0),
      0
    );
    const hintPenalty = (config.hints || [])
      .filter((h) => hintsUsed.includes(h.id))
      .reduce((sum, h) => sum + h.scorePenalty * 100, 0);
    const finalScore = Math.max(0, score - hintPenalty);
    const passed = finalScore >= config.passingScore;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <>
                <Trophy className="h-5 w-5 text-yellow-600" />
                Exercise Completed!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Not Quite There
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{passedTests}/{testResults.length}</div>
              <div className="text-sm text-muted-foreground">Tests Passed</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{finalScore.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{attempts}</div>
              <div className="text-sm text-muted-foreground">Attempts</div>
            </div>
          </div>

          <Progress value={finalScore} className="h-3" />

          {hintPenalty > 0 && (
            <div className="text-sm text-muted-foreground">
              Hint penalty applied: -{hintPenalty.toFixed(0)}%
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Test Results</h4>
            {testResults.map((result) => (
              <div
                key={result.testId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm">{result.description}</span>
                {result.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            ))}
          </div>

          {!passed && (
            <Alert>
              <AlertDescription>
                Score {config.passingScore}% required to pass. Review the solution and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default CodePlaygroundEngine;

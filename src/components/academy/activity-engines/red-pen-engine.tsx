'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenLine, CheckCircle2, XCircle, AlertTriangle, Eye, Target, Trophy } from 'lucide-react';
import type { RedPenConfig, RedPenError } from '@/types/pv-curriculum';

interface RedPenEngineProps {
  config: RedPenConfig;
  onComplete: (result: RedPenResult) => void;
  onCancel?: () => void;
}

export interface RedPenResult {
  foundErrors: FoundError[];
  missedErrors: RedPenError[];
  falsePositives: number;
  score: number;
  totalTimeSpent: number;
  completed: boolean;
}

interface FoundError {
  errorId: string;
  identifiedType: string;
  identifiedSeverity: string;
  isCorrectType: boolean;
  isCorrectSeverity: boolean;
}

interface Selection {
  text: string;
  startIndex: number;
  endIndex: number;
}

type EngineState = 'intro' | 'review' | 'identify' | 'results';

export function RedPenEngine({ config, onComplete, onCancel }: RedPenEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  const [startTime] = useState<number>(Date.now());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [foundErrors, setFoundErrors] = useState<FoundError[]>([]);
  const [falsePositives, setFalsePositives] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [showHint, setShowHint] = useState(false);

  const errorTypes = [
    { value: 'factual', label: 'Factual Error' },
    { value: 'procedural', label: 'Procedural Error' },
    { value: 'regulatory', label: 'Regulatory Violation' },
    { value: 'terminology', label: 'Terminology Error' },
    { value: 'completeness', label: 'Incomplete Information' },
    { value: 'formatting', label: 'Formatting Issue' },
  ];

  const severityLevels = [
    { value: 'critical', label: 'Critical' },
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
  ];

  // Find matching error for a selection
  const findMatchingError = (sel: Selection): RedPenError | null => {
    return config.errors.find((error) => {
      const errorInContent = config.documentContent.includes(error.location);
      if (!errorInContent) return false;

      // Check if selected text overlaps with error location
      const errorStart = config.documentContent.indexOf(error.location);
      const errorEnd = errorStart + error.location.length;

      return (
        (sel.startIndex >= errorStart && sel.startIndex < errorEnd) ||
        (sel.endIndex > errorStart && sel.endIndex <= errorEnd) ||
        (sel.startIndex <= errorStart && sel.endIndex >= errorEnd)
      );
    }) || null;
  };

  // Get unfound errors
  const unfoundErrors = useMemo(() => {
    const foundIds = foundErrors.map((f) => f.errorId);
    return config.errors.filter((e) => !foundIds.includes(e.id));
  }, [config.errors, foundErrors]);

  /**
   * Find all occurrences of a substring in a string
   */
  const findAllOccurrences = (text: string, substring: string): number[] => {
    const indices: number[] = [];
    let idx = text.indexOf(substring);
    while (idx !== -1) {
      indices.push(idx);
      idx = text.indexOf(substring, idx + 1);
    }
    return indices;
  };

  /**
   * For a given selection text, find the best matching occurrence
   * by checking which one overlaps with an unfound error
   */
  const findBestMatchingIndex = (selectedText: string): number => {
    const occurrences = findAllOccurrences(config.documentContent, selectedText);

    if (occurrences.length === 0) return -1;
    if (occurrences.length === 1) return occurrences[0];

    // Check each occurrence to see if it matches an unfound error
    const foundIds = foundErrors.map((f) => f.errorId);
    for (const startIdx of occurrences) {
      const endIdx = startIdx + selectedText.length;

      // Check if this occurrence overlaps with an unfound error
      const matchingError = config.errors.find((error) => {
        if (foundIds.includes(error.id)) return false; // Already found

        const errorInContent = config.documentContent.includes(error.location);
        if (!errorInContent) return false;

        const errorStart = config.documentContent.indexOf(error.location);
        const errorEnd = errorStart + error.location.length;

        // Check overlap
        return (
          (startIdx >= errorStart && startIdx < errorEnd) ||
          (endIdx > errorStart && endIdx <= errorEnd) ||
          (startIdx <= errorStart && endIdx >= errorEnd)
        );
      });

      if (matchingError) {
        return startIdx; // Found an occurrence that matches an unfound error
      }
    }

    // Default to first occurrence if no unfound error matches
    return occurrences[0];
  };

  const handleTextSelection = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelection(null);
      return;
    }

    const range = window.getSelection()?.getRangeAt(0);
    if (!range) return;

    // Find the best matching occurrence (handles repeated text correctly)
    const startIndex = findBestMatchingIndex(selectedText);
    if (startIndex === -1) {
      setSelection(null);
      return;
    }

    setSelection({
      text: selectedText,
      startIndex,
      endIndex: startIndex + selectedText.length,
    });
    setState('identify');
  };

  const handleSubmitError = () => {
    if (!selection || !selectedType || !selectedSeverity) return;

    const matchingError = findMatchingError(selection);

    if (matchingError) {
      // Check if already found
      if (foundErrors.find((f) => f.errorId === matchingError.id)) {
        // Already found this one
        setSelection(null);
        setSelectedType('');
        setSelectedSeverity('');
        setState('review');
        return;
      }

      const found: FoundError = {
        errorId: matchingError.id,
        identifiedType: selectedType,
        identifiedSeverity: selectedSeverity,
        isCorrectType: selectedType === matchingError.errorType,
        isCorrectSeverity: selectedSeverity === matchingError.severity,
      };

      setFoundErrors((prev) => [...prev, found]);
    } else {
      // False positive
      setFalsePositives((prev) => prev + 1);
    }

    setSelection(null);
    setSelectedType('');
    setSelectedSeverity('');
    setState('review');
  };

  const handleComplete = () => {
    const timeSpent = (Date.now() - startTime) / 1000;

    // Calculate score
    const totalErrors = config.errors.length;
    const foundCount = foundErrors.length;
    const correctTypeCount = foundErrors.filter((f) => f.isCorrectType).length;
    const correctSeverityCount = foundErrors.filter((f) => f.isCorrectSeverity).length;

    // Base score: percentage of errors found (guard against division by zero)
    const foundScore = totalErrors > 0 ? (foundCount / totalErrors) * 50 : 0;

    // Type accuracy bonus
    const typeBonus = foundCount > 0 ? (correctTypeCount / foundCount) * 25 : 0;

    // Severity accuracy bonus
    const severityBonus = foundCount > 0 ? (correctSeverityCount / foundCount) * 25 : 0;

    // Penalty for false positives
    const penalty = Math.min(falsePositives * 5, 20);

    const score = Math.max(0, foundScore + typeBonus + severityBonus - penalty);

    const result: RedPenResult = {
      foundErrors,
      missedErrors: unfoundErrors,
      falsePositives,
      score,
      totalTimeSpent: timeSpent,
      completed: true,
    };

    setState('results');
    onComplete(result);
  };

  // Intro screen
  if (state === 'intro') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-red-600" />
            Red Pen Activity
          </CardTitle>
          <CardDescription>
            Review the document and identify all errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              Your task is to find <strong>{config.errors.length} errors</strong> in this{' '}
              <strong>{config.documentType.replace('_', ' ')}</strong>.
              Select text to mark errors, then classify each by type and severity.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Instructions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Read the document carefully</li>
              <li>Select text that contains an error</li>
              <li>Classify the error type and severity</li>
              <li>Repeat until you've found all errors</li>
              <li>Click "Complete Review" when finished</li>
            </ol>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Passing Score: {config.passingScore}%</h4>
            <p className="text-sm text-muted-foreground">
              Find at least {Math.ceil((config.passingScore / 100) * config.errors.length)} errors to pass.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setState('review')} className="flex-1">
              Begin Review
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

  // Review/document screen
  if (state === 'review') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="capitalize">
              {config.documentType.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Found: {foundErrors.length}/{config.errors.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={(foundErrors.length / config.errors.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {showHint && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Hint: Look for {unfoundErrors[0]?.errorType} errors
              </AlertDescription>
            </Alert>
          )}

          <div
            className="prose prose-sm max-w-none p-4 border rounded-lg bg-white cursor-text select-text"
            onMouseUp={handleTextSelection}
          >
            {config.documentContent.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Select text to identify errors
            </span>
            <Button onClick={handleComplete}>
              Complete Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Identify error screen
  if (state === 'identify') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Classify Error</CardTitle>
          <CardDescription>
            Identify the type and severity of the selected error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <strong>Selected text:</strong>
            <p className="mt-1 italic">"{selection?.text}"</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Error Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select error type" />
                </SelectTrigger>
                <SelectContent>
                  {errorTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitError}
              disabled={!selectedType || !selectedSeverity}
              className="flex-1"
            >
              Mark Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelection(null);
                setState('review');
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (state === 'results') {
    const correctTypes = foundErrors.filter((f) => f.isCorrectType).length;
    const correctSeverities = foundErrors.filter((f) => f.isCorrectSeverity).length;
    const score = Math.round(
      Math.max(
        0,
        (config.errors.length > 0 ? (foundErrors.length / config.errors.length) * 50 : 0) +
        (foundErrors.length > 0 ? (correctTypes / foundErrors.length) * 25 : 0) +
        (foundErrors.length > 0 ? (correctSeverities / foundErrors.length) * 25 : 0) -
        Math.min(falsePositives * 5, 20)
      )
    );

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Review Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{foundErrors.length}/{config.errors.length}</div>
              <div className="text-sm text-muted-foreground">Errors Found</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{correctTypes}/{foundErrors.length}</div>
              <div className="text-sm text-muted-foreground">Correct Types</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{score}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>

          {falsePositives > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {falsePositives} false positive(s) - marked text that wasn't an error
              </AlertDescription>
            </Alert>
          )}

          {unfoundErrors.length > 0 && config.feedbackOnMiss && (
            <div className="space-y-2">
              <h4 className="font-semibold">Missed Errors:</h4>
              {unfoundErrors.map((error) => (
                <div key={error.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="outline">{error.errorType}</Badge>
                    <Badge variant={error.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {error.severity}
                    </Badge>
                  </div>
                  <p className="text-sm italic">"{error.location}"</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {foundErrors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Found Errors:</h4>
              {foundErrors.map((found) => {
                const original = config.errors.find((e) => e.id === found.errorId);
                return (
                  <div key={found.errorId} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {found.isCorrectType ? '✓' : '✗'} Type: {found.identifiedType}
                        {!found.isCorrectType && original && ` (was ${original.errorType})`}
                      </span>
                      <span className="text-sm">
                        {found.isCorrectSeverity ? '✓' : '✗'} Severity: {found.identifiedSeverity}
                        {!found.isCorrectSeverity && original && ` (was ${original.severity})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default RedPenEngine;

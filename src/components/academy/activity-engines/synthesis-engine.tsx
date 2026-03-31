'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  FileText,
  AlertTriangle,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import type { SynthesisConfig, AIEvaluation } from '@/types/pv-curriculum';
import { evaluateSynthesis } from '@/lib/ai/flows/evaluate-synthesis';

interface SynthesisEngineProps {
  config: SynthesisConfig;
  onComplete: (result: SynthesisResult) => void;
  onCancel?: () => void;
}

export interface SynthesisResult {
  userResponse: string;
  evaluation: AIEvaluation;
  totalTimeSpent: number;
  completed: boolean;
}

type EngineState = 'intro' | 'compose' | 'evaluating' | 'results';

export function SynthesisEngine({ config, onComplete, onCancel }: SynthesisEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  const [startTime] = useState<number>(Date.now());
  const [userResponse, setUserResponse] = useState('');
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const characterCount = userResponse.length;
  const isOverLimit = Boolean(config.maxLength && characterCount > config.maxLength);
  const requiredConstraints = config.constraints.filter((c) => c.required);

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;

    setState('evaluating');
    setError(null);

    try {
      const result = await evaluateSynthesis(userResponse, config);
      setEvaluation(result);

      const timeSpent = (Date.now() - startTime) / 1000;
      const synthResult: SynthesisResult = {
        userResponse,
        evaluation: result,
        totalTimeSpent: timeSpent,
        completed: true,
      };

      setState('results');
      onComplete(synthResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
      setState('compose');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Intro screen
  if (state === 'intro') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Synthesis Activity
          </CardTitle>
          <CardDescription>
            Create and receive AI-powered feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm">
            <h4>Your Task</h4>
            <p>{config.prompt}</p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Output Format: {config.outputFormat}</h4>
            {config.exampleOutput && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  View example output
                </summary>
                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                  {config.exampleOutput}
                </pre>
              </details>
            )}
          </div>

          {config.constraints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Constraints</h4>
              <ul className="space-y-1 text-sm">
                {config.constraints.map((constraint, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Badge variant={constraint.required ? 'default' : 'outline'} className="mt-0.5">
                      {constraint.required ? 'Required' : 'Optional'}
                    </Badge>
                    <span>
                      <strong className="capitalize">{constraint.type}:</strong> {constraint.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Evaluation Criteria</h4>
            <ul className="space-y-1 text-sm">
              {config.evaluationCriteria.map((criterion, idx) => (
                <li key={idx}>
                  <strong>{criterion.name}</strong> ({(criterion.weight * 100).toFixed(0)}%):{' '}
                  {criterion.description}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setState('compose')} className="flex-1">
              Begin Synthesis
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

  // Compose screen
  if (state === 'compose') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="capitalize">
              {config.outputFormat}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {characterCount}
              {config.maxLength && ` / ${config.maxLength}`} characters
            </div>
          </div>
          {config.maxLength && config.maxLength > 0 && (
            <Progress
              value={(characterCount / config.maxLength) * 100}
              className={isOverLimit ? 'bg-red-100' : ''}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="prose prose-sm mb-2">
            <p className="text-muted-foreground">{config.prompt}</p>
          </div>

          {requiredConstraints.length > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              <strong>Remember:</strong>{' '}
              {requiredConstraints.map((c) => c.description).join(', ')}
            </div>
          )}

          <Textarea
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Enter your response here..."
            className={`min-h-[300px] ${isOverLimit ? 'border-red-500' : ''}`}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setState('intro')}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!userResponse.trim() || isOverLimit}
            >
              <FileText className="h-4 w-4 mr-2" />
              Submit for Evaluation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Evaluating screen
  if (state === 'evaluating') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <VoiceLoading
            context="academy"
            variant="spinner"
            message="Evaluating your response..."
          />
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (state === 'results' && evaluation) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Evaluation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-muted rounded-lg">
            <div className={`text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
              {evaluation.overallScore}%
            </div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>

          <Tabs defaultValue="scores">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="space-y-3">
              {evaluation.criteriaScores.map((criterion, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{criterion.criterion}</span>
                    <span className={`font-bold ${getScoreColor(criterion.score)}`}>
                      {criterion.score}%
                    </span>
                  </div>
                  <Progress value={criterion.score} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{criterion.feedback}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="strengths" className="space-y-2">
              {evaluation.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="improvements" className="space-y-2">
              {evaluation.improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span className="text-sm">{improvement}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              View your submission
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
              {userResponse}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default SynthesisEngine;

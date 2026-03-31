'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import type { Scenario } from '../scenario-data';

interface CreativeStepProps {
  scenario: Scenario;
  response: string;
  onResponseChange: (response: string) => void;
  aiFeedback: string | null;
  onRequestFeedback: () => Promise<void>;
  isLoadingFeedback: boolean;
}

export function CreativeStep({
  scenario,
  response,
  onResponseChange,
  aiFeedback,
  onRequestFeedback,
  isLoadingFeedback
}: CreativeStepProps) {
  const { creative } = scenario;
  const [showSuggestions, setShowSuggestions] = useState(false);

  const hasMinimumResponse = response.trim().length >= 50;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold font-headline text-foreground">
          Step 4: Think Creatively
        </h2>
        <p className="text-muted-foreground mt-2">
          {creative.prompt}
        </p>
      </div>

      {/* Response Input */}
      <Card className="p-6 bg-nex-surface border-nex-border">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Your Approach</h3>
        </div>

        <textarea
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Describe additional analyses or data sources you would leverage..."
          className="w-full h-40 p-4 bg-nex-dark border border-nex-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs ${hasMinimumResponse ? 'text-green-500' : 'text-muted-foreground'}`}>
            {response.trim().length} characters {hasMinimumResponse ? '(ready for feedback)' : '(minimum 50)'}
          </span>

          <Button
            onClick={onRequestFeedback}
            disabled={!hasMinimumResponse || isLoadingFeedback}
            size="sm"
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            {isLoadingFeedback ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : aiFeedback ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Refresh Feedback
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Feedback
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* AI Feedback */}
      {aiFeedback && (
        <Card className="p-6 bg-gradient-to-br from-cyan/10 to-purple-500/10 border-cyan/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-cyan" />
            <h3 className="font-semibold text-foreground">AI Feedback</h3>
            <Badge variant="outline" className="text-xs">Gemini-Powered</Badge>
          </div>
          <p className="text-sm text-foreground whitespace-pre-line">
            {aiFeedback}
          </p>
        </Card>
      )}

      {/* Suggested Approaches (Toggle) */}
      <Card className="p-5 bg-nex-surface border-nex-border">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">
              Need inspiration? View suggested approaches
            </h3>
          </div>
          <span className="text-sm text-cyan">
            {showSuggestions ? 'Hide' : 'Show'}
          </span>
        </button>

        {showSuggestions && (
          <div className="mt-4 pt-4 border-t border-nex-border">
            <ul className="space-y-2">
              {creative.suggestedApproaches.map((approach, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-cyan font-bold mt-0.5">•</span>
                  <span className="text-muted-foreground">{approach}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Expert Insight */}
      <Card className="p-5 bg-nex-dark border-gold/30">
        <h4 className="font-semibold text-gold mb-2">Expert Insight</h4>
        <p className="text-sm text-muted-foreground">
          {creative.expertInsight}
        </p>
      </Card>
    </div>
  );
}

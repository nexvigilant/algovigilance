'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Award, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2 } from 'lucide-react';
import { NECS_DIMENSIONS, STEP_INSTRUCTIONS } from '../value-proposition-data';

interface CredibilityStepProps {
  responses: Record<string, string>;
  onUpdate: (responses: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CredibilityStep({ responses, onUpdate, onNext, onBack }: CredibilityStepProps) {
  const dimension = NECS_DIMENSIONS.find(d => d.id === 'credibility') ?? NECS_DIMENSIONS[0];
  const instructions = STEP_INSTRUCTIONS.credibility;
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const handleResponseChange = (promptId: string, value: string) => {
    onUpdate({
      ...responses,
      [promptId]: value
    });
  };

  const completedCount = dimension.prompts.filter(p =>
    responses[p.id] && responses[p.id].trim().length >= 30
  ).length;

  const canProceed = completedCount >= 2; // At least 2 credibility areas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gold/10 rounded-xl">
          <Award className="h-8 w-8 text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{dimension.title}</h2>
          <p className="text-muted-foreground mt-1">{dimension.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-gold border-gold">
          {completedCount}/{dimension.prompts.length} Areas
        </Badge>
      </div>

      {/* Description */}
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{dimension.description}</p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gold/5 border-gold/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gold" />
            {instructions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {instructions.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gold">•</span>
                {instruction}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-4">
        <p className="text-sm font-semibold text-gold mb-1">Key Insight</p>
        <p className="text-sm text-muted-foreground">
          &ldquo;Value must be demonstrated, not just claimed.&rdquo; Every credibility statement
          should be something that can be validated by others. If it can&apos;t be verified,
          it weakens your proposition.
        </p>
      </div>

      {/* Prompts */}
      <div className="space-y-4">
        {dimension.prompts.map((prompt) => {
          const response = responses[prompt.id] || '';
          const isComplete = response.trim().length >= 30;
          const isActive = activePrompt === prompt.id;

          return (
            <Card
              key={prompt.id}
              className={`transition-all duration-200 ${
                isActive ? 'border-gold shadow-md' : 'border-nex-border'
              } ${isComplete ? 'bg-green-500/5' : 'bg-nex-surface'}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">
                    {prompt.question}
                  </CardTitle>
                  {isComplete && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {prompt.helpText}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor={prompt.id} className="sr-only">
                    {prompt.question}
                  </Label>
                  <Textarea
                    id={prompt.id}
                    placeholder={prompt.placeholder}
                    value={response}
                    onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                    onFocus={() => setActivePrompt(prompt.id)}
                    onBlur={() => setActivePrompt(null)}
                    className="min-h-[100px] resize-none bg-nex-dark border-nex-border focus:border-gold"
                    rows={4}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{response.length} characters</span>
                    <span>{isComplete ? 'Complete' : 'Min. 30 characters'}</span>
                  </div>
                </div>

                {/* Examples */}
                {isActive && (
                  <div className="bg-nex-dark/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Examples:</p>
                    {prompt.examples.map((example, i) => (
                      <p key={i} className="text-xs text-muted-foreground italic">
                        &ldquo;{example}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Note */}
      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Complete at least 2 credibility areas to continue (min. 30 characters each)
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Expertise
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gold text-nex-deep hover:bg-gold-bright"
        >
          Continue to Support
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

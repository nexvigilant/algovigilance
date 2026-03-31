'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { HandHelping, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2 } from 'lucide-react';
import { NECS_DIMENSIONS, STEP_INSTRUCTIONS } from '../value-proposition-data';

interface SupportStepProps {
  responses: Record<string, string>;
  onUpdate: (responses: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SupportStep({ responses, onUpdate, onNext, onBack }: SupportStepProps) {
  const dimension = NECS_DIMENSIONS.find(d => d.id === 'support') ?? NECS_DIMENSIONS[0];
  const instructions = STEP_INSTRUCTIONS.support;
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const handleResponseChange = (promptId: string, value: string) => {
    onUpdate({
      ...responses,
      [promptId]: value
    });
  };

  const completedCount = dimension.prompts.filter(p =>
    responses[p.id] && responses[p.id].trim().length >= 20
  ).length;

  const canProceed = completedCount >= 2; // At least 2 support areas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-500/10 rounded-xl">
          <HandHelping className="h-8 w-8 text-green-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{dimension.title}</h2>
          <p className="text-muted-foreground mt-1">{dimension.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400">
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
      <Card className="bg-green-500/5 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-green-400" />
            {instructions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {instructions.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                {instruction}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Advisory vs Operational Insight */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-nex-surface border border-nex-border rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Advisory Support</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Strategic guidance and direction</li>
            <li>• Expert perspective on decisions</li>
            <li>• Network introductions</li>
            <li>• Crisis navigation experience</li>
          </ul>
        </div>
        <div className="bg-nex-surface border border-nex-border rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Operational Support</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Hands-on implementation</li>
            <li>• Day-to-day problem solving</li>
            <li>• Training and development</li>
            <li>• Process optimization</li>
          </ul>
        </div>
      </div>

      {/* Prompts */}
      <div className="space-y-4">
        {dimension.prompts.map((prompt) => {
          const response = responses[prompt.id] || '';
          const isComplete = response.trim().length >= 20;
          const isActive = activePrompt === prompt.id;

          return (
            <Card
              key={prompt.id}
              className={`transition-all duration-200 ${
                isActive ? 'border-green-400 shadow-md' : 'border-nex-border'
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
                    className="min-h-[100px] resize-none bg-nex-dark border-nex-border focus:border-green-400"
                    rows={4}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{response.length} characters</span>
                    <span>{isComplete ? 'Complete' : 'Min. 20 characters'}</span>
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
          Complete at least 2 support areas to continue
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
          Back to Credibility
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-green-500 text-white hover:bg-green-400"
        >
          Generate Value Proposition
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

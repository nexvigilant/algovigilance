'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2, Target } from 'lucide-react';
import { NAVIGATOR_SECTIONS, STEP_INSTRUCTIONS } from '../hidden-job-market-data';

interface VisibilityStepProps {
  responses: Record<string, string>;
  onUpdate: (responses: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VisibilityStep({ responses, onUpdate, onNext, onBack }: VisibilityStepProps) {
  const section = NAVIGATOR_SECTIONS.find(s => s.id === 'visibility') ?? NAVIGATOR_SECTIONS[0];
  const instructions = STEP_INSTRUCTIONS.visibility;
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const handleResponseChange = (promptId: string, value: string) => {
    onUpdate({
      ...responses,
      [promptId]: value
    });
  };

  const completedCount = section.prompts.filter(p =>
    responses[p.id] && responses[p.id].trim().length >= 30
  ).length;

  const canProceed = completedCount >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <Eye className="h-8 w-8 text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
          <p className="text-muted-foreground mt-1">{section.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-purple-400 border-purple-400">
          {completedCount}/{section.prompts.length} Areas
        </Badge>
      </div>

      {/* Description */}
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{section.description}</p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-purple-400" />
            {instructions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {instructions.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                {instruction}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-cyan/5 border-cyan/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-cyan">
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {section.keyInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-cyan font-semibold">{i + 1}.</span>
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Prompts */}
      <div className="space-y-4">
        {section.prompts.map((prompt) => {
          const response = responses[prompt.id] || '';
          const isComplete = response.trim().length >= 30;
          const isActive = activePrompt === prompt.id;

          return (
            <Card
              key={prompt.id}
              className={`transition-all duration-200 ${
                isActive ? 'border-purple-400 shadow-md' : 'border-nex-border'
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
                    className="min-h-[100px] resize-none bg-nex-dark border-nex-border focus:border-purple-400"
                    rows={4}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{response.length} characters</span>
                    <span>{isComplete ? 'Complete' : 'Min. 30 characters'}</span>
                  </div>
                </div>

                {/* PV Context */}
                {prompt.pvContext && (
                  <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-gold">PV Context: </span>
                      {prompt.pvContext}
                    </p>
                  </div>
                )}

                {/* Action Items when active */}
                {isActive && (
                  <div className="bg-nex-dark/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3 text-purple-400" />
                      Action Items:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {prompt.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
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
          Complete at least 2 areas to continue
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
          Back to Network Mapping
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-purple-500 text-white hover:bg-purple-600"
        >
          Continue to Relationships
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, ChevronRight, Lightbulb, CheckCircle2, ExternalLink } from 'lucide-react';
import { RESEARCH_AREAS, STEP_INSTRUCTIONS } from '../due-diligence-data';

interface EcosystemStepProps {
  responses: Record<string, string>;
  onUpdate: (responses: Record<string, string>) => void;
  onNext: () => void;
}

export function EcosystemStep({ responses, onUpdate, onNext }: EcosystemStepProps) {
  const area = RESEARCH_AREAS.find(a => a.id === 'ecosystem') ?? RESEARCH_AREAS[0];
  const instructions = STEP_INSTRUCTIONS.ecosystem;
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const handleResponseChange = (promptId: string, value: string) => {
    onUpdate({
      ...responses,
      [promptId]: value
    });
  };

  const completedCount = area.prompts.filter(p =>
    responses[p.id] && responses[p.id].trim().length >= 30
  ).length;

  const canProceed = completedCount >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-cyan/10 rounded-xl">
          <Globe className="h-8 w-8 text-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{area.title}</h2>
          <p className="text-muted-foreground mt-1">{area.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-cyan border-cyan">
          {completedCount}/{area.prompts.length} Areas
        </Badge>
      </div>

      {/* Description */}
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{area.description}</p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-cyan/5 border-cyan/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-cyan" />
            {instructions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {instructions.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-cyan">•</span>
                {instruction}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Questions to Answer */}
      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-purple-400">
            Key Questions to Answer
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            {area.keyQuestions.map((question, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-400 font-semibold">{i + 1}.</span>
                {question}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Research Prompts */}
      <div className="space-y-4">
        {area.prompts.map((prompt) => {
          const response = responses[prompt.id] || '';
          const isComplete = response.trim().length >= 30;
          const isActive = activePrompt === prompt.id;

          return (
            <Card
              key={prompt.id}
              className={`transition-all duration-200 ${
                isActive ? 'border-cyan shadow-md' : 'border-nex-border'
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
                    className="min-h-[100px] resize-none bg-nex-dark border-nex-border focus:border-cyan"
                    rows={4}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{response.length} characters</span>
                    <span>{isComplete ? 'Complete' : 'Min. 30 characters'}</span>
                  </div>
                </div>

                {/* PV-Specific Guidance */}
                {prompt.pvSpecificGuidance && (
                  <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-gold">PV Insight: </span>
                      {prompt.pvSpecificGuidance}
                    </p>
                  </div>
                )}

                {/* Sources when active */}
                {isActive && (
                  <div className="bg-nex-dark/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Where to Research:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {prompt.sources.map((source, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 text-cyan" />
                          {source}
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
          Complete at least 2 research areas to continue
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Continue to Company Research
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

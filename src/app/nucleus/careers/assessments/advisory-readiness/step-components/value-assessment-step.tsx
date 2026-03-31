'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronRight, Info } from 'lucide-react';
import { ASSESSMENT_DIMENSIONS } from '../advisory-readiness-data';

interface ValueAssessmentStepProps {
  responses: Record<string, number>;
  onUpdate: (responses: Record<string, number>) => void;
  onNext: () => void;
}

const dimension = ASSESSMENT_DIMENSIONS.find(d => d.id === 'value-proposition') ?? ASSESSMENT_DIMENSIONS[0];

export function ValueAssessmentStep({ responses, onUpdate, onNext }: ValueAssessmentStepProps) {
  const handleScoreChange = (promptId: string, score: number) => {
    onUpdate({
      ...responses,
      [promptId]: score
    });
  };

  const completedCount = Object.values(responses).filter(v => v > 0).length;
  const canProceed = completedCount >= 3; // Require at least 3 of 4 answered

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-cyan/20 rounded-xl">
          <Zap className="h-8 w-8 text-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{dimension.title}</h2>
          <p className="text-muted-foreground mt-1">{dimension.description}</p>
        </div>
      </div>

      {/* NECS Context */}
      <Card className="bg-cyan/5 border-cyan/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">NECS Framework Reminder</p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>N</strong>iche + <strong>E</strong>vidence + <strong>C</strong>redibility + <strong>S</strong>tory =
                Your professional value proposition. Strong advisory candidates have clarity across all four elements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Questions */}
      <div className="space-y-6">
        {dimension.prompts.map((prompt) => (
          <Card key={prompt.id} className="bg-nex-surface border-nex-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{prompt.label}</CardTitle>
                {responses[prompt.id] > 0 && (
                  <Badge
                    variant="outline"
                    className={
                      responses[prompt.id] === 3
                        ? 'border-green-500 text-green-500'
                        : responses[prompt.id] === 2
                        ? 'border-gold text-gold'
                        : 'border-muted-foreground text-muted-foreground'
                    }
                  >
                    {responses[prompt.id] === 3 ? 'Strong' : responses[prompt.id] === 2 ? 'Developing' : 'Building'}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {prompt.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Guidance */}
              <p className="text-xs text-muted-foreground bg-nex-dark p-3 rounded-lg">
                <strong>Consider:</strong> {prompt.guidance}
              </p>

              {/* Rating Scale */}
              <RadioGroup
                value={responses[prompt.id]?.toString() || ''}
                onValueChange={(value) => handleScoreChange(prompt.id, parseInt(value))}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border border-nex-border hover:border-cyan/30 transition-colors">
                  <RadioGroupItem value="1" id={`${prompt.id}-1`} className="mt-1" />
                  <Label htmlFor={`${prompt.id}-1`} className="flex-1 cursor-pointer">
                    <span className="font-medium text-foreground">Building (1)</span>
                    <p className="text-xs text-muted-foreground mt-1">{prompt.scoringCriteria.low}</p>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-nex-border hover:border-cyan/30 transition-colors">
                  <RadioGroupItem value="2" id={`${prompt.id}-2`} className="mt-1" />
                  <Label htmlFor={`${prompt.id}-2`} className="flex-1 cursor-pointer">
                    <span className="font-medium text-foreground">Developing (2)</span>
                    <p className="text-xs text-muted-foreground mt-1">{prompt.scoringCriteria.medium}</p>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-nex-border hover:border-cyan/30 transition-colors">
                  <RadioGroupItem value="3" id={`${prompt.id}-3`} className="mt-1" />
                  <Label htmlFor={`${prompt.id}-3`} className="flex-1 cursor-pointer">
                    <span className="font-medium text-foreground">Strong (3)</span>
                    <p className="text-xs text-muted-foreground mt-1">{prompt.scoringCriteria.high}</p>
                  </Label>
                </div>
              </RadioGroup>

              {/* PV Context */}
              {prompt.pvContext && (
                <p className="text-xs text-cyan/80 italic">
                  PV Examples: {prompt.pvContext}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <p className="text-sm text-muted-foreground">
          {completedCount}/{dimension.prompts.length} questions answered
        </p>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Continue to Experience
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {!canProceed && (
        <p className="text-xs text-muted-foreground text-center">
          Answer at least 3 questions to continue
        </p>
      )}
    </div>
  );
}

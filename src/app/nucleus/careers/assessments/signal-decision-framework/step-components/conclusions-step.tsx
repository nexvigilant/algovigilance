'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, ArrowUpRight, FileText } from 'lucide-react';
import type { Scenario } from '../scenario-data';

interface ConclusionsStepProps {
  scenario: Scenario;
  selectedRecommendation: string | null;
  onRecommendationChange: (recommendationId: string) => void;
  justification: string;
  onJustificationChange: (justification: string) => void;
}

export function ConclusionsStep({
  scenario,
  selectedRecommendation,
  onRecommendationChange,
  justification,
  onJustificationChange
}: ConclusionsStepProps) {
  const { conclusions } = scenario;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold font-headline text-foreground">
          Step 5: Reach Your Conclusion
        </h2>
        <p className="text-muted-foreground mt-2">
          {conclusions.prompt}
        </p>
      </div>

      {/* Recommendation Options */}
      <div className="space-y-3">
        {conclusions.recommendationOptions.map((option) => {
          const isSelected = selectedRecommendation === option.id;

          return (
            <Card
              key={option.id}
              onClick={() => onRecommendationChange(option.id)}
              className={`p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan/10 border-cyan'
                  : 'hover:border-cyan/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-cyan" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-foreground">{option.action}</h4>
                    {option.isOptimal && (
                      <Badge className="bg-green-500 text-white text-xs">
                        Optimal
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Timeline</span>
                        <p className="text-sm text-foreground">{option.timeline}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Escalation</span>
                        <p className="text-sm text-foreground">{option.escalation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Justification Input */}
      {selectedRecommendation && (
        <Card className="p-6 bg-nex-surface border-nex-border">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-cyan" />
            <h3 className="font-semibold">Justify Your Recommendation</h3>
          </div>

          <textarea
            value={justification}
            onChange={(e) => onJustificationChange(e.target.value)}
            placeholder="Explain why you chose this recommendation. What factors influenced your decision? How would you communicate this to the Safety Committee?"
            className="w-full h-32 p-4 bg-nex-dark border border-nex-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan resize-none"
          />

          <p className="text-xs text-muted-foreground mt-2">
            A strong justification references signal strength, clinical context, regulatory requirements, and stakeholder impact.
          </p>
        </Card>
      )}

      {/* Expert Guidance */}
      <Card className="p-5 bg-nex-dark border-gold/30">
        <h4 className="font-semibold text-gold mb-2">Expert Guidance</h4>
        <p className="text-sm text-muted-foreground">
          {conclusions.expertGuidance}
        </p>
      </Card>

      {/* Regulatory Context */}
      <Card className="p-5 bg-cyan/5 border-cyan/20">
        <h4 className="font-semibold text-cyan mb-2">Regulatory Context</h4>
        <p className="text-sm text-muted-foreground">
          {conclusions.regulatoryContext}
        </p>
      </Card>
    </div>
  );
}

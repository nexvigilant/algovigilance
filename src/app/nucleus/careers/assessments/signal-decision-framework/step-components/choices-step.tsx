'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Info } from 'lucide-react';
import type { Scenario } from '../scenario-data';

interface ChoicesStepProps {
  scenario: Scenario;
  selectedChoices: string[];
  onChoicesChange: (choices: string[]) => void;
}

export function ChoicesStep({ scenario, selectedChoices, onChoicesChange }: ChoicesStepProps) {
  const { choices } = scenario;
  const [showRationale, setShowRationale] = useState<string | null>(null);

  const toggleChoice = (choiceId: string) => {
    if (selectedChoices.includes(choiceId)) {
      onChoicesChange(selectedChoices.filter(id => id !== choiceId));
    } else if (selectedChoices.length < choices.maxSelections) {
      onChoicesChange([...selectedChoices, choiceId]);
    }
  };

  const isValidSelection = selectedChoices.length >= choices.minSelections &&
                           selectedChoices.length <= choices.maxSelections;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold font-headline text-foreground">
          Step 2: Evaluate Your Choices
        </h2>
        <p className="text-muted-foreground mt-2">
          {choices.prompt}
        </p>
      </div>

      {/* Selection Counter */}
      <div className="flex items-center justify-between p-4 bg-nex-surface rounded-lg border border-nex-border">
        <div className="flex items-center gap-2">
          <Badge variant={isValidSelection ? 'default' : 'outline'} className={isValidSelection ? 'bg-cyan' : ''}>
            {selectedChoices.length} selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            (Select {choices.minSelections}-{choices.maxSelections} options)
          </span>
        </div>
        {isValidSelection && (
          <span className="text-sm text-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Valid selection
          </span>
        )}
      </div>

      {/* Choice Options */}
      <div className="space-y-3">
        {choices.options.map((option) => {
          const isSelected = selectedChoices.includes(option.id);
          const isDisabled = !isSelected && selectedChoices.length >= choices.maxSelections;

          return (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan/10 border-cyan'
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-cyan/50'
              }`}
              onClick={() => !isDisabled && toggleChoice(option.id)}
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
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{option.label}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRationale(showRationale === option.id ? null : option.id);
                      }}
                      className="text-muted-foreground hover:text-cyan"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>

                  {/* Rationale (shown on toggle) */}
                  {showRationale === option.id && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Expert Rationale: </span>
                        {option.rationale}
                      </p>
                      {option.isRecommended && (
                        <Badge variant="outline" className="mt-2 text-green-500 border-green-500">
                          Recommended Approach
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Feedback Preview (shown after minimum selections) */}
      {isValidSelection && (
        <Card className="p-4 bg-cyan/5 border-cyan/20">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-cyan mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-foreground">Selection Insight</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {choices.feedbackOnComplete}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

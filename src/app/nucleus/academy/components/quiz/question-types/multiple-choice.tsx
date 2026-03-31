'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MultipleChoiceProps {
  options: readonly string[];
  currentAnswer: number | null;
  onAnswer: (answer: number) => void;
}

export function MultipleChoice({ options, currentAnswer, onAnswer }: MultipleChoiceProps) {
  return (
    <RadioGroup
      value={currentAnswer?.toString()}
      onValueChange={(value) => onAnswer(parseInt(value))}
    >
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}

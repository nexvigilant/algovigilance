'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MultipleSelectProps {
  options: readonly string[];
  currentAnswers: number[];
  onAnswer: (answers: number[]) => void;
}

export function MultipleSelect({ options, currentAnswers, onAnswer }: MultipleSelectProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
      {options.map((option, index) => {
        const isChecked = currentAnswers.includes(index);

        return (
          <div
            key={index}
            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={`option-${index}`}
              checked={isChecked}
              onCheckedChange={(checked) => {
                const newAnswers = checked
                  ? [...currentAnswers, index]
                  : currentAnswers.filter((a) => a !== index);
                onAnswer(newAnswers);
              }}
            />
            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

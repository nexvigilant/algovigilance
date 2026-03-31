'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface TrueFalseProps {
  currentAnswer: number | null;
  onAnswer: (answer: number) => void;
}

export function TrueFalse({ currentAnswer, onAnswer }: TrueFalseProps) {
  return (
    <RadioGroup
      value={currentAnswer?.toString()}
      onValueChange={(value) => onAnswer(parseInt(value))}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="1" id="true" />
          <Label htmlFor="true" className="flex-1 cursor-pointer">
            True
          </Label>
        </div>
        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="0" id="false" />
          <Label htmlFor="false" className="flex-1 cursor-pointer">
            False
          </Label>
        </div>
      </div>
    </RadioGroup>
  );
}

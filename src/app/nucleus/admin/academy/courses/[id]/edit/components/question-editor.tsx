'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { QuizQuestion } from '@/types/academy';

export function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Label>Question {index + 1}</Label>
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={question.type} onValueChange={(value) => onUpdate({ type: value as QuizQuestion['type'] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="multiple-select">Multiple Select</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Points</Label>
            <Input
              type="number"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            {question.type === 'true-false' ? (
              <Select value={question.correctAnswer.toString()} onValueChange={(value) => onUpdate({ correctAnswer: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">True</SelectItem>
                  <SelectItem value="0">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                value={Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer}
                onChange={(e) => onUpdate({ correctAnswer: parseInt(e.target.value) || 0 })}
                min="0"
                max={(question.options?.length || 1) - 1}
                placeholder="Index (0-based)"
              />
            )}
          </div>
        </div>

        {question.type !== 'true-false' && (
          <div className="space-y-2">
            <Label>Answer Options</Label>
            {question.options?.map((option, optIdx) => (
              <Input
                key={optIdx}
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])];
                  newOptions[optIdx] = e.target.value;
                  onUpdate({ options: newOptions });
                }}
                placeholder={`Option ${optIdx + 1}`}
              />
            ))}
            {(question.options?.length || 0) < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ options: [...(question.options || []), ''] })}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Explanation (Optional)</Label>
          <Textarea
            value={question.explanation || ''}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            placeholder="Explain why this answer is correct..."
            rows={2}
          />
        </div>
      </div>
    </Card>
  );
}

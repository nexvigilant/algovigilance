'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RequestFormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface RequestFormConfig {
  enabled: boolean;
  questions: RequestFormQuestion[];
  introMessage?: string;
}

interface RequestFormBuilderProps {
  value: RequestFormConfig;
  onChange: (config: RequestFormConfig) => void;
  disabled?: boolean;
}

const DEFAULT_QUESTIONS: RequestFormQuestion[] = [
  {
    id: 'why-join',
    type: 'textarea',
    label: 'Why do you want to join this circle?',
    placeholder: 'Tell us about your interest in this community...',
    required: true,
  },
  {
    id: 'experience',
    type: 'select',
    label: 'What is your experience level?',
    required: true,
    options: ['Practitioner', 'Early Career (0-3 years)', 'Mid Career (4-10 years)', 'Senior (10+ years)'],
  },
];

export function RequestFormBuilder({ value, onChange, disabled }: RequestFormBuilderProps) {
  const [newOption, setNewOption] = useState('');

  function addQuestion() {
    const newQuestion: RequestFormQuestion = {
      id: `q-${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
    };
    onChange({
      ...value,
      questions: [...value.questions, newQuestion],
    });
  }

  function removeQuestion(id: string) {
    onChange({
      ...value,
      questions: value.questions.filter(q => q.id !== id),
    });
  }

  function updateQuestion(id: string, updates: Partial<RequestFormQuestion>) {
    onChange({
      ...value,
      questions: value.questions.map(q =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  }

  function addOption(questionId: string) {
    if (!newOption.trim()) return;
    const question = value.questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...(question.options || []), newOption.trim()],
      });
      setNewOption('');
    }
  }

  function removeOption(questionId: string, optionIndex: number) {
    const question = value.questions.find(q => q.id === questionId);
    if (question?.options) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  }

  function useDefaultQuestions() {
    onChange({
      ...value,
      questions: DEFAULT_QUESTIONS,
    });
  }

  return (
    <Card className={cn(disabled && 'opacity-50 pointer-events-none')}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Join Request Form
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="form-enabled" className="text-sm text-muted-foreground">
              {value.enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="form-enabled"
              checked={value.enabled}
              onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
            />
          </div>
        </div>
      </CardHeader>

      {value.enabled && (
        <CardContent className="space-y-6">
          {/* Intro message */}
          <div>
            <Label htmlFor="intro-message" className="text-sm">
              Introduction Message (optional)
            </Label>
            <Textarea
              id="intro-message"
              value={value.introMessage || ''}
              onChange={(e) => onChange({ ...value, introMessage: e.target.value })}
              placeholder="Welcome message shown to users before the form..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Questions</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useDefaultQuestions}
                className="text-xs"
              >
                Use defaults
              </Button>
            </div>

            {value.questions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
                No questions added yet. Add questions or use defaults.
              </div>
            ) : (
              <div className="space-y-4">
                {value.questions.map((question, _index) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />

                      <div className="flex-1 space-y-3">
                        {/* Question label */}
                        <div>
                          <Input
                            value={question.label}
                            onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                            placeholder="Question label"
                            className="font-medium"
                          />
                        </div>

                        {/* Type and required */}
                        <div className="flex items-center gap-4">
                          <Select
                            value={question.type}
                            onValueChange={(type: RequestFormQuestion['type']) =>
                              updateQuestion(question.id, { type })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short text</SelectItem>
                              <SelectItem value="textarea">Long text</SelectItem>
                              <SelectItem value="select">Single select</SelectItem>
                              <SelectItem value="multiselect">Multi select</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${question.id}`}
                              checked={question.required}
                              onCheckedChange={(required) =>
                                updateQuestion(question.id, { required })
                              }
                            />
                            <Label htmlFor={`required-${question.id}`} className="text-sm">
                              Required
                            </Label>
                          </div>
                        </div>

                        {/* Placeholder for text types */}
                        {(question.type === 'text' || question.type === 'textarea') && (
                          <Input
                            value={question.placeholder || ''}
                            onChange={(e) =>
                              updateQuestion(question.id, { placeholder: e.target.value })
                            }
                            placeholder="Placeholder text (optional)"
                            className="text-sm"
                          />
                        )}

                        {/* Options for select types */}
                        {(question.type === 'select' || question.type === 'multiselect') && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Options</Label>
                            <div className="flex flex-wrap gap-2">
                              {question.options?.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                                >
                                  <span>{option}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(question.id, optIndex)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Add option..."
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addOption(question.id);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

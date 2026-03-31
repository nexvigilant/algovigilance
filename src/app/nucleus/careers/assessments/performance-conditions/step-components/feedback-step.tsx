'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';
import type { PerformanceResponses, ConditionPreference, PreferenceLevel } from '../assessment-client';

interface FeedbackStepProps {
  responses: PerformanceResponses;
  onUpdate: (updates: Partial<PerformanceResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PreferenceItem {
  id: keyof PerformanceResponses;
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftDescription: string;
  rightDescription: string;
}

const FEEDBACK_ITEMS: PreferenceItem[] = [
  {
    id: 'feedbackFrequency',
    label: 'Feedback Frequency',
    leftLabel: 'Infrequent',
    rightLabel: 'Continuous',
    leftDescription: 'Periodic reviews (quarterly+)',
    rightDescription: 'Real-time, constant input',
  },
  {
    id: 'feedbackFormat',
    label: 'Feedback Format',
    leftLabel: 'Written/Formal',
    rightLabel: 'Verbal/Informal',
    leftDescription: 'Documented, structured reviews',
    rightDescription: 'Casual conversations, quick chats',
  },
  {
    id: 'feedbackSource',
    label: 'Feedback Source',
    leftLabel: 'Manager Only',
    rightLabel: '360° Feedback',
    leftDescription: 'Direct supervisor feedback',
    rightDescription: 'Input from all directions',
  },
  {
    id: 'recognitionType',
    label: 'Recognition Type',
    leftLabel: 'Private Recognition',
    rightLabel: 'Public Recognition',
    leftDescription: 'One-on-one acknowledgment',
    rightDescription: 'Team/company-wide recognition',
  },
  {
    id: 'recognitionVisibility',
    label: 'Achievement Visibility',
    leftLabel: 'Results Speak',
    rightLabel: 'Active Promotion',
    leftDescription: 'Let work speak for itself',
    rightDescription: 'Achievements highlighted publicly',
  },
];

const IMPORTANCE_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-500 border-red-500 bg-red-500/10' },
  { value: 'important', label: 'Important', color: 'text-yellow-500 border-yellow-500 bg-yellow-500/10' },
  { value: 'nice-to-have', label: 'Nice to Have', color: 'text-green-500 border-green-500 bg-green-500/10' },
] as const;

function PreferenceCard({
  item,
  value,
  onChange,
}: {
  item: PreferenceItem;
  value: ConditionPreference;
  onChange: (response: ConditionPreference) => void;
}) {
  const handleValueChange = (newValue: PreferenceLevel) => {
    onChange({ ...value, value: newValue });
  };

  const handleImportanceChange = (importance: ConditionPreference['importance']) => {
    onChange({ ...value, importance });
  };

  return (
    <div className="p-4 bg-nex-dark rounded-lg border border-nex-border">
      <div className="mb-4">
        <h4 className="font-medium text-foreground">{item.label}</h4>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <div className="text-left">
          <div className="font-medium text-teal-400">{item.leftLabel}</div>
          <div className="text-xs text-muted-foreground">{item.leftDescription}</div>
        </div>
        <div className="text-right">
          <div className="font-medium text-green-400">{item.rightLabel}</div>
          <div className="text-xs text-muted-foreground">{item.rightDescription}</div>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
          <button
            key={level}
            onClick={() => handleValueChange(level as PreferenceLevel)}
            className={`flex-1 h-10 rounded transition-all ${
              value.value === level
                ? level <= 3
                  ? 'bg-teal-500 text-white'
                  : level === 4
                  ? 'bg-cyan text-nex-deep'
                  : 'bg-green-500 text-white'
                : 'bg-nex-surface hover:bg-nex-light text-muted-foreground'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {value.value && (
        <div className="pt-3 border-t border-nex-border">
          <div className="text-sm text-muted-foreground mb-2">How important is this to your performance?</div>
          <div className="flex gap-2">
            {IMPORTANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleImportanceChange(option.value)}
                className={`flex-1 px-3 py-1.5 rounded text-xs border-2 transition-all ${
                  value.importance === option.value
                    ? option.color
                    : 'border-nex-border bg-nex-surface text-muted-foreground hover:border-cyan/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FeedbackStep({ responses, onUpdate, onNext, onBack }: FeedbackStepProps) {
  const [localResponses, setLocalResponses] = useState({
    feedbackFrequency: responses.feedbackFrequency,
    feedbackFormat: responses.feedbackFormat,
    feedbackSource: responses.feedbackSource,
    recognitionType: responses.recognitionType,
    recognitionVisibility: responses.recognitionVisibility,
  });

  useEffect(() => {
    setLocalResponses({
      feedbackFrequency: responses.feedbackFrequency,
      feedbackFormat: responses.feedbackFormat,
      feedbackSource: responses.feedbackSource,
      recognitionType: responses.recognitionType,
      recognitionVisibility: responses.recognitionVisibility,
    });
  }, [responses]);

  const handleItemChange = (id: keyof typeof localResponses, response: ConditionPreference) => {
    setLocalResponses(prev => ({ ...prev, [id]: response }));
  };

  const handleContinue = () => {
    onUpdate(localResponses);
    onNext();
  };

  const handleBack = () => {
    onUpdate(localResponses);
    onBack();
  };

  const items = Object.values(localResponses);
  const isComplete = items.every(item => item.value !== null && item.importance !== null);
  const completedCount = items.filter(item => item.value !== null && item.importance !== null).length;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">4. Feedback & Recognition</h2>
            <p className="text-sm text-muted-foreground">
              How you prefer to receive input and acknowledgment
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {completedCount} of 5 preferences set
      </div>

      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Set your preferences</CardTitle>
          <CardDescription>
            What kind of feedback and recognition helps you perform best?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FEEDBACK_ITEMS.map((item) => (
            <PreferenceCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack} className="border-nex-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          Continue to Collaboration
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

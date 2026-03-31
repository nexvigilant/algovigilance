'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Target } from 'lucide-react';
import type { PerformanceResponses, ConditionPreference, PreferenceLevel } from '../assessment-client';

interface PurposeStepProps {
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

const PURPOSE_ITEMS: PreferenceItem[] = [
  {
    id: 'purposeMissionAlignment',
    label: 'Mission Alignment',
    leftLabel: 'Job Is a Job',
    rightLabel: 'Deep Mission Fit',
    leftDescription: 'Work for compensation',
    rightDescription: 'Personally believe in mission',
  },
  {
    id: 'purposeImpactVisibility',
    label: 'Impact Visibility',
    leftLabel: 'Trust It Matters',
    rightLabel: 'See Direct Impact',
    leftDescription: 'Faith that work contributes',
    rightDescription: 'Visible, measurable outcomes',
  },
  {
    id: 'purposeCustomerConnection',
    label: 'Customer Connection',
    leftLabel: 'Behind the Scenes',
    rightLabel: 'Direct Interaction',
    leftDescription: 'Internal, supporting role',
    rightDescription: 'Work directly with end users',
  },
  {
    id: 'purposeValueContribution',
    label: 'Value Contribution',
    leftLabel: 'Part of Machine',
    rightLabel: 'Unique Contribution',
    leftDescription: 'Execute defined role',
    rightDescription: 'My unique skills are essential',
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
          <div className="font-medium text-slate-400">{item.leftLabel}</div>
          <div className="text-xs text-muted-foreground">{item.leftDescription}</div>
        </div>
        <div className="text-right">
          <div className="font-medium text-gold">{item.rightLabel}</div>
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
                  ? 'bg-slate-500 text-white'
                  : level === 4
                  ? 'bg-amber-500 text-white'
                  : 'bg-gold text-nex-deep'
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

export function PurposeStep({ responses, onUpdate, onNext, onBack }: PurposeStepProps) {
  const [localResponses, setLocalResponses] = useState({
    purposeMissionAlignment: responses.purposeMissionAlignment,
    purposeImpactVisibility: responses.purposeImpactVisibility,
    purposeCustomerConnection: responses.purposeCustomerConnection,
    purposeValueContribution: responses.purposeValueContribution,
  });

  useEffect(() => {
    setLocalResponses({
      purposeMissionAlignment: responses.purposeMissionAlignment,
      purposeImpactVisibility: responses.purposeImpactVisibility,
      purposeCustomerConnection: responses.purposeCustomerConnection,
      purposeValueContribution: responses.purposeValueContribution,
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
      <div className="p-4 bg-gradient-to-r from-gold/10 to-transparent border-l-4 border-gold rounded-r-lg">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-gold" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">6. Purpose & Meaning</h2>
            <p className="text-sm text-muted-foreground">
              How much meaning and mission connection you need
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {completedCount} of 4 preferences set
      </div>

      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Set your preferences</CardTitle>
          <CardDescription>
            How important is purpose and meaning to your performance?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PURPOSE_ITEMS.map((item) => (
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
          className="bg-gold text-nex-deep hover:bg-gold-bright"
        >
          View My Map
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

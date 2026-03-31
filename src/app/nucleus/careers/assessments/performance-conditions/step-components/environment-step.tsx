'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Building } from 'lucide-react';
import type { PerformanceResponses, ConditionPreference, PreferenceLevel } from '../assessment-client';

interface EnvironmentStepProps {
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

const ENVIRONMENT_ITEMS: PreferenceItem[] = [
  {
    id: 'envRemoteVsOffice',
    label: 'Work Location',
    leftLabel: 'Fully Remote',
    rightLabel: 'Fully In-Office',
    leftDescription: 'Work from anywhere, no commute',
    rightDescription: 'Dedicated office space, in-person presence',
  },
  {
    id: 'envNoiseLevel',
    label: 'Noise & Stimulation',
    leftLabel: 'Complete Quiet',
    rightLabel: 'Busy & Energetic',
    leftDescription: 'Silent environment, minimal distractions',
    rightDescription: 'Background activity, ambient energy',
  },
  {
    id: 'envStructuredVsFlexible',
    label: 'Schedule Structure',
    leftLabel: 'Highly Structured',
    rightLabel: 'Completely Flexible',
    leftDescription: 'Fixed hours, clear routines',
    rightDescription: 'Work whenever, async-friendly',
  },
  {
    id: 'envPrivacyLevel',
    label: 'Workspace Privacy',
    leftLabel: 'Private Office',
    rightLabel: 'Open Floor Plan',
    leftDescription: 'Dedicated private space',
    rightDescription: 'Shared, collaborative space',
  },
  {
    id: 'envToolsAccess',
    label: 'Tools & Resources',
    leftLabel: 'Minimal Tools',
    rightLabel: 'Latest Technology',
    leftDescription: 'Simple, proven tools',
    rightDescription: 'Cutting-edge systems and equipment',
  },
  {
    id: 'envTravelFrequency',
    label: 'Travel Requirements',
    leftLabel: 'No Travel',
    rightLabel: 'Frequent Travel',
    leftDescription: 'Stay local, no business trips',
    rightDescription: 'Regular travel for work',
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
  isFirst = false,
}: {
  item: PreferenceItem;
  value: ConditionPreference;
  onChange: (response: ConditionPreference) => void;
  isFirst?: boolean;
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

      {/* Spectrum Labels */}
      <div className="flex justify-between text-sm mb-2">
        <div className="text-left">
          <div className="font-medium text-blue-400">{item.leftLabel}</div>
          <div className="text-xs text-muted-foreground">{item.leftDescription}</div>
        </div>
        <div className="text-right">
          <div className="font-medium text-emerald-400">{item.rightLabel}</div>
          <div className="text-xs text-muted-foreground">{item.rightDescription}</div>
        </div>
      </div>

      {/* Slider Buttons with Semantic Labels */}
      <div className="flex gap-1 mb-2" {...(isFirst ? { 'data-tour': 'preference-slider' } : {})}>
        {[1, 2, 3, 4, 5, 6, 7].map((level) => {
          const semanticLabel = level <= 2
            ? `Strong ${item.leftLabel}`
            : level === 3
            ? item.leftLabel
            : level === 4
            ? 'Balanced/Neutral'
            : level === 5
            ? item.rightLabel
            : `Strong ${item.rightLabel}`;
          return (
            <button
              key={level}
              onClick={() => handleValueChange(level as PreferenceLevel)}
              aria-label={`${item.label}: ${semanticLabel} (${level} of 7)`}
              aria-pressed={value.value === level}
              className={`flex-1 h-10 rounded transition-all ${
                value.value === level
                  ? level <= 3
                    ? 'bg-blue-500 text-white'
                    : level === 4
                    ? 'bg-purple-500 text-white'
                    : 'bg-emerald-500 text-white'
                  : 'bg-nex-surface hover:bg-nex-light text-muted-foreground'
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
      {/* Scale Legend */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>← Stronger preference</span>
        <span>Balanced</span>
        <span>Stronger preference →</span>
      </div>

      {/* Importance Selection */}
      {value.value && (
        <div className="pt-3 border-t border-nex-border" {...(isFirst ? { 'data-tour': 'importance-selector' } : {})}>
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

export function EnvironmentStep({ responses, onUpdate, onNext, onBack }: EnvironmentStepProps) {
  const [localResponses, setLocalResponses] = useState({
    envRemoteVsOffice: responses.envRemoteVsOffice,
    envNoiseLevel: responses.envNoiseLevel,
    envStructuredVsFlexible: responses.envStructuredVsFlexible,
    envPrivacyLevel: responses.envPrivacyLevel,
    envToolsAccess: responses.envToolsAccess,
    envTravelFrequency: responses.envTravelFrequency,
  });

  useEffect(() => {
    setLocalResponses({
      envRemoteVsOffice: responses.envRemoteVsOffice,
      envNoiseLevel: responses.envNoiseLevel,
      envStructuredVsFlexible: responses.envStructuredVsFlexible,
      envPrivacyLevel: responses.envPrivacyLevel,
      envToolsAccess: responses.envToolsAccess,
      envTravelFrequency: responses.envTravelFrequency,
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
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Work Environment</h2>
            <p className="text-sm text-muted-foreground">
              Your physical and digital workspace preferences
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        {completedCount} of 6 preferences set
      </div>

      {/* Assessment Items */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Set your preferences</CardTitle>
          <CardDescription>
            Where on each spectrum do you perform your best? Then mark how critical each is.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ENVIRONMENT_ITEMS.map((item, index) => (
            <PreferenceCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
              isFirst={index === 0}
            />
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4" data-tour="navigation-buttons">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-nex-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Continue to Autonomy
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

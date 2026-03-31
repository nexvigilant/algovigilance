'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { BoardEffectivenessResponses, ChecklistItem, ChecklistRating, ImportanceLevel } from '../assessment-client';

interface RiskStepProps {
  responses: BoardEffectivenessResponses;
  onUpdate: (updates: Partial<BoardEffectivenessResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ChecklistItemConfig {
  id: keyof BoardEffectivenessResponses;
  label: string;
  description: string;
}

const RISK_ITEMS: ChecklistItemConfig[] = [
  {
    id: 'riskFramework',
    label: 'Risk Framework',
    description: 'Comprehensive risk management framework with defined processes and ownership',
  },
  {
    id: 'riskAppetite',
    label: 'Risk Appetite',
    description: 'Clearly defined risk appetite and tolerance levels approved by the board',
  },
  {
    id: 'riskMonitoring',
    label: 'Risk Monitoring',
    description: 'Regular review of key risks, emerging threats, and risk mitigation effectiveness',
  },
  {
    id: 'crisisPreparedness',
    label: 'Crisis Preparedness',
    description: 'Crisis management and business continuity plans tested and ready',
  },
  {
    id: 'cybersecurityOversight',
    label: 'Cybersecurity Oversight',
    description: 'Board oversight of cybersecurity risks and digital threats',
  },
];

const RATING_OPTIONS = [
  { value: 'yes', label: 'Yes', color: 'text-green-500 border-green-500 bg-green-500/10' },
  { value: 'partial', label: 'Partial', color: 'text-yellow-500 border-yellow-500 bg-yellow-500/10' },
  { value: 'no', label: 'No', color: 'text-red-500 border-red-500 bg-red-500/10' },
  { value: 'na', label: 'N/A', color: 'text-slate-400 border-slate-400 bg-slate-400/10' },
] as const;

const IMPORTANCE_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-500 border-red-500 bg-red-500/10' },
  { value: 'important', label: 'Important', color: 'text-yellow-500 border-yellow-500 bg-yellow-500/10' },
  { value: 'nice-to-have', label: 'Nice to Have', color: 'text-green-500 border-green-500 bg-green-500/10' },
] as const;

function ChecklistCard({
  item,
  value,
  onChange,
}: {
  item: ChecklistItemConfig;
  value: ChecklistItem;
  onChange: (response: ChecklistItem) => void;
}) {
  const handleRatingChange = (rating: ChecklistRating) => {
    onChange({ ...value, rating });
  };

  const handleImportanceChange = (importance: ImportanceLevel) => {
    onChange({ ...value, importance });
  };

  return (
    <div className="p-4 bg-nex-dark rounded-lg border border-nex-border">
      <div className="mb-3">
        <h4 className="font-medium text-foreground">{item.label}</h4>
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
      </div>

      <div className="flex gap-2 mb-3">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRatingChange(option.value)}
            className={`flex-1 px-3 py-2 rounded text-sm border-2 transition-all ${
              value.rating === option.value
                ? option.color
                : 'border-nex-border bg-nex-surface text-muted-foreground hover:border-cyan/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {value.rating && value.rating !== 'na' && (
        <div className="pt-3 border-t border-nex-border">
          <div className="text-sm text-muted-foreground mb-2">How important is this?</div>
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

export function RiskStep({ responses, onUpdate, onNext, onBack }: RiskStepProps) {
  const [localResponses, setLocalResponses] = useState({
    riskFramework: responses.riskFramework,
    riskAppetite: responses.riskAppetite,
    riskMonitoring: responses.riskMonitoring,
    crisisPreparedness: responses.crisisPreparedness,
    cybersecurityOversight: responses.cybersecurityOversight,
  });

  useEffect(() => {
    setLocalResponses({
      riskFramework: responses.riskFramework,
      riskAppetite: responses.riskAppetite,
      riskMonitoring: responses.riskMonitoring,
      crisisPreparedness: responses.crisisPreparedness,
      cybersecurityOversight: responses.cybersecurityOversight,
    });
  }, [responses]);

  const handleItemChange = (id: keyof typeof localResponses, response: ChecklistItem) => {
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
  const isComplete = items.every(item =>
    item.rating !== null && (item.rating === 'na' || item.importance !== null)
  );
  const completedCount = items.filter(item =>
    item.rating !== null && (item.rating === 'na' || item.importance !== null)
  ).length;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">4. Risk Management</h2>
            <p className="text-sm text-muted-foreground">
              Identification, assessment, and oversight of organizational risks
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {completedCount} of 5 items evaluated
      </div>

      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Evaluate each checkpoint</CardTitle>
          <CardDescription>
            Rate each item and indicate its importance to board effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {RISK_ITEMS.map((item) => (
            <ChecklistCard
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
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Continue to Leadership
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

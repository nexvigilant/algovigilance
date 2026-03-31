'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Compass } from 'lucide-react';
import type { BoardEffectivenessResponses, ChecklistItem, ChecklistRating, ImportanceLevel } from '../assessment-client';

interface StrategyStepProps {
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

const STRATEGY_ITEMS: ChecklistItemConfig[] = [
  {
    id: 'strategyClarity',
    label: 'Strategy Clarity',
    description: 'The board has clear understanding of organizational strategy and can articulate it',
  },
  {
    id: 'strategyAlignment',
    label: 'Strategy Alignment',
    description: 'Board activities and decisions consistently align with strategic objectives',
  },
  {
    id: 'strategyMonitoring',
    label: 'Progress Monitoring',
    description: 'Regular, structured review of strategic progress with meaningful metrics',
  },
  {
    id: 'strategyAdaptation',
    label: 'Strategy Adaptation',
    description: 'Board actively reviews and adapts strategy based on market/environmental changes',
  },
  {
    id: 'performanceMetrics',
    label: 'Performance Metrics',
    description: 'Clear KPIs are defined, tracked, and reviewed at appropriate intervals',
  },
  {
    id: 'competitiveAwareness',
    label: 'Competitive Awareness',
    description: 'Board maintains awareness of competitive landscape and industry trends',
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
  isFirst = false,
}: {
  item: ChecklistItemConfig;
  value: ChecklistItem;
  onChange: (response: ChecklistItem) => void;
  isFirst?: boolean;
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

      <div className="flex gap-2 mb-3" {...(isFirst ? { 'data-tour': 'rating-selector' } : {})}>
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
        <div className="pt-3 border-t border-nex-border" {...(isFirst ? { 'data-tour': 'importance-selector' } : {})}>
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

export function StrategyStep({ responses, onUpdate, onNext, onBack }: StrategyStepProps) {
  const [localResponses, setLocalResponses] = useState({
    strategyClarity: responses.strategyClarity,
    strategyAlignment: responses.strategyAlignment,
    strategyMonitoring: responses.strategyMonitoring,
    strategyAdaptation: responses.strategyAdaptation,
    performanceMetrics: responses.performanceMetrics,
    competitiveAwareness: responses.competitiveAwareness,
  });

  useEffect(() => {
    setLocalResponses({
      strategyClarity: responses.strategyClarity,
      strategyAlignment: responses.strategyAlignment,
      strategyMonitoring: responses.strategyMonitoring,
      strategyAdaptation: responses.strategyAdaptation,
      performanceMetrics: responses.performanceMetrics,
      competitiveAwareness: responses.competitiveAwareness,
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
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Strategy & Oversight</h2>
            <p className="text-sm text-muted-foreground">
              Board&apos;s role in setting and monitoring strategic direction
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {completedCount} of 6 items evaluated
      </div>

      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Evaluate each checkpoint</CardTitle>
          <CardDescription>
            Rate each item and indicate its importance to board effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {STRATEGY_ITEMS.map((item, index) => (
            <ChecklistCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
              isFirst={index === 0}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4" data-tour="navigation-buttons">
        <Button variant="outline" onClick={handleBack} className="border-nex-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Continue to Governance
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

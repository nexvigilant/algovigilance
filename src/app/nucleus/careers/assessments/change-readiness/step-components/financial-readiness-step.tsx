'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Wallet, PiggyBank, CreditCard, TrendingDown } from 'lucide-react';
import type { ReadinessResponses, ReadinessResponse } from '../assessment-client';

interface FinancialReadinessStepProps {
  responses: ReadinessResponses;
  onUpdate: (updates: Partial<ReadinessResponses>) => void;
  onNext: () => void;
}

interface ReadinessIndicator {
  id: keyof ReadinessResponses;
  name: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
  anchors: { score: number; label: string; description: string }[];
}

const FINANCIAL_INDICATORS: ReadinessIndicator[] = [
  {
    id: 'financialRunway',
    name: 'Financial Runway',
    question: 'How long could you sustain your current lifestyle without regular income?',
    icon: Wallet,
    anchors: [
      { score: 1, label: 'Less than 1 month', description: 'Living paycheck to paycheck' },
      { score: 2, label: '1-3 months', description: 'Minimal buffer, high stress' },
      { score: 3, label: '3-6 months', description: 'Adequate short-term runway' },
      { score: 4, label: '6-12 months', description: 'Comfortable transition period' },
      { score: 5, label: '12+ months', description: 'Significant runway for exploration' },
    ],
  },
  {
    id: 'incomeStability',
    name: 'Income Diversity',
    question: 'How diversified are your potential income sources for a portfolio career?',
    icon: TrendingDown,
    anchors: [
      { score: 1, label: 'Single source only', description: 'Fully dependent on one employer/client' },
      { score: 2, label: 'One primary + ideas', description: 'Have ideas but no secondary income yet' },
      { score: 3, label: '2 potential sources', description: 'Primary income + one side opportunity' },
      { score: 4, label: '3+ potential sources', description: 'Multiple proven or near-proven streams' },
      { score: 5, label: 'Diversified portfolio', description: 'Multiple active income streams already' },
    ],
  },
  {
    id: 'emergencyFund',
    name: 'Emergency Fund',
    question: 'Do you have dedicated savings separate from your runway for unexpected expenses?',
    icon: PiggyBank,
    anchors: [
      { score: 1, label: 'No emergency fund', description: 'Would need to borrow for emergencies' },
      { score: 2, label: 'Less than $5K', description: 'Small buffer for minor emergencies' },
      { score: 3, label: '$5K-$15K', description: 'Can handle moderate unexpected costs' },
      { score: 4, label: '$15K-$30K', description: 'Solid emergency reserve' },
      { score: 5, label: '$30K+ or 6 months', description: 'Fully funded emergency fund' },
    ],
  },
  {
    id: 'debtLevel',
    name: 'Debt Obligations',
    question: 'How manageable are your debt obligations during income variability?',
    icon: CreditCard,
    anchors: [
      { score: 1, label: 'High debt burden', description: 'Debt payments consume most income' },
      { score: 2, label: 'Significant debt', description: 'Manageable but inflexible' },
      { score: 3, label: 'Moderate debt', description: 'Mortgage/loans with manageable payments' },
      { score: 4, label: 'Low debt', description: 'Minimal obligations, mostly optional' },
      { score: 5, label: 'Debt-free', description: 'No debt obligations constraining decisions' },
    ],
  },
];

function ReadinessIndicatorCard({
  indicator,
  value,
  onChange,
}: {
  indicator: ReadinessIndicator;
  value: ReadinessResponse | null;
  onChange: (response: ReadinessResponse) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const Icon = indicator.icon;

  const handleScoreClick = (score: number) => {
    onChange({
      score,
      notes: value?.notes || '',
    });
  };

  const handleNotesChange = (notes: string) => {
    if (value) {
      onChange({ ...value, notes });
    }
  };

  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Icon className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground">{indicator.name}</CardTitle>
            <CardDescription className="mt-1">{indicator.question}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Selection */}
        <div className="space-y-2">
          {indicator.anchors.map((anchor) => (
            <button
              key={anchor.score}
              onClick={() => handleScoreClick(anchor.score)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                value?.score === anchor.score
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-nex-border bg-nex-dark hover:border-green-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    value?.score === anchor.score
                      ? 'bg-green-500 text-white'
                      : 'bg-nex-surface text-muted-foreground'
                  }`}
                >
                  {anchor.score}
                </div>
                <div>
                  <div className={`font-medium ${value?.score === anchor.score ? 'text-green-500' : 'text-foreground'}`}>
                    {anchor.label}
                  </div>
                  <div className="text-sm text-muted-foreground">{anchor.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Notes Toggle */}
        {value?.score && (
          <div>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-muted-foreground hover:text-cyan transition-colors"
            >
              {showNotes ? '− Hide notes' : '+ Add context or notes'}
            </button>
            {showNotes && (
              <Textarea
                value={value.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Any context about your situation..."
                className="mt-2 bg-nex-dark border-nex-border min-h-[60px]"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinancialReadinessStep({ responses, onUpdate, onNext }: FinancialReadinessStepProps) {
  const [localResponses, setLocalResponses] = useState({
    financialRunway: responses.financialRunway,
    incomeStability: responses.incomeStability,
    emergencyFund: responses.emergencyFund,
    debtLevel: responses.debtLevel,
  });

  useEffect(() => {
    setLocalResponses({
      financialRunway: responses.financialRunway,
      incomeStability: responses.incomeStability,
      emergencyFund: responses.emergencyFund,
      debtLevel: responses.debtLevel,
    });
  }, [responses]);

  const handleIndicatorChange = (id: keyof typeof localResponses, response: ReadinessResponse) => {
    setLocalResponses(prev => ({ ...prev, [id]: response }));
  };

  const handleContinue = () => {
    onUpdate(localResponses);
    onNext();
  };

  const isComplete = localResponses.financialRunway?.score &&
                     localResponses.incomeStability?.score &&
                     localResponses.emergencyFund?.score &&
                     localResponses.debtLevel?.score;

  const avgScore = isComplete
    ? ((localResponses.financialRunway?.score || 0) +
       (localResponses.incomeStability?.score || 0) +
       (localResponses.emergencyFund?.score || 0) +
       (localResponses.debtLevel?.score || 0)) / 4
    : 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Financial Readiness</h2>
        <p className="text-sm text-muted-foreground">
          Financial stability is the foundation of a successful career transition. These indicators
          assess your ability to weather the uncertainty of building a portfolio career.
        </p>
      </div>

      {/* Indicator Cards */}
      {FINANCIAL_INDICATORS.map((indicator) => (
        <ReadinessIndicatorCard
          key={indicator.id}
          indicator={indicator}
          value={localResponses[indicator.id as keyof typeof localResponses]}
          onChange={(response) => handleIndicatorChange(indicator.id as keyof typeof localResponses, response)}
        />
      ))}

      {/* Section Summary */}
      {isComplete && (
        <Card className="bg-nex-dark/50 border-nex-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Financial Readiness Score</span>
              <span className={`text-2xl font-bold ${
                avgScore >= 4 ? 'text-green-500' :
                avgScore >= 3 ? 'text-cyan' :
                avgScore >= 2 ? 'text-gold' : 'text-orange-500'
              }`}>
                {avgScore.toFixed(1)} / 5
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          Continue to Network
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

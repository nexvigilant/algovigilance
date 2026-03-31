'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Coins, TrendingUp, DollarSign } from 'lucide-react';
import type { StartupHealthResponses, HealthCheckResponse, HealthScore } from '../types';

interface FinancialsTractionStepProps {
  responses: StartupHealthResponses;
  onUpdate: (updates: Partial<StartupHealthResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface HealthCheckItem {
  id: keyof StartupHealthResponses;
  name: string;
  question: string;
  greenCriteria: string;
  yellowCriteria: string;
  redCriteria: string;
}

const BUSINESS_MODEL_ITEMS: HealthCheckItem[] = [
  {
    id: 'revenueModel',
    name: 'Revenue Model',
    question: 'Is the revenue model clear and proven?',
    greenCriteria: 'Proven model with recurring revenue',
    yellowCriteria: 'Clear model, early validation',
    redCriteria: 'No clear monetization path',
  },
  {
    id: 'unitEconomics',
    name: 'Unit Economics',
    question: 'Are unit economics positive or trending positive?',
    greenCriteria: 'Positive LTV:CAC (3:1+), healthy margins',
    yellowCriteria: 'Improving metrics, path to profitability',
    redCriteria: 'Negative unit economics, no improvement path',
  },
  {
    id: 'scalability',
    name: 'Scalability',
    question: 'Can the business scale efficiently?',
    greenCriteria: 'Clear scale path, low marginal costs',
    yellowCriteria: 'Scalable with some constraints',
    redCriteria: 'Services-heavy, linear scaling',
  },
  {
    id: 'pricingStrategy',
    name: 'Pricing Strategy',
    question: 'Is pricing aligned with value delivered?',
    greenCriteria: 'Value-based pricing, room to increase',
    yellowCriteria: 'Competitive pricing, limited flexibility',
    redCriteria: 'Race to bottom, commoditized pricing',
  },
];

const TRACTION_ITEMS: HealthCheckItem[] = [
  {
    id: 'currentTraction',
    name: 'Current Traction',
    question: 'What traction has the company achieved?',
    greenCriteria: 'Strong revenue/users for stage',
    yellowCriteria: 'Early traction, promising signals',
    redCriteria: 'No meaningful traction yet',
  },
  {
    id: 'growthRate',
    name: 'Growth Rate',
    question: 'Is growth rate appropriate for the stage?',
    greenCriteria: 'Strong MoM growth (15%+ for early stage)',
    yellowCriteria: 'Moderate growth, consistent',
    redCriteria: 'Flat or declining metrics',
  },
  {
    id: 'keyMetrics',
    name: 'Key Metrics',
    question: 'Does leadership know and track the right metrics?',
    greenCriteria: 'Clear KPIs, data-driven decisions',
    yellowCriteria: 'Tracking metrics but gaps exist',
    redCriteria: 'Vanity metrics or no tracking',
  },
  {
    id: 'customerRetention',
    name: 'Customer Retention',
    question: 'Are customers staying and expanding?',
    greenCriteria: 'High retention (90%+), net revenue expansion',
    yellowCriteria: 'Moderate retention, stable',
    redCriteria: 'High churn, customers leaving',
  },
];

const FINANCIAL_ITEMS: HealthCheckItem[] = [
  {
    id: 'currentRunway',
    name: 'Current Runway',
    question: 'How much runway does the company have?',
    greenCriteria: '18+ months runway',
    yellowCriteria: '12-18 months runway',
    redCriteria: 'Less than 12 months, urgent need',
  },
  {
    id: 'fundraisingPlan',
    name: 'Fundraising Plan',
    question: 'Is there a clear path to next funding or profitability?',
    greenCriteria: 'Clear milestones, strong investor interest',
    yellowCriteria: 'Plan exists but uncertain',
    redCriteria: 'No plan, desperate for funding',
  },
  {
    id: 'burnRate',
    name: 'Burn Rate',
    question: 'Is burn rate appropriate for the stage?',
    greenCriteria: 'Efficient burn, clear ROI on spend',
    yellowCriteria: 'Moderate burn, some efficiency concerns',
    redCriteria: 'High burn with unclear returns',
  },
  {
    id: 'financialTransparency',
    name: 'Financial Transparency',
    question: 'Is leadership transparent about financials?',
    greenCriteria: 'Open books, regular reporting',
    yellowCriteria: 'Some transparency, basics shared',
    redCriteria: 'Evasive, won\'t share financials',
  },
];

function HealthCheckCard({
  item,
  value,
  onChange,
}: {
  item: HealthCheckItem;
  value: HealthCheckResponse | null;
  onChange: (response: HealthCheckResponse) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  const handleScoreClick = (score: HealthScore) => {
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

  const scoreOptions = [
    { score: 3 as HealthScore, label: 'Green', color: '#22c55e', criteria: item.greenCriteria },
    { score: 2 as HealthScore, label: 'Yellow', color: '#eab308', criteria: item.yellowCriteria },
    { score: 1 as HealthScore, label: 'Red', color: '#ef4444', criteria: item.redCriteria },
  ];

  return (
    <div className="p-4 bg-nex-dark rounded-lg border border-nex-border">
      <div className="mb-3">
        <h4 className="font-medium text-foreground">{item.name}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{item.question}</p>
      </div>

      <div className="space-y-2">
        {scoreOptions.map((option) => (
          <button
            key={option.score}
            onClick={() => handleScoreClick(option.score)}
            className="w-full text-left p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: value?.score === option.score ? option.color : 'var(--nex-border)',
              backgroundColor: value?.score === option.score ? `${option.color}15` : 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <div>
                <span
                  className="font-medium text-sm"
                  style={{ color: value?.score === option.score ? option.color : 'inherit' }}
                >
                  {option.label}
                </span>
                <span className="text-sm text-muted-foreground ml-2">— {option.criteria}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {value?.score && (
        <div className="mt-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-muted-foreground hover:text-cyan transition-colors"
          >
            {showNotes ? '− Hide notes' : '+ Add notes or evidence'}
          </button>
          {showNotes && (
            <Textarea
              value={value.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Evidence, observations, questions to follow up on..."
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function FinancialsTractionStep({ responses, onUpdate, onNext, onBack }: FinancialsTractionStepProps) {
  const [localResponses, setLocalResponses] = useState({
    revenueModel: responses.revenueModel,
    unitEconomics: responses.unitEconomics,
    scalability: responses.scalability,
    pricingStrategy: responses.pricingStrategy,
    currentTraction: responses.currentTraction,
    growthRate: responses.growthRate,
    keyMetrics: responses.keyMetrics,
    customerRetention: responses.customerRetention,
    currentRunway: responses.currentRunway,
    fundraisingPlan: responses.fundraisingPlan,
    burnRate: responses.burnRate,
    financialTransparency: responses.financialTransparency,
  });

  useEffect(() => {
    setLocalResponses({
      revenueModel: responses.revenueModel,
      unitEconomics: responses.unitEconomics,
      scalability: responses.scalability,
      pricingStrategy: responses.pricingStrategy,
      currentTraction: responses.currentTraction,
      growthRate: responses.growthRate,
      keyMetrics: responses.keyMetrics,
      customerRetention: responses.customerRetention,
      currentRunway: responses.currentRunway,
      fundraisingPlan: responses.fundraisingPlan,
      burnRate: responses.burnRate,
      financialTransparency: responses.financialTransparency,
    });
  }, [responses]);

  const handleItemChange = (id: keyof typeof localResponses, response: HealthCheckResponse) => {
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

  const businessItems = [localResponses.revenueModel, localResponses.unitEconomics, localResponses.scalability, localResponses.pricingStrategy];
  const tractionItems = [localResponses.currentTraction, localResponses.growthRate, localResponses.keyMetrics, localResponses.customerRetention];
  const financialItems = [localResponses.currentRunway, localResponses.fundraisingPlan, localResponses.burnRate, localResponses.financialTransparency];

  const businessComplete = businessItems.every(item => item?.score);
  const tractionComplete = tractionItems.every(item => item?.score);
  const financialComplete = financialItems.every(item => item?.score);
  const isComplete = businessComplete && tractionComplete && financialComplete;

  const getAreaScore = (items: (HealthCheckResponse | null)[]) => {
    const scores = items.flatMap(i => (i?.score != null ? [i.score] : []));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const businessScore = getAreaScore(businessItems);
  const tractionScore = getAreaScore(tractionItems);
  const financialScore = getAreaScore(financialItems);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 2.5) return 'text-green-500';
    if (score >= 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Area 5: Business Model */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 5: Business Model</CardTitle>
                <CardDescription>Evaluate revenue model and unit economics</CardDescription>
              </div>
            </div>
            {businessScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(businessScore)}`}>
                {businessScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {BUSINESS_MODEL_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area 6: Traction & Metrics */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 6: Traction & Metrics</CardTitle>
                <CardDescription>Assess growth trajectory and key performance indicators</CardDescription>
              </div>
            </div>
            {tractionScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(tractionScore)}`}>
                {tractionScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {TRACTION_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area 7: Financials */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 7: Financials</CardTitle>
                <CardDescription>Review runway, burn rate, and financial transparency</CardDescription>
              </div>
            </div>
            {financialScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(financialScore)}`}>
                {financialScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {FINANCIAL_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
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
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

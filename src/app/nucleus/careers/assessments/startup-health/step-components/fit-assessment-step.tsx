'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { StartupHealthResponses, HealthCheckResponse, HealthScore } from '../types';

interface FitAssessmentStepProps {
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

const FIT_ITEMS: HealthCheckItem[] = [
  {
    id: 'expertiseRelevance',
    name: 'Expertise Relevance',
    question: 'How relevant is your expertise to what they need?',
    greenCriteria: 'Direct domain match, clear value-add',
    yellowCriteria: 'Adjacent expertise, transferable skills',
    redCriteria: 'Poor fit, they need different expertise',
  },
  {
    id: 'networkValue',
    name: 'Network Value',
    question: 'Can you provide valuable connections to them?',
    greenCriteria: 'Strong network in their target market/investors',
    yellowCriteria: 'Some relevant connections',
    redCriteria: 'No valuable network for their needs',
  },
  {
    id: 'timeCommitment',
    name: 'Time Commitment',
    question: 'Can you realistically commit the time they need?',
    greenCriteria: 'Clear availability, can commit fully',
    yellowCriteria: 'Manageable but tight',
    redCriteria: 'Overcommitted, can\'t deliver',
  },
  {
    id: 'compensationFairness',
    name: 'Compensation Fairness',
    question: 'Is the compensation fair for what they\'re asking?',
    greenCriteria: 'Fair equity/cash for commitment level',
    yellowCriteria: 'Below market but acceptable',
    redCriteria: 'Significantly undervalued or unclear',
  },
  {
    id: 'passionAlignment',
    name: 'Passion & Mission Alignment',
    question: 'Are you genuinely excited about their mission?',
    greenCriteria: 'Strong alignment, personally motivated',
    yellowCriteria: 'Interested but not passionate',
    redCriteria: 'No personal connection to mission',
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
              placeholder="Your honest assessment of fit..."
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function FitAssessmentStep({ responses, onUpdate, onNext, onBack }: FitAssessmentStepProps) {
  const [localResponses, setLocalResponses] = useState({
    expertiseRelevance: responses.expertiseRelevance,
    networkValue: responses.networkValue,
    timeCommitment: responses.timeCommitment,
    compensationFairness: responses.compensationFairness,
    passionAlignment: responses.passionAlignment,
  });

  useEffect(() => {
    setLocalResponses({
      expertiseRelevance: responses.expertiseRelevance,
      networkValue: responses.networkValue,
      timeCommitment: responses.timeCommitment,
      compensationFairness: responses.compensationFairness,
      passionAlignment: responses.passionAlignment,
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

  const fitItems = [
    localResponses.expertiseRelevance,
    localResponses.networkValue,
    localResponses.timeCommitment,
    localResponses.compensationFairness,
    localResponses.passionAlignment,
  ];

  const isComplete = fitItems.every(item => item?.score);

  const getAreaScore = (items: (HealthCheckResponse | null)[]) => {
    const scores = items.flatMap(i => (i?.score != null ? [i.score] : []));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const fitScore = getAreaScore(fitItems);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 2.5) return 'text-green-500';
    if (score >= 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Your Personal Fit</h2>
        <p className="text-sm text-muted-foreground">
          The most overlooked area: whether this opportunity is right for <em>you</em>.
          An objectively great startup can still be a poor fit for your situation.
        </p>
      </div>

      {/* Fit Assessment Card */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 10: Your Fit</CardTitle>
                <CardDescription>Honestly assess whether this opportunity matches your situation</CardDescription>
              </div>
            </div>
            {fitScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(fitScore)}`}>
                {fitScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIT_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Key Insight */}
      <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-gold">Advisory Truth: </span>
          <span className="text-muted-foreground">
            Your personal fit assessment often matters more than the company's metrics.
            A mediocre-scoring startup where you can make real impact beats a great startup
            where you're a poor fit.
          </span>
        </p>
      </div>

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
          className="bg-gold text-nex-deep hover:bg-gold-bright"
        >
          View Results
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Clock, Home, HeartPulse } from 'lucide-react';
import type { ReadinessResponses, ReadinessResponse } from '../assessment-client';

interface PracticalReadinessStepProps {
  responses: ReadinessResponses;
  onUpdate: (updates: Partial<ReadinessResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ReadinessIndicator {
  id: keyof ReadinessResponses;
  name: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
  anchors: { score: number; label: string; description: string }[];
}

const PRACTICAL_INDICATORS: ReadinessIndicator[] = [
  {
    id: 'timeAvailability',
    name: 'Time Availability',
    question: 'How much time can you dedicate to building your portfolio career alongside current commitments?',
    icon: Clock,
    anchors: [
      { score: 1, label: 'No available time', description: 'Completely maxed out, no bandwidth' },
      { score: 2, label: '1-5 hours/week', description: 'Very limited, only basics possible' },
      { score: 3, label: '5-10 hours/week', description: 'Enough for steady progress' },
      { score: 4, label: '10-20 hours/week', description: 'Significant time for active development' },
      { score: 5, label: '20+ hours/week', description: 'Ready to make it a primary focus' },
    ],
  },
  {
    id: 'familySupport',
    name: 'Family/Partner Support',
    question: 'How supportive are key people in your life about a career transition?',
    icon: Home,
    anchors: [
      { score: 1, label: 'Actively against', description: 'Strong opposition from family/partner' },
      { score: 2, label: 'Skeptical', description: 'Concerned and not supportive yet' },
      { score: 3, label: 'Neutral', description: 'Not opposed but not actively supportive' },
      { score: 4, label: 'Supportive', description: 'Encouraging and understanding of trade-offs' },
      { score: 5, label: 'Championing', description: 'Actively supporting and invested in success' },
    ],
  },
  {
    id: 'healthInsurance',
    name: 'Health Insurance Situation',
    question: 'How dependent are you on employer-provided health insurance?',
    icon: HeartPulse,
    anchors: [
      { score: 1, label: 'Fully dependent', description: 'No alternative insurance option available' },
      { score: 2, label: 'Mostly dependent', description: 'Alternatives exist but expensive/complex' },
      { score: 3, label: 'Have options', description: 'Could get coverage through spouse/market' },
      { score: 4, label: 'Covered elsewhere', description: 'Already have alternative coverage secured' },
      { score: 5, label: 'Not a concern', description: 'Spouse coverage, ACA, or other solid option' },
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
          <div className="p-2 bg-gold/10 rounded-lg">
            <Icon className="h-5 w-5 text-gold" />
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
                  ? 'border-gold bg-gold/10'
                  : 'border-nex-border bg-nex-dark hover:border-gold/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    value?.score === anchor.score
                      ? 'bg-gold text-nex-deep'
                      : 'bg-nex-surface text-muted-foreground'
                  }`}
                >
                  {anchor.score}
                </div>
                <div>
                  <div className={`font-medium ${value?.score === anchor.score ? 'text-gold' : 'text-foreground'}`}>
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
                placeholder="Additional context about your situation..."
                className="mt-2 bg-nex-dark border-nex-border min-h-[60px]"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PracticalReadinessStep({ responses, onUpdate, onNext, onBack }: PracticalReadinessStepProps) {
  const [localResponses, setLocalResponses] = useState({
    timeAvailability: responses.timeAvailability,
    familySupport: responses.familySupport,
    healthInsurance: responses.healthInsurance,
  });

  useEffect(() => {
    setLocalResponses({
      timeAvailability: responses.timeAvailability,
      familySupport: responses.familySupport,
      healthInsurance: responses.healthInsurance,
    });
  }, [responses]);

  const handleIndicatorChange = (id: keyof typeof localResponses, response: ReadinessResponse) => {
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

  const isComplete = localResponses.timeAvailability?.score &&
                     localResponses.familySupport?.score &&
                     localResponses.healthInsurance?.score;

  const avgScore = isComplete
    ? ((localResponses.timeAvailability?.score || 0) +
       (localResponses.familySupport?.score || 0) +
       (localResponses.healthInsurance?.score || 0)) / 3
    : 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-gold/10 to-transparent border-l-4 border-gold rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Practical Readiness</h2>
        <p className="text-sm text-muted-foreground">
          Beyond finances and mindset, practical logistics can make or break a career transition.
          These factors often get overlooked until they become blockers.
        </p>
      </div>

      {/* Indicator Cards */}
      {PRACTICAL_INDICATORS.map((indicator) => (
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
              <span className="text-sm text-muted-foreground">Practical Readiness Score</span>
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

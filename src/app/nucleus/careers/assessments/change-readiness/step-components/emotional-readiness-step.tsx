'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Fingerprint, Waves, Shield, Flame } from 'lucide-react';
import type { ReadinessResponses, ReadinessResponse } from '../assessment-client';

interface EmotionalReadinessStepProps {
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

const EMOTIONAL_INDICATORS: ReadinessIndicator[] = [
  {
    id: 'identityFlexibility',
    name: 'Identity Flexibility',
    question: 'How tied is your identity to your current job title or employer?',
    icon: Fingerprint,
    anchors: [
      { score: 1, label: 'Fully tied', description: '"I am my job title" - identity = role' },
      { score: 2, label: 'Mostly tied', description: 'Strong attachment to current identity' },
      { score: 3, label: 'Moderately flexible', description: 'Some identity beyond work role' },
      { score: 4, label: 'Mostly flexible', description: 'Identity based on skills and values' },
      { score: 5, label: 'Fully flexible', description: 'Identity transcends any single role' },
    ],
  },
  {
    id: 'uncertaintyTolerance',
    name: 'Uncertainty Tolerance',
    question: 'How comfortable are you with ambiguity and unpredictable outcomes?',
    icon: Waves,
    anchors: [
      { score: 1, label: 'Very uncomfortable', description: 'Need certainty and clear plans' },
      { score: 2, label: 'Uncomfortable', description: 'Prefer stability, struggle with unknowns' },
      { score: 3, label: 'Moderate tolerance', description: 'Can handle some uncertainty' },
      { score: 4, label: 'Comfortable', description: 'Embrace ambiguity as opportunity' },
      { score: 5, label: 'Thrive in uncertainty', description: 'Energized by unpredictability' },
    ],
  },
  {
    id: 'rejectionResilience',
    name: 'Rejection Resilience',
    question: 'How do you handle professional rejection or "no" responses?',
    icon: Shield,
    anchors: [
      { score: 1, label: 'Takes it personally', description: 'Rejection feels like personal failure' },
      { score: 2, label: 'Struggles to recover', description: 'Takes time to bounce back' },
      { score: 3, label: 'Moderately resilient', description: 'Recovers but it affects mood' },
      { score: 4, label: 'Resilient', description: 'Sees rejection as data, moves forward' },
      { score: 5, label: 'Highly resilient', description: 'Uses rejection as fuel for improvement' },
    ],
  },
  {
    id: 'selfMotivation',
    name: 'Self-Motivation',
    question: 'How well do you drive yourself without external structure or deadlines?',
    icon: Flame,
    anchors: [
      { score: 1, label: 'Need external structure', description: 'Rely heavily on bosses and deadlines' },
      { score: 2, label: 'Struggle without structure', description: 'Work best with clear expectations' },
      { score: 3, label: 'Moderately self-driven', description: 'Can self-start but need some structure' },
      { score: 4, label: 'Self-motivated', description: 'Create own goals and drive execution' },
      { score: 5, label: 'Highly self-motivated', description: 'Thrive with autonomy and self-direction' },
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
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Icon className="h-5 w-5 text-pink-500" />
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
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-nex-border bg-nex-dark hover:border-pink-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    value?.score === anchor.score
                      ? 'bg-pink-500 text-white'
                      : 'bg-nex-surface text-muted-foreground'
                  }`}
                >
                  {anchor.score}
                </div>
                <div>
                  <div className={`font-medium ${value?.score === anchor.score ? 'text-pink-500' : 'text-foreground'}`}>
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
                placeholder="Reflections on your emotional readiness..."
                className="mt-2 bg-nex-dark border-nex-border min-h-[60px]"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmotionalReadinessStep({ responses, onUpdate, onNext, onBack }: EmotionalReadinessStepProps) {
  const [localResponses, setLocalResponses] = useState({
    identityFlexibility: responses.identityFlexibility,
    uncertaintyTolerance: responses.uncertaintyTolerance,
    rejectionResilience: responses.rejectionResilience,
    selfMotivation: responses.selfMotivation,
  });

  useEffect(() => {
    setLocalResponses({
      identityFlexibility: responses.identityFlexibility,
      uncertaintyTolerance: responses.uncertaintyTolerance,
      rejectionResilience: responses.rejectionResilience,
      selfMotivation: responses.selfMotivation,
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

  const isComplete = localResponses.identityFlexibility?.score &&
                     localResponses.uncertaintyTolerance?.score &&
                     localResponses.rejectionResilience?.score &&
                     localResponses.selfMotivation?.score;

  const avgScore = isComplete
    ? ((localResponses.identityFlexibility?.score || 0) +
       (localResponses.uncertaintyTolerance?.score || 0) +
       (localResponses.rejectionResilience?.score || 0) +
       (localResponses.selfMotivation?.score || 0)) / 4
    : 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-pink-500/10 to-transparent border-l-4 border-pink-500 rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Emotional Readiness</h2>
        <p className="text-sm text-muted-foreground">
          The psychological shift from employee to portfolio professional is often the hardest
          part of the transition. These indicators assess your emotional preparedness for change.
        </p>
      </div>

      {/* Indicator Cards */}
      {EMOTIONAL_INDICATORS.map((indicator) => (
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
              <span className="text-sm text-muted-foreground">Emotional Readiness Score</span>
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
          className="bg-pink-500 text-white hover:bg-pink-600"
        >
          Continue to Practical
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

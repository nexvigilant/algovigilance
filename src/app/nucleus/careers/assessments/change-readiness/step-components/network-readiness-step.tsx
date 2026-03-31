'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Users, Star, Share2, UserCheck } from 'lucide-react';
import type { ReadinessResponses, ReadinessResponse } from '../assessment-client';

interface NetworkReadinessStepProps {
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

const NETWORK_INDICATORS: ReadinessIndicator[] = [
  {
    id: 'professionalNetwork',
    name: 'Professional Network Size',
    question: 'How strong is your professional network in your target advisory areas?',
    icon: Users,
    anchors: [
      { score: 1, label: 'Very limited', description: 'Few professional connections outside current employer' },
      { score: 2, label: 'Small network', description: 'Some contacts but mostly from current role' },
      { score: 3, label: 'Moderate network', description: 'Decent contacts across a few organizations' },
      { score: 4, label: 'Strong network', description: 'Broad connections across industry' },
      { score: 5, label: 'Extensive network', description: 'Deep relationships across multiple sectors' },
    ],
  },
  {
    id: 'industryReputation',
    name: 'Industry Reputation',
    question: 'How well are you known and respected in your professional community?',
    icon: Star,
    anchors: [
      { score: 1, label: 'Unknown', description: 'Not recognized outside immediate team' },
      { score: 2, label: 'Locally known', description: 'Known within current organization' },
      { score: 3, label: 'Moderately known', description: 'Some recognition in broader industry' },
      { score: 4, label: 'Well respected', description: 'Recognized expert, invited to speak/contribute' },
      { score: 5, label: 'Thought leader', description: 'Industry authority, sought out for expertise' },
    ],
  },
  {
    id: 'referralSources',
    name: 'Referral Sources',
    question: 'How many people would proactively recommend you for advisory opportunities?',
    icon: Share2,
    anchors: [
      { score: 1, label: 'None confidently', description: 'Would need to build advocacy from scratch' },
      { score: 2, label: '1-2 people', description: 'A couple of supporters but limited reach' },
      { score: 3, label: '3-5 people', description: 'Small group of active advocates' },
      { score: 4, label: '6-10 people', description: 'Solid base of people who actively refer' },
      { score: 5, label: '10+ people', description: 'Strong network of advocates across sectors' },
    ],
  },
  {
    id: 'mentorAccess',
    name: 'Mentor/Advisor Access',
    question: 'Do you have access to mentors who can guide your portfolio career transition?',
    icon: UserCheck,
    anchors: [
      { score: 1, label: 'No mentors', description: 'No one to turn to for guidance' },
      { score: 2, label: 'Informal only', description: 'Occasional advice from colleagues' },
      { score: 3, label: 'One mentor', description: 'One person providing regular guidance' },
      { score: 4, label: 'Multiple mentors', description: 'Several advisors for different aspects' },
      { score: 5, label: 'Advisory board', description: 'Personal board of advisors actively supporting' },
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
          <div className="p-2 bg-cyan/10 rounded-lg">
            <Icon className="h-5 w-5 text-cyan" />
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
                  ? 'border-cyan bg-cyan/10'
                  : 'border-nex-border bg-nex-dark hover:border-cyan/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    value?.score === anchor.score
                      ? 'bg-cyan text-nex-deep'
                      : 'bg-nex-surface text-muted-foreground'
                  }`}
                >
                  {anchor.score}
                </div>
                <div>
                  <div className={`font-medium ${value?.score === anchor.score ? 'text-cyan' : 'text-foreground'}`}>
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
                placeholder="Key contacts or networking plans..."
                className="mt-2 bg-nex-dark border-nex-border min-h-[60px]"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NetworkReadinessStep({ responses, onUpdate, onNext, onBack }: NetworkReadinessStepProps) {
  const [localResponses, setLocalResponses] = useState({
    professionalNetwork: responses.professionalNetwork,
    industryReputation: responses.industryReputation,
    referralSources: responses.referralSources,
    mentorAccess: responses.mentorAccess,
  });

  useEffect(() => {
    setLocalResponses({
      professionalNetwork: responses.professionalNetwork,
      industryReputation: responses.industryReputation,
      referralSources: responses.referralSources,
      mentorAccess: responses.mentorAccess,
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

  const isComplete = localResponses.professionalNetwork?.score &&
                     localResponses.industryReputation?.score &&
                     localResponses.referralSources?.score &&
                     localResponses.mentorAccess?.score;

  const avgScore = isComplete
    ? ((localResponses.professionalNetwork?.score || 0) +
       (localResponses.industryReputation?.score || 0) +
       (localResponses.referralSources?.score || 0) +
       (localResponses.mentorAccess?.score || 0)) / 4
    : 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-cyan/10 to-transparent border-l-4 border-cyan rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Network Readiness</h2>
        <p className="text-sm text-muted-foreground">
          Your network is your net worth in a portfolio career. 65% of advisory opportunities
          come through connections, not job boards. How ready is your network?
        </p>
      </div>

      {/* Indicator Cards */}
      {NETWORK_INDICATORS.map((indicator) => (
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
              <span className="text-sm text-muted-foreground">Network Readiness Score</span>
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
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Continue to Emotional
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

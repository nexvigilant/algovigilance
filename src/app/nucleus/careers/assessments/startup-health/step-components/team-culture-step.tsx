'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Users, Heart } from 'lucide-react';
import type { StartupHealthResponses, HealthCheckResponse, HealthScore } from '../types';

interface TeamCultureStepProps {
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

const TEAM_ITEMS: HealthCheckItem[] = [
  {
    id: 'founderExperience',
    name: 'Founder Experience',
    question: 'Do founders have relevant domain expertise and startup experience?',
    greenCriteria: 'Deep domain expertise + prior startup success',
    yellowCriteria: 'Some relevant experience, first-time founders',
    redCriteria: 'No domain expertise, no startup experience',
  },
  {
    id: 'founderCommitment',
    name: 'Founder Commitment',
    question: 'Are founders fully committed (full-time, skin in the game)?',
    greenCriteria: 'Full-time, significant personal investment',
    yellowCriteria: 'Full-time but limited personal investment',
    redCriteria: 'Part-time, side project, no personal risk',
  },
  {
    id: 'founderCoachability',
    name: 'Coachability',
    question: 'Do founders actively seek and act on feedback?',
    greenCriteria: 'Welcomes feedback, demonstrates adaptability',
    yellowCriteria: 'Receptive but slow to implement changes',
    redCriteria: 'Defensive, dismissive of advice, fixed mindset',
  },
  {
    id: 'teamComplementary',
    name: 'Complementary Skills',
    question: 'Does the founding team have complementary skills covering key areas?',
    greenCriteria: 'Strong coverage of product, tech, and business',
    yellowCriteria: 'Some gaps but awareness of needs',
    redCriteria: 'Major skill gaps, no plan to address',
  },
];

const CULTURE_ITEMS: HealthCheckItem[] = [
  {
    id: 'cultureClarity',
    name: 'Culture Clarity',
    question: 'Can leadership clearly articulate company values and culture?',
    greenCriteria: 'Clear, documented values lived in practice',
    yellowCriteria: 'Values exist but inconsistently applied',
    redCriteria: 'No defined culture, or toxic signals',
  },
  {
    id: 'valuesAlignment',
    name: 'Values Alignment',
    question: 'Do company values align with yours?',
    greenCriteria: 'Strong alignment with your professional values',
    yellowCriteria: 'Mostly aligned with minor differences',
    redCriteria: 'Significant value conflicts or ethical concerns',
  },
  {
    id: 'decisionMaking',
    name: 'Decision Making',
    question: 'How are decisions made? Is there healthy debate?',
    greenCriteria: 'Transparent process, diverse input valued',
    yellowCriteria: 'Mostly top-down but open to input',
    redCriteria: 'Opaque, autocratic, or chaotic',
  },
  {
    id: 'conflictResolution',
    name: 'Conflict Resolution',
    question: 'How does the team handle disagreements?',
    greenCriteria: 'Constructive conflict, professional resolution',
    yellowCriteria: 'Avoidance or occasional escalation',
    redCriteria: 'Destructive conflict, unresolved issues',
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
    { score: 3 as HealthScore, label: 'Green', color: 'green-500', criteria: item.greenCriteria },
    { score: 2 as HealthScore, label: 'Yellow', color: 'yellow-500', criteria: item.yellowCriteria },
    { score: 1 as HealthScore, label: 'Red', color: 'red-500', criteria: item.redCriteria },
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
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              value?.score === option.score
                ? `border-${option.color} bg-${option.color}/10`
                : 'border-nex-border hover:border-nex-light'
            }`}
            style={{
              borderColor: value?.score === option.score
                ? option.color === 'green-500' ? '#22c55e'
                : option.color === 'yellow-500' ? '#eab308'
                : '#ef4444'
                : undefined,
              backgroundColor: value?.score === option.score
                ? option.color === 'green-500' ? 'rgba(34, 197, 94, 0.1)'
                : option.color === 'yellow-500' ? 'rgba(234, 179, 8, 0.1)'
                : 'rgba(239, 68, 68, 0.1)'
                : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: option.color === 'green-500' ? '#22c55e'
                    : option.color === 'yellow-500' ? '#eab308'
                    : '#ef4444'
                }}
              />
              <div>
                <span
                  className="font-medium text-sm"
                  style={{
                    color: value?.score === option.score
                      ? option.color === 'green-500' ? '#22c55e'
                      : option.color === 'yellow-500' ? '#eab308'
                      : '#ef4444'
                      : 'inherit'
                  }}
                >
                  {option.label}
                </span>
                <span className="text-sm text-muted-foreground ml-2">— {option.criteria}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Notes Toggle */}
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

export function TeamCultureStep({ responses, onUpdate, onNext, onBack }: TeamCultureStepProps) {
  const [localResponses, setLocalResponses] = useState({
    founderExperience: responses.founderExperience,
    founderCommitment: responses.founderCommitment,
    founderCoachability: responses.founderCoachability,
    teamComplementary: responses.teamComplementary,
    cultureClarity: responses.cultureClarity,
    valuesAlignment: responses.valuesAlignment,
    decisionMaking: responses.decisionMaking,
    conflictResolution: responses.conflictResolution,
  });

  useEffect(() => {
    setLocalResponses({
      founderExperience: responses.founderExperience,
      founderCommitment: responses.founderCommitment,
      founderCoachability: responses.founderCoachability,
      teamComplementary: responses.teamComplementary,
      cultureClarity: responses.cultureClarity,
      valuesAlignment: responses.valuesAlignment,
      decisionMaking: responses.decisionMaking,
      conflictResolution: responses.conflictResolution,
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

  // Calculate area scores
  const teamItems = [localResponses.founderExperience, localResponses.founderCommitment, localResponses.founderCoachability, localResponses.teamComplementary];
  const cultureItems = [localResponses.cultureClarity, localResponses.valuesAlignment, localResponses.decisionMaking, localResponses.conflictResolution];

  const teamComplete = teamItems.every(item => item?.score);
  const cultureComplete = cultureItems.every(item => item?.score);
  const isComplete = teamComplete && cultureComplete;

  const getAreaScore = (items: (HealthCheckResponse | null)[]) => {
    const scores = items.flatMap(i => (i?.score != null ? [i.score] : []));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const teamScore = getAreaScore(teamItems);
  const cultureScore = getAreaScore(cultureItems);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 2.5) return 'text-green-500';
    if (score >= 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Area 1: Founding Team */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan/10 rounded-lg">
                <Users className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 1: Founding Team</CardTitle>
                <CardDescription>Assess the founders' experience, commitment, and team dynamics</CardDescription>
              </div>
            </div>
            {teamScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(teamScore)}`}>
                {teamScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {TEAM_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area 2: Culture & Values */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 2: Culture & Values</CardTitle>
                <CardDescription>Evaluate company culture and alignment with your values</CardDescription>
              </div>
            </div>
            {cultureScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(cultureScore)}`}>
                {cultureScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {CULTURE_ITEMS.map((item) => (
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

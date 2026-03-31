'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import type { MentoringResponses, MentoringItem, MentoringRating } from '../assessment-client';

interface CommitmentStepProps {
  responses: MentoringResponses;
  onUpdate: (updates: Partial<MentoringResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AssessmentItem {
  id: keyof MentoringResponses;
  statement: string;
  mentorVersion: string;
  menteeVersion: string;
}

const COMMITMENT_ITEMS: AssessmentItem[] = [
  {
    id: 'commitmentConsistency',
    statement: 'We meet consistently and reliably as scheduled',
    mentorVersion: 'I show up consistently and don\'t cancel meetings last minute',
    menteeVersion: 'My mentor is reliable and makes our meetings a priority',
  },
  {
    id: 'commitmentPriority',
    statement: 'This relationship is treated as a priority, not an afterthought',
    mentorVersion: 'I prepare for our sessions and give my mentee focused attention',
    menteeVersion: 'I can tell my mentor genuinely prioritizes our relationship',
  },
  {
    id: 'commitmentFollow',
    statement: 'Action items and commitments are followed through on',
    mentorVersion: 'I follow through on introductions, resources, and promises I make',
    menteeVersion: 'When my mentor commits to something, it happens',
  },
  {
    id: 'commitmentInvestment',
    statement: 'There is genuine emotional investment in each other\'s success',
    mentorVersion: 'I genuinely care about my mentee\'s success beyond our sessions',
    menteeVersion: 'My mentor celebrates my wins and supports me through setbacks',
  },
  {
    id: 'commitmentLongterm',
    statement: 'There is commitment to the relationship\'s long-term value',
    mentorVersion: 'I think about my mentee\'s development over years, not just months',
    menteeVersion: 'My mentor is invested in my long-term growth, not just quick wins',
  },
];

const RATING_LABELS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

function RatingCard({
  item,
  value,
  role,
  onChange,
}: {
  item: AssessmentItem;
  value: MentoringItem;
  role: string;
  onChange: (response: MentoringItem) => void;
}) {
  const [showReflection, setShowReflection] = useState(false);

  const statement = role === 'mentor' ? item.mentorVersion : role === 'mentee' ? item.menteeVersion : item.statement;

  const handleRatingClick = (rating: MentoringRating) => {
    onChange({ ...value, rating });
  };

  const handleReflectionChange = (reflection: string) => {
    onChange({ ...value, reflection });
  };

  return (
    <div className="p-4 bg-nex-dark rounded-lg border border-nex-border">
      <p className="text-foreground mb-4">{statement}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {RATING_LABELS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRatingClick(option.value as MentoringRating)}
            className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
              value.rating === option.value
                ? 'border-red-500 bg-red-500/10 text-red-500'
                : 'border-nex-border bg-nex-surface hover:border-red-500/50 text-muted-foreground'
            }`}
          >
            {option.value} - {option.label}
          </button>
        ))}
      </div>

      {value.rating && (
        <div>
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="text-sm text-muted-foreground hover:text-red-500 transition-colors"
          >
            {showReflection ? '− Hide reflection' : '+ Add reflection'}
          </button>
          {showReflection && (
            <Textarea
              value={value.reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="How could you demonstrate greater commitment?"
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function CommitmentStep({ responses, onUpdate, onNext, onBack }: CommitmentStepProps) {
  const [localResponses, setLocalResponses] = useState({
    commitmentConsistency: responses.commitmentConsistency,
    commitmentPriority: responses.commitmentPriority,
    commitmentFollow: responses.commitmentFollow,
    commitmentInvestment: responses.commitmentInvestment,
    commitmentLongterm: responses.commitmentLongterm,
  });

  useEffect(() => {
    setLocalResponses({
      commitmentConsistency: responses.commitmentConsistency,
      commitmentPriority: responses.commitmentPriority,
      commitmentFollow: responses.commitmentFollow,
      commitmentInvestment: responses.commitmentInvestment,
      commitmentLongterm: responses.commitmentLongterm,
    });
  }, [responses]);

  const handleItemChange = (id: keyof typeof localResponses, response: MentoringItem) => {
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
  const isComplete = items.every(item => item.rating !== null);
  const completedCount = items.filter(item => item.rating !== null).length;

  const averageScore = items.filter(i => i.rating).length > 0
    ? items.filter(i => i.rating).reduce((sum, i) => sum + (i.rating || 0), 0) / items.filter(i => i.rating).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">4. Commitment</h2>
            <p className="text-sm text-muted-foreground">
              Consistent engagement and dedication to the relationship
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{completedCount} of 5 items rated</span>
        {averageScore > 0 && (
          <span className={`font-medium ${
            averageScore >= 4 ? 'text-green-500' : averageScore >= 3 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            Average: {averageScore.toFixed(1)}/5
          </span>
        )}
      </div>

      {/* Assessment Items */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Rate each statement</CardTitle>
          <CardDescription>
            Consider the level of dedication and follow-through in your relationship
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {COMMITMENT_ITEMS.map((item) => (
            <RatingCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              role={responses.context.mentoringRole}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Key Insight */}
      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-red-500">Why Commitment Matters: </span>
          <span className="text-muted-foreground">
            Mentoring is a long game. Inconsistent engagement signals the relationship
            isn&apos;t valued. The most transformative mentoring relationships are characterized
            by sustained commitment over years, not sporadic bursts of attention.
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
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Continue to Capability
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { MentoringResponses, MentoringItem, MentoringRating } from '../assessment-client';

interface ChallengeStepProps {
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

const CHALLENGE_ITEMS: AssessmentItem[] = [
  {
    id: 'challengeStretch',
    statement: 'Stretch assignments and challenging opportunities are part of our work',
    mentorVersion: 'I assign tasks that push my mentee beyond their comfort zone',
    menteeVersion: 'My mentor pushes me to take on challenges I wouldn\'t pursue alone',
  },
  {
    id: 'challengeGrowth',
    statement: 'Growth and learning are prioritized over short-term comfort',
    mentorVersion: 'I prioritize long-term growth over making my mentee feel good',
    menteeVersion: 'My mentor helps me embrace discomfort as part of growth',
  },
  {
    id: 'challengeAccountability',
    statement: 'There is accountability for commitments and follow-through',
    mentorVersion: 'I hold my mentee accountable for commitments they make',
    menteeVersion: 'My mentor holds me accountable when I don\'t follow through',
  },
  {
    id: 'challengeResilience',
    statement: 'Failures are treated as learning opportunities',
    mentorVersion: 'I help my mentee process setbacks and extract lessons',
    menteeVersion: 'My mentor helps me learn from mistakes without judgment',
  },
  {
    id: 'challengeComfort',
    statement: 'Difficult conversations happen when needed',
    mentorVersion: 'I have hard conversations when my mentee needs to hear truth',
    menteeVersion: 'My mentor tells me things I need to hear, even when difficult',
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
                ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                : 'border-nex-border bg-nex-surface hover:border-orange-500/50 text-muted-foreground'
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
            className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
          >
            {showReflection ? '− Hide reflection' : '+ Add reflection'}
          </button>
          {showReflection && (
            <Textarea
              value={value.reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="What stretch opportunities could you create or pursue?"
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ChallengeStep({ responses, onUpdate, onNext, onBack }: ChallengeStepProps) {
  const [localResponses, setLocalResponses] = useState({
    challengeStretch: responses.challengeStretch,
    challengeGrowth: responses.challengeGrowth,
    challengeAccountability: responses.challengeAccountability,
    challengeResilience: responses.challengeResilience,
    challengeComfort: responses.challengeComfort,
  });

  useEffect(() => {
    setLocalResponses({
      challengeStretch: responses.challengeStretch,
      challengeGrowth: responses.challengeGrowth,
      challengeAccountability: responses.challengeAccountability,
      challengeResilience: responses.challengeResilience,
      challengeComfort: responses.challengeComfort,
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
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">3. Challenge</h2>
            <p className="text-sm text-muted-foreground">
              Growth through stretch assignments and accountability
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
            Consider how well your relationship supports growth through challenge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHALLENGE_ITEMS.map((item) => (
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
      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-orange-500">Why Challenge Matters: </span>
          <span className="text-muted-foreground">
            Mentoring without challenge is just cheerleading. True development requires
            productive discomfort, accountability, and the courage to have difficult conversations.
            The best mentors push growth while providing support to handle it.
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
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Continue to Commitment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

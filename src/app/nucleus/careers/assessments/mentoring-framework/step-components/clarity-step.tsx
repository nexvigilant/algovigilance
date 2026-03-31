'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Target } from 'lucide-react';
import type { MentoringResponses, MentoringItem, MentoringRating } from '../assessment-client';

interface ClarityStepProps {
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

const CLARITY_ITEMS: AssessmentItem[] = [
  {
    id: 'clarityGoals',
    statement: 'We have clearly defined goals for our mentoring relationship',
    mentorVersion: 'I help my mentee set and articulate clear, achievable goals',
    menteeVersion: 'My mentor helps me clarify and work toward specific goals',
  },
  {
    id: 'clarityExpectations',
    statement: 'We have discussed and agreed upon mutual expectations',
    mentorVersion: 'I clearly communicate what I can and cannot offer as a mentor',
    menteeVersion: 'I understand what my mentor expects from me and vice versa',
  },
  {
    id: 'clarityBoundaries',
    statement: 'We respect appropriate boundaries in our relationship',
    mentorVersion: 'I maintain clear professional boundaries while being approachable',
    menteeVersion: 'I understand and respect the boundaries of our relationship',
  },
  {
    id: 'clarityFeedback',
    statement: 'Feedback is given and received constructively',
    mentorVersion: 'I provide specific, actionable feedback that promotes growth',
    menteeVersion: 'I receive clear feedback that helps me understand how to improve',
  },
  {
    id: 'clarityProgress',
    statement: 'We regularly review progress toward goals',
    mentorVersion: 'I help track and celebrate progress toward defined goals',
    menteeVersion: 'I can clearly see how I am progressing in our work together',
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
                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                : 'border-nex-border bg-nex-surface hover:border-blue-500/50 text-muted-foreground'
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
            className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
          >
            {showReflection ? '− Hide reflection' : '+ Add reflection'}
          </button>
          {showReflection && (
            <Textarea
              value={value.reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="What specific actions could improve this area?"
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ClarityStep({ responses, onUpdate, onNext, onBack }: ClarityStepProps) {
  const [localResponses, setLocalResponses] = useState({
    clarityGoals: responses.clarityGoals,
    clarityExpectations: responses.clarityExpectations,
    clarityBoundaries: responses.clarityBoundaries,
    clarityFeedback: responses.clarityFeedback,
    clarityProgress: responses.clarityProgress,
  });

  useEffect(() => {
    setLocalResponses({
      clarityGoals: responses.clarityGoals,
      clarityExpectations: responses.clarityExpectations,
      clarityBoundaries: responses.clarityBoundaries,
      clarityFeedback: responses.clarityFeedback,
      clarityProgress: responses.clarityProgress,
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
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Clarity</h2>
            <p className="text-sm text-muted-foreground">
              Clear goals, expectations, and mutual understanding
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
            Consider how well each statement describes your current mentoring relationship
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CLARITY_ITEMS.map((item) => (
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
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-blue-500">Why Clarity Matters: </span>
          <span className="text-muted-foreground">
            Research shows that mentoring relationships with clear goals and expectations are
            3x more likely to achieve meaningful outcomes. Ambiguity leads to frustration and disengagement.
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
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Continue to Connection
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

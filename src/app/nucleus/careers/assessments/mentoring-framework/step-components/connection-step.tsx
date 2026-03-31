'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Users } from 'lucide-react';
import type { MentoringResponses, MentoringItem, MentoringRating } from '../assessment-client';

interface ConnectionStepProps {
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

const CONNECTION_ITEMS: AssessmentItem[] = [
  {
    id: 'connectionTrust',
    statement: 'There is a high level of trust in our relationship',
    mentorVersion: 'My mentee trusts me with sensitive information and challenges',
    menteeVersion: 'I feel safe sharing my struggles and vulnerabilities with my mentor',
  },
  {
    id: 'connectionRapport',
    statement: 'We have built genuine rapport beyond just task-focused interactions',
    mentorVersion: 'I know my mentee as a whole person, not just their professional role',
    menteeVersion: 'My mentor takes genuine interest in me beyond my work performance',
  },
  {
    id: 'connectionSafety',
    statement: 'It feels psychologically safe to express concerns or disagreement',
    mentorVersion: 'I create space for my mentee to challenge my perspectives',
    menteeVersion: 'I can disagree with my mentor without fear of negative consequences',
  },
  {
    id: 'connectionEmpathy',
    statement: 'There is mutual understanding and empathy in our conversations',
    mentorVersion: 'I actively listen and understand my mentee\'s perspective',
    menteeVersion: 'My mentor genuinely understands my challenges and context',
  },
  {
    id: 'connectionAuthenticity',
    statement: 'We can be authentic and honest with each other',
    mentorVersion: 'I share my own failures and lessons learned honestly',
    menteeVersion: 'My mentor is genuine and doesn\'t present an idealized image',
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
                ? 'border-green-500 bg-green-500/10 text-green-500'
                : 'border-nex-border bg-nex-surface hover:border-green-500/50 text-muted-foreground'
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
            className="text-sm text-muted-foreground hover:text-green-500 transition-colors"
          >
            {showReflection ? '− Hide reflection' : '+ Add reflection'}
          </button>
          {showReflection && (
            <Textarea
              value={value.reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="How could you deepen connection in this area?"
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ConnectionStep({ responses, onUpdate, onNext, onBack }: ConnectionStepProps) {
  const [localResponses, setLocalResponses] = useState({
    connectionTrust: responses.connectionTrust,
    connectionRapport: responses.connectionRapport,
    connectionSafety: responses.connectionSafety,
    connectionEmpathy: responses.connectionEmpathy,
    connectionAuthenticity: responses.connectionAuthenticity,
  });

  useEffect(() => {
    setLocalResponses({
      connectionTrust: responses.connectionTrust,
      connectionRapport: responses.connectionRapport,
      connectionSafety: responses.connectionSafety,
      connectionEmpathy: responses.connectionEmpathy,
      connectionAuthenticity: responses.connectionAuthenticity,
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
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">2. Connection</h2>
            <p className="text-sm text-muted-foreground">
              Trust, rapport, and psychological safety
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
            Consider the quality of your interpersonal connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONNECTION_ITEMS.map((item) => (
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
      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-green-500">Why Connection Matters: </span>
          <span className="text-muted-foreground">
            The most impactful mentoring relationships are built on genuine human connection.
            Without trust and psychological safety, mentees won&apos;t share real challenges,
            and mentors can&apos;t provide meaningful guidance.
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
          className="bg-green-500 text-white hover:bg-green-600"
        >
          Continue to Challenge
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

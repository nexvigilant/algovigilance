'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import type { MentoringResponses, MentoringItem, MentoringRating } from '../assessment-client';

interface CapabilityStepProps {
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

const CAPABILITY_ITEMS: AssessmentItem[] = [
  {
    id: 'capabilityExpertise',
    statement: 'Relevant expertise and knowledge are shared effectively',
    mentorVersion: 'I share domain knowledge and expertise that benefits my mentee',
    menteeVersion: 'My mentor has valuable expertise relevant to my goals',
  },
  {
    id: 'capabilityTransfer',
    statement: 'Skills and knowledge transfer happens through our interactions',
    mentorVersion: 'My mentee is building new skills through our work together',
    menteeVersion: 'I am gaining practical skills and knowledge from my mentor',
  },
  {
    id: 'capabilityResources',
    statement: 'Helpful resources, tools, and frameworks are shared',
    mentorVersion: 'I provide useful resources, frameworks, and tools to my mentee',
    menteeVersion: 'My mentor shares helpful resources beyond just conversation',
  },
  {
    id: 'capabilityNetwork',
    statement: 'Professional network and connections are leveraged appropriately',
    mentorVersion: 'I make valuable introductions that advance my mentee\'s goals',
    menteeVersion: 'My mentor has opened doors through their network',
  },
  {
    id: 'capabilityAdaptation',
    statement: 'The approach adapts to the mentee\'s learning style and needs',
    mentorVersion: 'I adjust my mentoring style to what works best for my mentee',
    menteeVersion: 'My mentor adapts their approach to how I learn best',
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
                ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                : 'border-nex-border bg-nex-surface hover:border-purple-500/50 text-muted-foreground'
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
            className="text-sm text-muted-foreground hover:text-purple-500 transition-colors"
          >
            {showReflection ? '− Hide reflection' : '+ Add reflection'}
          </button>
          {showReflection && (
            <Textarea
              value={value.reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="What skills or knowledge could be better shared?"
              className="mt-2 bg-nex-surface border-nex-border min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function CapabilityStep({ responses, onUpdate, onNext, onBack }: CapabilityStepProps) {
  const [localResponses, setLocalResponses] = useState({
    capabilityExpertise: responses.capabilityExpertise,
    capabilityTransfer: responses.capabilityTransfer,
    capabilityResources: responses.capabilityResources,
    capabilityNetwork: responses.capabilityNetwork,
    capabilityAdaptation: responses.capabilityAdaptation,
  });

  useEffect(() => {
    setLocalResponses({
      capabilityExpertise: responses.capabilityExpertise,
      capabilityTransfer: responses.capabilityTransfer,
      capabilityResources: responses.capabilityResources,
      capabilityNetwork: responses.capabilityNetwork,
      capabilityAdaptation: responses.capabilityAdaptation,
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
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 rounded-r-lg">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">5. Capability</h2>
            <p className="text-sm text-muted-foreground">
              Skills transfer, knowledge sharing, and resource provision
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
            Consider the quality of knowledge and skill transfer in your relationship
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CAPABILITY_ITEMS.map((item) => (
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
      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-purple-500">Why Capability Matters: </span>
          <span className="text-muted-foreground">
            Beyond emotional support, effective mentoring delivers tangible capability building.
            This includes domain expertise, practical skills, useful frameworks, and access to
            professional networks that accelerate the mentee&apos;s development.
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

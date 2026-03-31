'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Network, MessageSquare, Heart, Info } from 'lucide-react';
import type { CompetencyResponses, CompetencyRating } from '../assessment-client';

interface RelationalCompetenciesStepProps {
  responses: CompetencyResponses;
  onUpdate: (updates: Partial<CompetencyResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CompetencyDefinition {
  id: keyof CompetencyResponses;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  behavioralAnchors: {
    level: number;
    description: string;
  }[];
}

const RELATIONAL_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: 'networkValue',
    name: 'Network Value',
    icon: Network,
    description: 'Quality and relevance of professional connections that can benefit the companies you advise.',
    behavioralAnchors: [
      { level: 1, description: 'Limited professional network; few connections relevant to advisory work' },
      { level: 2, description: 'Growing network; can occasionally make useful introductions' },
      { level: 3, description: 'Strong network in specific domains; regularly facilitates valuable connections' },
      { level: 4, description: 'Extensive network across multiple sectors; known as a connector' },
      { level: 5, description: 'Elite network access; can open doors to investors, customers, partners, and talent' },
    ],
  },
  {
    id: 'communicationInfluence',
    name: 'Communication & Influence',
    icon: MessageSquare,
    description: 'Ability to communicate clearly, persuade effectively, and influence without authority.',
    behavioralAnchors: [
      { level: 1, description: 'Communication sometimes unclear; struggles to gain buy-in for ideas' },
      { level: 2, description: 'Clear communicator; can influence when given formal authority' },
      { level: 3, description: 'Persuasive communicator; effectively influences peers and stakeholders' },
      { level: 4, description: 'Highly skilled influencer; changes minds through compelling arguments and relationships' },
      { level: 5, description: 'Exceptional communicator; inspires action and alignment across diverse groups' },
    ],
  },
  {
    id: 'mentoringCoaching',
    name: 'Mentoring & Coaching',
    icon: Heart,
    description: 'Ability to develop others through guidance, feedback, and supportive challenge.',
    behavioralAnchors: [
      { level: 1, description: 'Limited mentoring experience; tends to tell rather than coach' },
      { level: 2, description: 'Can mentor informally; provides useful advice when asked' },
      { level: 3, description: 'Active mentor; effectively develops individuals through guidance and feedback' },
      { level: 4, description: 'Skilled coach; uses questioning and reflection to unlock potential in others' },
      { level: 5, description: 'Transformational mentor; track record of developing leaders and building high-performing teams' },
    ],
  },
];

function CompetencyRatingCard({
  competency,
  value,
  onChange,
}: {
  competency: CompetencyDefinition;
  value: CompetencyRating | null;
  onChange: (rating: CompetencyRating) => void;
}) {
  const [showAnchors, setShowAnchors] = useState(false);
  const Icon = competency.icon;

  const handleRatingClick = (level: number) => {
    onChange({
      rating: level,
      confidence: value?.confidence || 'medium',
      notes: value?.notes || '',
    });
  };

  const handleConfidenceChange = (confidence: 'low' | 'medium' | 'high') => {
    if (value) {
      onChange({ ...value, confidence });
    }
  };

  const handleNotesChange = (notes: string) => {
    if (value) {
      onChange({ ...value, notes });
    }
  };

  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gold/10 rounded-lg">
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">{competency.name}</CardTitle>
              <CardDescription className="mt-1">{competency.description}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnchors(!showAnchors)}
            className="text-muted-foreground hover:text-gold"
          >
            <Info className="h-4 w-4 mr-1" />
            {showAnchors ? 'Hide' : 'Show'} Guide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Behavioral Anchors (collapsible) */}
        {showAnchors && (
          <div className="p-3 bg-nex-dark/50 rounded-lg space-y-2 text-sm">
            <p className="font-medium text-foreground mb-2">Rating Guide:</p>
            {competency.behavioralAnchors.map((anchor) => (
              <div key={anchor.level} className="flex gap-2">
                <Badge variant="outline" className="shrink-0 w-6 h-6 p-0 flex items-center justify-center">
                  {anchor.level}
                </Badge>
                <span className="text-muted-foreground">{anchor.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rating Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Your Rating (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleRatingClick(level)}
                className={`flex-1 py-3 rounded-lg border-2 transition-all font-semibold ${
                  value?.rating === level
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-nex-border bg-nex-dark hover:border-gold/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Level */}
        {value?.rating && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Confidence in this rating
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => handleConfidenceChange(conf)}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all text-sm capitalize ${
                    value.confidence === conf
                      ? conf === 'high'
                        ? 'border-green-500 bg-green-500/10 text-green-500'
                        : conf === 'medium'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-orange-500 bg-orange-500/10 text-orange-500'
                      : 'border-nex-border bg-nex-dark hover:border-gold/30 text-muted-foreground'
                  }`}
                >
                  {conf}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {value?.rating && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Evidence / Notes (optional)
            </label>
            <Textarea
              value={value.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Examples of when you've demonstrated this competency..."
              className="bg-nex-dark border-nex-border min-h-[80px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RelationalCompetenciesStep({ responses, onUpdate, onNext, onBack }: RelationalCompetenciesStepProps) {
  const [localResponses, setLocalResponses] = useState({
    networkValue: responses.networkValue,
    communicationInfluence: responses.communicationInfluence,
    mentoringCoaching: responses.mentoringCoaching,
  });

  useEffect(() => {
    setLocalResponses({
      networkValue: responses.networkValue,
      communicationInfluence: responses.communicationInfluence,
      mentoringCoaching: responses.mentoringCoaching,
    });
  }, [responses]);

  const handleCompetencyChange = (id: keyof typeof localResponses, rating: CompetencyRating) => {
    setLocalResponses(prev => ({ ...prev, [id]: rating }));
  };

  const handleContinue = () => {
    onUpdate(localResponses);
    onNext();
  };

  const handleBack = () => {
    onUpdate(localResponses);
    onBack();
  };

  const isComplete = localResponses.networkValue?.rating &&
                     localResponses.communicationInfluence?.rating &&
                     localResponses.mentoringCoaching?.rating;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-gold/10 to-transparent border-l-4 border-gold rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Relational Competencies</h2>
        <p className="text-sm text-muted-foreground">
          These competencies relate to your ability to build relationships, influence others,
          and develop people. Advisors create much of their value through connections.
        </p>
      </div>

      {/* Competency Cards */}
      {RELATIONAL_COMPETENCIES.map((competency) => (
        <CompetencyRatingCard
          key={competency.id}
          competency={competency}
          value={localResponses[competency.id as keyof typeof localResponses]}
          onChange={(rating) => handleCompetencyChange(competency.id as keyof typeof localResponses, rating)}
        />
      ))}

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
          Continue to Operational
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

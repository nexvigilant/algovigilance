'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lightbulb, Building2, Scale, Info } from 'lucide-react';
import type { CompetencyResponses, CompetencyRating } from '../assessment-client';

interface StrategicCompetenciesStepProps {
  responses: CompetencyResponses;
  onUpdate: (updates: Partial<CompetencyResponses>) => void;
  onNext: () => void;
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

const STRATEGIC_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    icon: Lightbulb,
    description: 'Ability to see the big picture, connect disparate information, and provide strategic guidance that shapes company direction.',
    behavioralAnchors: [
      { level: 1, description: 'Focuses primarily on tactical/operational issues; struggles to see beyond immediate concerns' },
      { level: 2, description: 'Can identify strategic implications when prompted; occasionally offers broader perspective' },
      { level: 3, description: 'Regularly contributes strategic insights; connects dots across different business areas' },
      { level: 4, description: 'Consistently provides valuable strategic guidance; anticipates market trends and opportunities' },
      { level: 5, description: 'Exceptional strategic vision; transforms company direction through breakthrough insights' },
    ],
  },
  {
    id: 'industryExpertise',
    name: 'Industry Expertise',
    icon: Building2,
    description: 'Deep knowledge of specific industries, markets, technologies, or functional domains that adds unique value.',
    behavioralAnchors: [
      { level: 1, description: 'General business knowledge; limited industry-specific expertise' },
      { level: 2, description: 'Working knowledge of 1-2 industries; can contribute basic domain insights' },
      { level: 3, description: 'Recognized expertise in specific domain; regularly consulted for industry perspective' },
      { level: 4, description: 'Deep expertise across multiple related domains; thought leader in specialty areas' },
      { level: 5, description: 'World-class expert; publishes, speaks, and shapes industry thinking' },
    ],
  },
  {
    id: 'governanceUnderstanding',
    name: 'Governance Understanding',
    icon: Scale,
    description: 'Knowledge of board structures, fiduciary duties, compliance requirements, and effective governance practices.',
    behavioralAnchors: [
      { level: 1, description: 'Limited understanding of governance; confuses advisory boards with boards of directors' },
      { level: 2, description: 'Basic awareness of governance structures; understands difference between advice and direction' },
      { level: 3, description: 'Solid grasp of governance; operates appropriately within advisory boundaries' },
      { level: 4, description: 'Strong governance knowledge; can help establish effective board practices' },
      { level: 5, description: 'Expert in governance; has served on multiple boards and can guide governance design' },
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
            <div className="p-2 bg-cyan/10 rounded-lg">
              <Icon className="h-5 w-5 text-cyan" />
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
            className="text-muted-foreground hover:text-cyan"
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
                    ? 'border-cyan bg-cyan/10 text-cyan'
                    : 'border-nex-border bg-nex-dark hover:border-cyan/50 text-muted-foreground hover:text-foreground'
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
                      : 'border-nex-border bg-nex-dark hover:border-cyan/30 text-muted-foreground'
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

export function StrategicCompetenciesStep({ responses, onUpdate, onNext }: StrategicCompetenciesStepProps) {
  const [localResponses, setLocalResponses] = useState({
    strategicThinking: responses.strategicThinking,
    industryExpertise: responses.industryExpertise,
    governanceUnderstanding: responses.governanceUnderstanding,
  });

  useEffect(() => {
    setLocalResponses({
      strategicThinking: responses.strategicThinking,
      industryExpertise: responses.industryExpertise,
      governanceUnderstanding: responses.governanceUnderstanding,
    });
  }, [responses]);

  const handleCompetencyChange = (id: keyof typeof localResponses, rating: CompetencyRating) => {
    setLocalResponses(prev => ({ ...prev, [id]: rating }));
  };

  const handleContinue = () => {
    onUpdate(localResponses);
    onNext();
  };

  const isComplete = localResponses.strategicThinking?.rating &&
                     localResponses.industryExpertise?.rating &&
                     localResponses.governanceUnderstanding?.rating;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-cyan/10 to-transparent border-l-4 border-cyan rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Strategic Competencies</h2>
        <p className="text-sm text-muted-foreground">
          These competencies relate to your ability to provide high-level guidance and
          strategic direction. Rate yourself honestly using the behavioral anchors as a guide.
        </p>
      </div>

      {/* Competency Cards */}
      {STRATEGIC_COMPETENCIES.map((competency) => (
        <CompetencyRatingCard
          key={competency.id}
          competency={competency}
          value={localResponses[competency.id as keyof typeof localResponses]}
          onChange={(rating) => handleCompetencyChange(competency.id as keyof typeof localResponses, rating)}
        />
      ))}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Continue to Relational
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

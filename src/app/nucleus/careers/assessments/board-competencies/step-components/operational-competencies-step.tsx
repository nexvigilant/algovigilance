'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, DollarSign, Shield, Globe, Info } from 'lucide-react';
import type { CompetencyResponses, CompetencyRating } from '../assessment-client';

interface OperationalCompetenciesStepProps {
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

const OPERATIONAL_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: 'financialAcumen',
    name: 'Financial Acumen',
    icon: DollarSign,
    description: 'Understanding of financial statements, metrics, funding, and business model economics.',
    behavioralAnchors: [
      { level: 1, description: 'Limited financial understanding; struggles with P&L and balance sheet basics' },
      { level: 2, description: 'Can read financial statements; understands basic business metrics' },
      { level: 3, description: 'Strong financial literacy; can analyze business performance and identify issues' },
      { level: 4, description: 'Deep financial expertise; understands funding structures, valuations, and strategic finance' },
      { level: 5, description: 'CFO-level capability; can guide financial strategy, fundraising, and M&A' },
    ],
  },
  {
    id: 'riskAssessment',
    name: 'Risk Assessment',
    icon: Shield,
    description: 'Ability to identify, evaluate, and help mitigate business risks across multiple dimensions.',
    behavioralAnchors: [
      { level: 1, description: 'Reactive to obvious risks; limited proactive risk identification' },
      { level: 2, description: 'Can identify common risks; provides basic mitigation suggestions' },
      { level: 3, description: 'Systematically assesses risks; helps prioritize and develop mitigation plans' },
      { level: 4, description: 'Advanced risk management; anticipates emerging risks and builds resilience' },
      { level: 5, description: 'Expert risk strategist; integrates risk thinking into all strategic decisions' },
    ],
  },
  {
    id: 'culturalIntelligence',
    name: 'Cultural Intelligence',
    icon: Globe,
    description: 'Ability to work effectively across cultural, generational, and organizational boundaries.',
    behavioralAnchors: [
      { level: 1, description: 'Works best with similar people; may struggle across cultural differences' },
      { level: 2, description: 'Aware of cultural differences; can adapt when explicitly guided' },
      { level: 3, description: 'Effectively navigates cultural differences; builds rapport across boundaries' },
      { level: 4, description: 'High cultural agility; bridges divides and facilitates cross-cultural collaboration' },
      { level: 5, description: 'Cultural bridge-builder; leads global/diverse teams and transforms organizational culture' },
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
            <div className="p-2 bg-purple-400/10 rounded-lg">
              <Icon className="h-5 w-5 text-purple-400" />
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
            className="text-muted-foreground hover:text-purple-400"
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
                    ? 'border-purple-400 bg-purple-400/10 text-purple-400'
                    : 'border-nex-border bg-nex-dark hover:border-purple-400/50 text-muted-foreground hover:text-foreground'
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
                      : 'border-nex-border bg-nex-dark hover:border-purple-400/30 text-muted-foreground'
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

export function OperationalCompetenciesStep({ responses, onUpdate, onNext, onBack }: OperationalCompetenciesStepProps) {
  const [localResponses, setLocalResponses] = useState({
    financialAcumen: responses.financialAcumen,
    riskAssessment: responses.riskAssessment,
    culturalIntelligence: responses.culturalIntelligence,
  });

  useEffect(() => {
    setLocalResponses({
      financialAcumen: responses.financialAcumen,
      riskAssessment: responses.riskAssessment,
      culturalIntelligence: responses.culturalIntelligence,
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

  const isComplete = localResponses.financialAcumen?.rating &&
                     localResponses.riskAssessment?.rating &&
                     localResponses.culturalIntelligence?.rating;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-purple-400/10 to-transparent border-l-4 border-purple-400 rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Operational Competencies</h2>
        <p className="text-sm text-muted-foreground">
          These competencies relate to your ability to understand and contribute to
          business operations, risk management, and organizational effectiveness.
        </p>
      </div>

      {/* Competency Cards */}
      {OPERATIONAL_COMPETENCIES.map((competency) => (
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
          className="bg-purple-500 text-white hover:bg-purple-600"
        >
          View Results
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

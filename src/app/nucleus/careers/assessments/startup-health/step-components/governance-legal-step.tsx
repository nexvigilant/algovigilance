'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Building, Scale } from 'lucide-react';
import type { StartupHealthResponses, HealthCheckResponse, HealthScore } from '../types';

interface GovernanceLegalStepProps {
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

const GOVERNANCE_ITEMS: HealthCheckItem[] = [
  {
    id: 'legalStructure',
    name: 'Legal Structure',
    question: 'Is the company properly incorporated with clean structure?',
    greenCriteria: 'Clean C-Corp/entity, standard docs',
    yellowCriteria: 'Some complexity but manageable',
    redCriteria: 'Messy structure, offshore issues',
  },
  {
    id: 'capTable',
    name: 'Cap Table',
    question: 'Is the cap table clean and well-managed?',
    greenCriteria: 'Clean cap table, founder equity intact',
    yellowCriteria: 'Some complexity, previous rounds well-structured',
    redCriteria: 'Messy cap table, over-diluted founders',
  },
  {
    id: 'advisorTerms',
    name: 'Advisor Terms',
    question: 'Are advisory terms standard and fair?',
    greenCriteria: 'Standard vesting, clear expectations',
    yellowCriteria: 'Non-standard but reasonable terms',
    redCriteria: 'Unclear terms, unreasonable expectations',
  },
  {
    id: 'boardComposition',
    name: 'Board Composition',
    question: 'Is the board composition appropriate for the stage?',
    greenCriteria: 'Balanced board, relevant expertise',
    yellowCriteria: 'Small but functional board',
    redCriteria: 'No board, or dominated by investors',
  },
];

const LEGAL_ITEMS: HealthCheckItem[] = [
  {
    id: 'regulatoryRisk',
    name: 'Regulatory Risk',
    question: 'What regulatory risks does the company face?',
    greenCriteria: 'Low regulatory burden, clear compliance',
    yellowCriteria: 'Some regulation, manageable compliance',
    redCriteria: 'Heavy regulation, unclear compliance status',
  },
  {
    id: 'ipProtection',
    name: 'IP Protection',
    question: 'Is intellectual property properly protected?',
    greenCriteria: 'Patents/trademarks filed, assignments clean',
    yellowCriteria: 'Basic IP protection in place',
    redCriteria: 'No IP protection, ownership unclear',
  },
  {
    id: 'liabilityExposure',
    name: 'Liability Exposure',
    question: 'What personal liability might you face as an advisor?',
    greenCriteria: 'D&O insurance, indemnification in place',
    yellowCriteria: 'Limited exposure, some protection',
    redCriteria: 'High exposure, no protection offered',
  },
  {
    id: 'complianceStatus',
    name: 'Compliance Status',
    question: 'Is the company in good standing on compliance matters?',
    greenCriteria: 'Clean compliance record, proactive approach',
    yellowCriteria: 'Minor issues being addressed',
    redCriteria: 'Outstanding legal issues, past violations',
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
    { score: 3 as HealthScore, label: 'Green', color: '#22c55e', criteria: item.greenCriteria },
    { score: 2 as HealthScore, label: 'Yellow', color: '#eab308', criteria: item.yellowCriteria },
    { score: 1 as HealthScore, label: 'Red', color: '#ef4444', criteria: item.redCriteria },
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
            className="w-full text-left p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: value?.score === option.score ? option.color : 'var(--nex-border)',
              backgroundColor: value?.score === option.score ? `${option.color}15` : 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <div>
                <span
                  className="font-medium text-sm"
                  style={{ color: value?.score === option.score ? option.color : 'inherit' }}
                >
                  {option.label}
                </span>
                <span className="text-sm text-muted-foreground ml-2">— {option.criteria}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

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

export function GovernanceLegalStep({ responses, onUpdate, onNext, onBack }: GovernanceLegalStepProps) {
  const [localResponses, setLocalResponses] = useState({
    legalStructure: responses.legalStructure,
    capTable: responses.capTable,
    advisorTerms: responses.advisorTerms,
    boardComposition: responses.boardComposition,
    regulatoryRisk: responses.regulatoryRisk,
    ipProtection: responses.ipProtection,
    liabilityExposure: responses.liabilityExposure,
    complianceStatus: responses.complianceStatus,
  });

  useEffect(() => {
    setLocalResponses({
      legalStructure: responses.legalStructure,
      capTable: responses.capTable,
      advisorTerms: responses.advisorTerms,
      boardComposition: responses.boardComposition,
      regulatoryRisk: responses.regulatoryRisk,
      ipProtection: responses.ipProtection,
      liabilityExposure: responses.liabilityExposure,
      complianceStatus: responses.complianceStatus,
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

  const governanceItems = [localResponses.legalStructure, localResponses.capTable, localResponses.advisorTerms, localResponses.boardComposition];
  const legalItems = [localResponses.regulatoryRisk, localResponses.ipProtection, localResponses.liabilityExposure, localResponses.complianceStatus];

  const governanceComplete = governanceItems.every(item => item?.score);
  const legalComplete = legalItems.every(item => item?.score);
  const isComplete = governanceComplete && legalComplete;

  const getAreaScore = (items: (HealthCheckResponse | null)[]) => {
    const scores = items.flatMap(i => (i?.score != null ? [i.score] : []));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const governanceScore = getAreaScore(governanceItems);
  const legalScore = getAreaScore(legalItems);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 2.5) return 'text-green-500';
    if (score >= 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Area 8: Governance & Structure */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 8: Governance & Structure</CardTitle>
                <CardDescription>Review corporate structure, cap table, and board composition</CardDescription>
              </div>
            </div>
            {governanceScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(governanceScore)}`}>
                {governanceScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {GOVERNANCE_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area 9: Risk & Legal */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Scale className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 9: Risk & Legal</CardTitle>
                <CardDescription>Assess regulatory, IP, and liability considerations</CardDescription>
              </div>
            </div>
            {legalScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(legalScore)}`}>
                {legalScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {LEGAL_ITEMS.map((item) => (
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

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Package, Target } from 'lucide-react';
import type { StartupHealthResponses, HealthCheckResponse, HealthScore } from '../types';

interface ProductMarketStepProps {
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

const PRODUCT_ITEMS: HealthCheckItem[] = [
  {
    id: 'problemClarity',
    name: 'Problem Clarity',
    question: 'Is the problem being solved clearly defined and significant?',
    greenCriteria: 'Clear, urgent problem with quantified impact',
    yellowCriteria: 'Problem exists but not well-articulated',
    redCriteria: 'Vague problem or solution looking for a problem',
  },
  {
    id: 'solutionViability',
    name: 'Solution Viability',
    question: 'Is the solution technically feasible and differentiated?',
    greenCriteria: 'Proven tech, clear differentiation, defensible',
    yellowCriteria: 'Feasible but differentiation unclear',
    redCriteria: 'Unproven tech, commodity solution, or vaporware',
  },
  {
    id: 'competitiveAdvantage',
    name: 'Competitive Advantage',
    question: 'What sustainable competitive advantage does the product have?',
    greenCriteria: 'Strong moat (IP, network effects, switching costs)',
    yellowCriteria: 'Some advantages but replicable',
    redCriteria: 'No clear moat, easily copied',
  },
  {
    id: 'productRoadmap',
    name: 'Product Roadmap',
    question: 'Is there a clear, realistic product roadmap?',
    greenCriteria: 'Prioritized roadmap based on customer feedback',
    yellowCriteria: 'Roadmap exists but priorities unclear',
    redCriteria: 'No roadmap or unrealistic feature plans',
  },
];

const MARKET_ITEMS: HealthCheckItem[] = [
  {
    id: 'marketSize',
    name: 'Market Size',
    question: 'Is the total addressable market large enough?',
    greenCriteria: 'Large TAM ($1B+), clear path to capture',
    yellowCriteria: 'Moderate market, growth potential unclear',
    redCriteria: 'Small or shrinking market',
  },
  {
    id: 'marketTiming',
    name: 'Market Timing',
    question: 'Is the timing right for this product/market?',
    greenCriteria: 'Clear tailwinds, market inflection point',
    yellowCriteria: 'Neutral timing, no urgency',
    redCriteria: 'Too early, too late, or headwinds',
  },
  {
    id: 'customerValidation',
    name: 'Customer Validation',
    question: 'Is there evidence of real customer demand?',
    greenCriteria: 'Paying customers, strong engagement metrics',
    yellowCriteria: 'Pilot users, letters of intent',
    redCriteria: 'No customer validation, assumptions only',
  },
  {
    id: 'competitiveLandscape',
    name: 'Competitive Landscape',
    question: 'How crowded is the competitive landscape?',
    greenCriteria: 'Clear positioning, manageable competition',
    yellowCriteria: 'Crowded but differentiated',
    redCriteria: 'Red ocean, dominant incumbents, or no competitors (bad sign)',
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

export function ProductMarketStep({ responses, onUpdate, onNext, onBack }: ProductMarketStepProps) {
  const [localResponses, setLocalResponses] = useState({
    problemClarity: responses.problemClarity,
    solutionViability: responses.solutionViability,
    competitiveAdvantage: responses.competitiveAdvantage,
    productRoadmap: responses.productRoadmap,
    marketSize: responses.marketSize,
    marketTiming: responses.marketTiming,
    customerValidation: responses.customerValidation,
    competitiveLandscape: responses.competitiveLandscape,
  });

  useEffect(() => {
    setLocalResponses({
      problemClarity: responses.problemClarity,
      solutionViability: responses.solutionViability,
      competitiveAdvantage: responses.competitiveAdvantage,
      productRoadmap: responses.productRoadmap,
      marketSize: responses.marketSize,
      marketTiming: responses.marketTiming,
      customerValidation: responses.customerValidation,
      competitiveLandscape: responses.competitiveLandscape,
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

  const productItems = [localResponses.problemClarity, localResponses.solutionViability, localResponses.competitiveAdvantage, localResponses.productRoadmap];
  const marketItems = [localResponses.marketSize, localResponses.marketTiming, localResponses.customerValidation, localResponses.competitiveLandscape];

  const productComplete = productItems.every(item => item?.score);
  const marketComplete = marketItems.every(item => item?.score);
  const isComplete = productComplete && marketComplete;

  const getAreaScore = (items: (HealthCheckResponse | null)[]) => {
    const scores = items.flatMap(i => (i?.score != null ? [i.score] : []));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const productScore = getAreaScore(productItems);
  const marketScore = getAreaScore(marketItems);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 2.5) return 'text-green-500';
    if (score >= 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Area 3: Product/Service */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 3: Product/Service</CardTitle>
                <CardDescription>Evaluate the problem-solution fit and product viability</CardDescription>
              </div>
            </div>
            {productScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(productScore)}`}>
                {productScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {PRODUCT_ITEMS.map((item) => (
            <HealthCheckCard
              key={item.id}
              item={item}
              value={localResponses[item.id as keyof typeof localResponses]}
              onChange={(response) => handleItemChange(item.id as keyof typeof localResponses, response)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area 4: Market Opportunity */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Target className="h-5 w-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Area 4: Market Opportunity</CardTitle>
                <CardDescription>Assess market size, timing, and competitive dynamics</CardDescription>
              </div>
            </div>
            {marketScore !== null && (
              <div className={`text-lg font-semibold ${getScoreColor(marketScore)}`}>
                {marketScore.toFixed(1)}/3
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {MARKET_ITEMS.map((item) => (
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

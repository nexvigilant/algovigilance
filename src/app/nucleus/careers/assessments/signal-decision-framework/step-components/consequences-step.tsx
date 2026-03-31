'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Scenario } from '../scenario-data';

interface ConsequencesStepProps {
  scenario: Scenario;
  rankings: { [key: string]: number };
  onRankingsChange: (rankings: { [key: string]: number }) => void;
}

const consequenceTypes = [
  {
    key: 'truePositive',
    label: 'True Positive',
    description: 'Signal is real AND correctly identified',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  {
    key: 'falsePositive',
    label: 'False Positive',
    description: 'Signal is noise BUT escalated as real',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  {
    key: 'falseNegative',
    label: 'False Negative',
    description: 'Signal is real BUT dismissed',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  {
    key: 'trueNegative',
    label: 'True Negative',
    description: 'Signal is noise AND correctly identified',
    icon: ShieldCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  }
];

const severityColors = {
  low: 'bg-blue-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

export function ConsequencesStep({ scenario, rankings, onRankingsChange }: ConsequencesStepProps) {
  const { consequences } = scenario;

  const handleRankChange = (key: string, value: number) => {
    onRankingsChange({ ...rankings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold font-headline text-foreground">
          Step 3: Consider the Consequences
        </h2>
        <p className="text-muted-foreground mt-2">
          {consequences.prompt}
        </p>
      </div>

      {/* Decision Matrix */}
      <div className="grid md:grid-cols-2 gap-4">
        {consequenceTypes.map((type) => {
          const Icon = type.icon;
          const data = consequences[type.key as keyof typeof consequences] as {
            outcome: string;
            impact: string;
            example: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
          };

          return (
            <Card
              key={type.key}
              className={`p-5 ${type.bgColor} ${type.borderColor} border`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-5 w-5 ${type.color}`} />
                <h3 className="font-semibold text-foreground">{type.label}</h3>
                <Badge
                  className={`ml-auto ${severityColors[data.severity]} text-white text-xs`}
                >
                  {data.severity}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {type.description}
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Impact</span>
                  <p className="text-sm text-foreground">{data.impact}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Example</span>
                  <p className="text-sm text-muted-foreground italic">{data.example}</p>
                </div>

                {/* Concern Ranking */}
                <div className="pt-3 border-t border-muted">
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                    Your Concern Level (1-5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleRankChange(type.key, level)}
                        className={`flex-1 py-2 text-sm font-medium rounded transition-all ${
                          rankings[type.key] === level
                            ? 'bg-cyan text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reflection Card */}
      <Card className="p-5 bg-nex-dark border-gold/30">
        <h4 className="font-semibold text-gold mb-2">Expert Reflection</h4>
        <p className="text-sm text-muted-foreground">
          {consequences.reflection}
        </p>
      </Card>

      {/* Summary of Rankings */}
      {Object.keys(rankings).length === 4 && (
        <Card className="p-4 bg-cyan/5 border-cyan/20">
          <h4 className="font-semibold text-sm mb-2">Your Risk Priorities</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(rankings)
              .sort((a, b) => b[1] - a[1])
              .map(([key, value]) => {
                const type = consequenceTypes.find(t => t.key === key);
                return (
                  <Badge key={key} variant="outline" className="text-xs">
                    {type?.label}: {value}/5
                  </Badge>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}

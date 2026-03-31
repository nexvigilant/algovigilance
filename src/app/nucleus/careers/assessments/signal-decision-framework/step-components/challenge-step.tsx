'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';
import type { Scenario } from '../scenario-data';

interface ChallengeStepProps {
  scenario: Scenario;
  response: string;
  onResponseChange: (response: string) => void;
}

export function ChallengeStep({ scenario, response, onResponseChange }: ChallengeStepProps) {
  const { challenge, title, difficulty, tags } = scenario;

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline text-foreground">{title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {difficulty}
            </Badge>
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Context Card */}
      <Card className="p-6 bg-nex-surface border-nex-border">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Scenario Context
        </h3>
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
          {challenge.context}
        </p>
      </Card>

      {/* Signal Data Card */}
      <Card className="p-6 bg-nex-surface border-nex-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan" />
          Signal Data
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-cyan">{challenge.signalData.prr}</div>
            <div className="text-xs text-muted-foreground">PRR</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-cyan">{challenge.signalData.ror}</div>
            <div className="text-xs text-muted-foreground">ROR</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-cyan">{challenge.signalData.cases}</div>
            <div className="text-xs text-muted-foreground">Cases</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-cyan">{challenge.signalData.timeframe}</div>
            <div className="text-xs text-muted-foreground">Timeframe</div>
          </div>
        </div>
        {challenge.signalData.confidence95Lower && challenge.signalData.confidence95Upper && (
          <div className="mt-3 text-sm text-muted-foreground text-center">
            95% CI: [{challenge.signalData.confidence95Lower} - {challenge.signalData.confidence95Upper}]
          </div>
        )}
      </Card>

      {/* Clinical Context Card */}
      <Card className="p-6 bg-nex-surface border-nex-border">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Clinical Context
        </h3>
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
          {challenge.clinicalContext}
        </p>
      </Card>

      {/* Key Considerations */}
      <Card className="p-6 bg-cyan/5 border-cyan/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan" />
          Key Considerations
        </h3>
        <ul className="space-y-2">
          {challenge.keyConsiderations.map((consideration, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-cyan font-bold">•</span>
              <span className="text-muted-foreground">{consideration}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Challenge Question */}
      <Card className="p-6 bg-nex-dark border-gold/30">
        <h3 className="text-lg font-semibold mb-4 text-gold">
          Step 1: Identify the Challenge
        </h3>
        <p className="text-foreground mb-4 font-medium">
          {challenge.question}
        </p>
        <textarea
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Describe the primary challenge you need to address in evaluating this signal..."
          className="w-full h-32 p-4 bg-nex-surface border border-nex-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Consider: What makes this signal concerning? What confounders exist? What information gaps need to be addressed?
        </p>
      </Card>
    </div>
  );
}

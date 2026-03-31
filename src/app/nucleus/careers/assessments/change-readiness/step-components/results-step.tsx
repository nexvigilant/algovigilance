'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Wallet,
  Users,
  Heart,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Lightbulb
} from 'lucide-react';
import type { ReadinessResponses } from '../assessment-client';

interface ResultsStepProps {
  responses: ReadinessResponses;
  onBack: () => void;
  onReset: () => void;
}

interface DimensionResult {
  name: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  indicators: { name: string; score: number }[];
  avgScore: number;
}

const READINESS_LEVELS = [
  { min: 4.0, label: 'Ready to Launch', description: 'You have strong foundations for transition', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { min: 3.0, label: 'Building Momentum', description: 'Good progress, some areas need strengthening', color: 'text-cyan', bgColor: 'bg-cyan/10' },
  { min: 2.0, label: 'Foundation Phase', description: 'Significant preparation needed before transition', color: 'text-gold', bgColor: 'bg-gold/10' },
  { min: 0, label: 'Early Exploration', description: 'Focus on building fundamental readiness first', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const DIMENSION_RECOMMENDATIONS: Record<string, { low: string; medium: string; high: string }> = {
  financial: {
    low: 'Priority: Build 6-12 months runway before transition. Consider side projects to diversify income while employed.',
    medium: 'Strengthen emergency fund and explore income diversification options. You have time but shouldn\'t delay.',
    high: 'Your financial foundation is strong. Focus on optimizing rather than building.',
  },
  network: {
    low: 'Priority: Invest heavily in relationship building. Attend industry events, reconnect with former colleagues, seek mentors.',
    medium: 'Your network has potential. Focus on deepening relationships and converting contacts to advocates.',
    high: 'Strong network foundation. Activate your network by sharing your transition intentions with key contacts.',
  },
  emotional: {
    low: 'Priority: Work on identity flexibility and resilience. Consider coaching or therapy to prepare psychologically.',
    medium: 'Good emotional awareness. Practice self-motivation and rejection resilience through low-stakes experiments.',
    high: 'Your mindset is well-suited for portfolio work. Channel this emotional readiness into action.',
  },
  practical: {
    low: 'Priority: Solve logistics blockers. Explore health insurance alternatives, negotiate time, align family support.',
    medium: 'Address remaining practical barriers. Have explicit conversations with family about your plans.',
    high: 'Practical foundations are solid. You have bandwidth and support to execute.',
  },
};

export function ResultsStep({ responses, onBack, onReset }: ResultsStepProps) {
  const dimensions = useMemo<DimensionResult[]>(() => {
    return [
      {
        name: 'Financial',
        color: 'green-500',
        icon: Wallet,
        indicators: [
          { name: 'Financial Runway', score: responses.financialRunway?.score || 0 },
          { name: 'Income Diversity', score: responses.incomeStability?.score || 0 },
          { name: 'Emergency Fund', score: responses.emergencyFund?.score || 0 },
          { name: 'Debt Obligations', score: responses.debtLevel?.score || 0 },
        ],
        avgScore: ((responses.financialRunway?.score || 0) + (responses.incomeStability?.score || 0) +
                   (responses.emergencyFund?.score || 0) + (responses.debtLevel?.score || 0)) / 4,
      },
      {
        name: 'Network',
        color: 'cyan',
        icon: Users,
        indicators: [
          { name: 'Professional Network', score: responses.professionalNetwork?.score || 0 },
          { name: 'Industry Reputation', score: responses.industryReputation?.score || 0 },
          { name: 'Referral Sources', score: responses.referralSources?.score || 0 },
          { name: 'Mentor Access', score: responses.mentorAccess?.score || 0 },
        ],
        avgScore: ((responses.professionalNetwork?.score || 0) + (responses.industryReputation?.score || 0) +
                   (responses.referralSources?.score || 0) + (responses.mentorAccess?.score || 0)) / 4,
      },
      {
        name: 'Emotional',
        color: 'pink-500',
        icon: Heart,
        indicators: [
          { name: 'Identity Flexibility', score: responses.identityFlexibility?.score || 0 },
          { name: 'Uncertainty Tolerance', score: responses.uncertaintyTolerance?.score || 0 },
          { name: 'Rejection Resilience', score: responses.rejectionResilience?.score || 0 },
          { name: 'Self-Motivation', score: responses.selfMotivation?.score || 0 },
        ],
        avgScore: ((responses.identityFlexibility?.score || 0) + (responses.uncertaintyTolerance?.score || 0) +
                   (responses.rejectionResilience?.score || 0) + (responses.selfMotivation?.score || 0)) / 4,
      },
      {
        name: 'Practical',
        color: 'gold',
        icon: Settings,
        indicators: [
          { name: 'Time Availability', score: responses.timeAvailability?.score || 0 },
          { name: 'Family Support', score: responses.familySupport?.score || 0 },
          { name: 'Health Insurance', score: responses.healthInsurance?.score || 0 },
        ],
        avgScore: ((responses.timeAvailability?.score || 0) + (responses.familySupport?.score || 0) +
                   (responses.healthInsurance?.score || 0)) / 3,
      },
    ];
  }, [responses]);

  const overallScore = useMemo(() => {
    const totalIndicators = 15;
    const totalScore = dimensions.reduce((sum, dim) =>
      sum + dim.indicators.reduce((s, ind) => s + ind.score, 0), 0);
    return totalScore / totalIndicators;
  }, [dimensions]);

  const readinessLevel = READINESS_LEVELS.find(level => overallScore >= level.min) || READINESS_LEVELS[3];

  // Find top strengths and gaps
  const allIndicators = dimensions.flatMap(dim =>
    dim.indicators.map(ind => ({ ...ind, dimension: dim.name }))
  );
  const sortedIndicators = [...allIndicators].sort((a, b) => b.score - a.score);
  const topStrengths = sortedIndicators.filter(ind => ind.score >= 4).slice(0, 3);
  const topGaps = sortedIndicators.filter(ind => ind.score <= 2).slice(-3).reverse();

  const handleExport = () => {
    const results = {
      assessmentDate: new Date().toISOString(),
      overallScore: overallScore.toFixed(2),
      readinessLevel: readinessLevel.label,
      dimensions: dimensions.map(dim => ({
        name: dim.name,
        score: dim.avgScore.toFixed(2),
        indicators: dim.indicators,
      })),
      topStrengths: topStrengths.map(s => `${s.name} (${s.score}/5)`),
      developmentAreas: topGaps.map(g => `${g.name} (${g.score}/5)`),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-readiness-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className={`${readinessLevel.bgColor} border-none`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge className={`${readinessLevel.bgColor} ${readinessLevel.color} border-none mb-3`}>
                Change Readiness Profile
              </Badge>
              <h2 className={`text-3xl font-bold ${readinessLevel.color}`}>
                {readinessLevel.label}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg">
                {readinessLevel.description}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${readinessLevel.color}`}>
                {overallScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">out of 5.0</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan" />
            Dimension Breakdown
          </CardTitle>
          <CardDescription>
            Your readiness across the four key dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dimensions.map((dim) => {
            const Icon = dim.icon;
            const dimKey = dim.name.toLowerCase() as keyof typeof DIMENSION_RECOMMENDATIONS;
            const recommendation = dim.avgScore >= 4 ? DIMENSION_RECOMMENDATIONS[dimKey].high :
                                  dim.avgScore >= 3 ? DIMENSION_RECOMMENDATIONS[dimKey].medium :
                                  DIMENSION_RECOMMENDATIONS[dimKey].low;

            return (
              <div key={dim.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 bg-${dim.color}/10 rounded`}>
                      <Icon className={`h-4 w-4 text-${dim.color}`} />
                    </div>
                    <span className="font-medium text-foreground">{dim.name}</span>
                  </div>
                  <span className={`font-bold ${
                    dim.avgScore >= 4 ? 'text-green-500' :
                    dim.avgScore >= 3 ? 'text-cyan' :
                    dim.avgScore >= 2 ? 'text-gold' : 'text-orange-500'
                  }`}>
                    {dim.avgScore.toFixed(1)} / 5
                  </span>
                </div>
                <Progress value={(dim.avgScore / 5) * 100} className="h-2" />
                <div className="text-sm text-muted-foreground pl-8">
                  {recommendation}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Strengths & Gaps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <Card className="bg-nex-surface border-nex-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStrengths.length > 0 ? (
              <div className="space-y-3">
                {topStrengths.map((strength) => (
                  <div key={strength.name} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{strength.name}</div>
                      <div className="text-xs text-muted-foreground">{strength.dimension}</div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 border-none">
                      {strength.score}/5
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No indicators scored 4 or above yet. Focus on building these areas.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Development Areas */}
        <Card className="bg-nex-surface border-nex-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              Development Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topGaps.length > 0 ? (
              <div className="space-y-3">
                {topGaps.map((gap) => (
                  <div key={gap.name} className="flex items-center justify-between p-3 bg-orange-500/5 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{gap.name}</div>
                      <div className="text-xs text-muted-foreground">{gap.dimension}</div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-500 border-none">
                      {gap.score}/5
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No critical gaps identified. All indicators at 3 or above.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="bg-gradient-to-br from-cyan/5 to-purple-500/5 border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-cyan" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overallScore >= 4 ? (
              <>
                <p className="text-foreground">
                  <strong>You&apos;re in a strong position to begin your transition.</strong> Your foundations are solid across dimensions.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Complete the Board Advisory Readiness Assessment to explore specific paths
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Begin testing the market with low-commitment advisory conversations
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Develop your Board Advisor Competencies with the 9 Competencies Assessment
                  </li>
                </ul>
              </>
            ) : overallScore >= 3 ? (
              <>
                <p className="text-foreground">
                  <strong>You&apos;re building momentum.</strong> Address the gaps identified above before making major moves.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Focus on your lowest-scoring dimension for the next 3-6 months
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Start building your portfolio career while employed (nights/weekends)
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Set a target reassessment date 3 months from now
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-foreground">
                  <strong>Focus on foundation-building before transition.</strong> Significant preparation will reduce risk.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Prioritize financial runway—aim for 6-12 months before any transition
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Invest in network-building while you have the stability of employment
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan mt-1 shrink-0" />
                    Consider the Hidden Job Market Navigator for strategic networking
                  </li>
                </ul>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 pt-4">
        <Button variant="outline" onClick={onBack} className="border-nex-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Review Responses
        </Button>
        <Button variant="outline" onClick={onReset} className="border-nex-border">
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
        <Button onClick={handleExport} className="bg-cyan text-nex-deep hover:bg-cyan-glow ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>
    </div>
  );
}

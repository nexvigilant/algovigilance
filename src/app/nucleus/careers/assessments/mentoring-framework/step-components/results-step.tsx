'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Target,
  Users,
  Sparkles,
  Heart,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type { MentoringResponses, MentoringItem } from '../assessment-client';

interface ResultsStepProps {
  responses: MentoringResponses;
  onBack: () => void;
  onReset: () => void;
}

interface CategoryResult {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  items: MentoringItem[];
  score: number;
  interpretation: string;
  recommendations: string[];
}

const SCORE_INTERPRETATIONS = {
  high: { min: 4, label: 'Strong', color: 'text-green-500' },
  medium: { min: 3, label: 'Developing', color: 'text-yellow-500' },
  low: { min: 0, label: 'Needs Focus', color: 'text-red-500' },
};

function getInterpretation(score: number): typeof SCORE_INTERPRETATIONS.high {
  if (score >= 4) return SCORE_INTERPRETATIONS.high;
  if (score >= 3) return SCORE_INTERPRETATIONS.medium;
  return SCORE_INTERPRETATIONS.low;
}

function getClarityRecommendations(score: number): string[] {
  if (score >= 4) return [
    'Continue regular goal reviews to maintain alignment',
    'Document your agreements for future reference',
    'Share your goal-setting approach with others',
  ];
  if (score >= 3) return [
    'Schedule a dedicated session to clarify expectations',
    'Create a written mentoring agreement with specific goals',
    'Establish regular check-ins to review progress',
  ];
  return [
    'URGENT: Have an honest conversation about what you both want',
    'Define 3-5 specific, measurable goals together',
    'Set clear boundaries and meeting cadence',
    'Consider whether the relationship has a clear purpose',
  ];
}

function getConnectionRecommendations(score: number): string[] {
  if (score >= 4) return [
    'Maintain the trust through continued vulnerability',
    'Celebrate this strength - it\'s the foundation of impact',
    'Consider deepening the relationship with shared activities',
  ];
  if (score >= 3) return [
    'Invest time in non-work conversations',
    'Share more personal experiences and failures',
    'Create more psychological safety for hard topics',
  ];
  return [
    'URGENT: Address trust issues before proceeding',
    'Have an open conversation about the relationship quality',
    'Consider if there\'s a fundamental compatibility issue',
    'Start with small acts of vulnerability to build trust',
  ];
}

function getChallengeRecommendations(score: number): string[] {
  if (score >= 4) return [
    'Continue pushing for growth-edge experiences',
    'Document the challenges and lessons learned',
    'Balance challenge with support and recognition',
  ];
  if (score >= 3) return [
    'Identify one stretch assignment to work on together',
    'Practice having more difficult conversations',
    'Establish accountability mechanisms for commitments',
  ];
  return [
    'The relationship may be too comfortable - growth requires discomfort',
    'Discuss why hard conversations aren\'t happening',
    'Set specific stretch goals that create productive tension',
    'Consider if there\'s avoidance of necessary feedback',
  ];
}

function getCommitmentRecommendations(score: number): string[] {
  if (score >= 4) return [
    'This dedication is rare - acknowledge and appreciate it',
    'Discuss long-term vision for the relationship',
    'Consider how to make the investment sustainable',
  ];
  if (score >= 3) return [
    'Create accountability for meeting consistency',
    'Discuss what\'s getting in the way of follow-through',
    'Set calendar commitments that can\'t be easily cancelled',
  ];
  return [
    'CRITICAL: Inconsistent engagement signals low priority',
    'Have an honest conversation about commitment levels',
    'Consider if this relationship should continue',
    'If keeping it, establish non-negotiable commitments',
  ];
}

function getCapabilityRecommendations(score: number): string[] {
  if (score >= 4) return [
    'Continue leveraging expertise and network strategically',
    'Document the skills being developed for tracking',
    'Consider what additional capabilities could be built',
  ];
  if (score >= 3) return [
    'Identify specific skills gaps to address together',
    'Request introductions that would advance goals',
    'Ask for frameworks and resources used by mentor',
  ];
  return [
    'Assess whether there\'s an expertise match for your needs',
    'Be specific about what capabilities you want to develop',
    'Consider if a different mentor might be better suited',
    'Mentor: consider what unique value you can provide',
  ];
}

export function ResultsStep({ responses, onBack, onReset }: ResultsStepProps) {
  const results = useMemo(() => {
    const calculateScore = (items: MentoringItem[]): number => {
      const rated = items.filter(i => i.rating !== null);
      if (rated.length === 0) return 0;
      return rated.reduce((sum, i) => sum + (i.rating || 0), 0) / rated.length;
    };

    const clarity: CategoryResult = {
      name: 'Clarity',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      items: [
        responses.clarityGoals,
        responses.clarityExpectations,
        responses.clarityBoundaries,
        responses.clarityFeedback,
        responses.clarityProgress,
      ],
      score: 0,
      interpretation: '',
      recommendations: [],
    };
    clarity.score = calculateScore(clarity.items);
    clarity.interpretation = getInterpretation(clarity.score).label;
    clarity.recommendations = getClarityRecommendations(clarity.score);

    const connection: CategoryResult = {
      name: 'Connection',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      items: [
        responses.connectionTrust,
        responses.connectionRapport,
        responses.connectionSafety,
        responses.connectionEmpathy,
        responses.connectionAuthenticity,
      ],
      score: 0,
      interpretation: '',
      recommendations: [],
    };
    connection.score = calculateScore(connection.items);
    connection.interpretation = getInterpretation(connection.score).label;
    connection.recommendations = getConnectionRecommendations(connection.score);

    const challenge: CategoryResult = {
      name: 'Challenge',
      icon: Sparkles,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      items: [
        responses.challengeStretch,
        responses.challengeGrowth,
        responses.challengeAccountability,
        responses.challengeResilience,
        responses.challengeComfort,
      ],
      score: 0,
      interpretation: '',
      recommendations: [],
    };
    challenge.score = calculateScore(challenge.items);
    challenge.interpretation = getInterpretation(challenge.score).label;
    challenge.recommendations = getChallengeRecommendations(challenge.score);

    const commitment: CategoryResult = {
      name: 'Commitment',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      items: [
        responses.commitmentConsistency,
        responses.commitmentPriority,
        responses.commitmentFollow,
        responses.commitmentInvestment,
        responses.commitmentLongterm,
      ],
      score: 0,
      interpretation: '',
      recommendations: [],
    };
    commitment.score = calculateScore(commitment.items);
    commitment.interpretation = getInterpretation(commitment.score).label;
    commitment.recommendations = getCommitmentRecommendations(commitment.score);

    const capability: CategoryResult = {
      name: 'Capability',
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500',
      items: [
        responses.capabilityExpertise,
        responses.capabilityTransfer,
        responses.capabilityResources,
        responses.capabilityNetwork,
        responses.capabilityAdaptation,
      ],
      score: 0,
      interpretation: '',
      recommendations: [],
    };
    capability.score = calculateScore(capability.items);
    capability.interpretation = getInterpretation(capability.score).label;
    capability.recommendations = getCapabilityRecommendations(capability.score);

    const categories = [clarity, connection, challenge, commitment, capability];
    const overallScore = categories.reduce((sum, c) => sum + c.score, 0) / categories.length;

    const strengths = categories.filter(c => c.score >= 4);
    const developmentAreas = categories.filter(c => c.score < 3);
    const criticalGaps = categories.filter(c => c.score < 2.5);

    return {
      categories,
      overallScore,
      strengths,
      developmentAreas,
      criticalGaps,
      context: responses.context,
    };
  }, [responses]);

  const getOverallInterpretation = () => {
    if (results.overallScore >= 4) {
      return {
        label: 'Thriving Mentoring Relationship',
        description: 'Your mentoring relationship shows strength across the 5 C\'s. Focus on maintaining this excellence and deepening the impact.',
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
      };
    }
    if (results.overallScore >= 3) {
      return {
        label: 'Developing Mentoring Relationship',
        description: 'Your relationship has a solid foundation with room for growth. Focus on the specific areas identified below to strengthen the partnership.',
        icon: TrendingUp,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
      };
    }
    return {
      label: 'Relationship Needs Attention',
      description: 'Several areas of your mentoring relationship need focused attention. Consider having an honest conversation about expectations and commitment.',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    };
  };

  const handleExport = () => {
    const exportData = {
      assessmentDate: new Date().toISOString(),
      context: results.context,
      overallScore: results.overallScore.toFixed(2),
      categories: results.categories.map(c => ({
        name: c.name,
        score: c.score.toFixed(2),
        interpretation: c.interpretation,
        recommendations: c.recommendations,
      })),
      strengths: results.strengths.map(s => s.name),
      developmentAreas: results.developmentAreas.map(d => d.name),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentoring-5cs-assessment-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const overall = getOverallInterpretation();
  const OverallIcon = overall.icon;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className={`${overall.bgColor} border-2 ${overall.color.replace('text-', 'border-')}`}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 ${overall.bgColor} rounded-xl`}>
              <OverallIcon className={`h-8 w-8 ${overall.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-xl ${overall.color}`}>{overall.label}</CardTitle>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${overall.color}`}>
                    {results.overallScore.toFixed(1)}/5
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </div>
              <CardDescription className="mt-2 text-foreground/80">
                {overall.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 5 C's Breakdown */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">5 C&apos;s Breakdown</CardTitle>
          <CardDescription>Your scores across each dimension of effective mentoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.categories.map((category) => {
              const Icon = category.icon;
              const interpretation = getInterpretation(category.score);

              return (
                <div key={category.name} className={`p-4 rounded-lg border-l-4 ${category.borderColor} bg-nex-dark`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${category.bgColor} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{category.name}</h4>
                        <Badge variant="outline" className={interpretation.color}>
                          {interpretation.label}
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${category.color}`}>
                      {category.score.toFixed(1)}/5
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="h-2 bg-nex-border rounded-full mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${category.color.replace('text-', 'bg-')}`}
                      style={{ width: `${(category.score / 5) * 100}%` }}
                    />
                  </div>

                  {/* Top Recommendation */}
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className={`h-4 w-4 mt-0.5 ${category.color}`} />
                    <span className="text-muted-foreground">{category.recommendations[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Development Areas */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="bg-nex-surface border-nex-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg text-foreground">Relationship Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {results.strengths.length > 0 ? (
              <ul className="space-y-2">
                {results.strengths.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.name} className="flex items-center gap-2 text-sm">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">({s.score.toFixed(1)}/5)</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No areas scored 4.0 or above. Focus on building foundational strength across all 5 C&apos;s.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Development Areas */}
        <Card className="bg-nex-surface border-nex-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg text-foreground">Focus Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {results.developmentAreas.length > 0 ? (
              <ul className="space-y-2">
                {results.developmentAreas.map((d) => {
                  const Icon = d.icon;
                  return (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <Icon className={`h-4 w-4 ${d.color}`} />
                      <span className="text-foreground">{d.name}</span>
                      <span className="text-red-500">({d.score.toFixed(1)}/5)</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                All areas scored 3.0 or above. Great foundation to build upon!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Priority Actions</CardTitle>
          <CardDescription>
            Your top recommendations based on assessment results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.categories
              .sort((a, b) => a.score - b.score)
              .slice(0, 3)
              .map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={category.name} className="p-4 bg-nex-dark rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gold">#{index + 1}</span>
                      <span className={`p-1 ${category.bgColor} rounded`}>
                        <Icon className={`h-4 w-4 ${category.color}`} />
                      </span>
                      <span className="font-medium text-foreground">Strengthen {category.name}</span>
                    </div>
                    <ul className="space-y-1 ml-8">
                      {category.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-cyan">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
        <h3 className="font-semibold text-gold mb-2">Making Progress</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Share these results with your {results.context.mentoringRole === 'mentor' ? 'mentee' : 'mentor'} to
          have a productive conversation about strengthening your relationship. Schedule a dedicated
          session to discuss specific actions you can both take.
        </p>
        <p className="text-sm text-muted-foreground">
          Retake this assessment in 3-6 months to track your progress.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Capability
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-cyan text-cyan hover:bg-cyan/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button
            onClick={onReset}
            className="bg-gold text-nex-deep hover:bg-gold-bright"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}

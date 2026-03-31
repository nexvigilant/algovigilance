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
  Star,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Building2,
  Scale,
  Network,
  MessageSquare,
  Heart,
  DollarSign,
  Shield,
  Globe,
  Target,
  Sparkles
} from 'lucide-react';
import type { CompetencyResponses } from '../assessment-client';

interface ResultsStepProps {
  responses: CompetencyResponses;
  onBack: () => void;
  onReset: () => void;
}

interface CompetencyInfo {
  id: keyof CompetencyResponses;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'strategic' | 'relational' | 'operational';
  categoryColor: string;
}

const COMPETENCIES: CompetencyInfo[] = [
  { id: 'strategicThinking', name: 'Strategic Thinking', shortName: 'Strategic', icon: Lightbulb, category: 'strategic', categoryColor: 'cyan' },
  { id: 'industryExpertise', name: 'Industry Expertise', shortName: 'Industry', icon: Building2, category: 'strategic', categoryColor: 'cyan' },
  { id: 'governanceUnderstanding', name: 'Governance Understanding', shortName: 'Governance', icon: Scale, category: 'strategic', categoryColor: 'cyan' },
  { id: 'networkValue', name: 'Network Value', shortName: 'Network', icon: Network, category: 'relational', categoryColor: 'gold' },
  { id: 'communicationInfluence', name: 'Communication & Influence', shortName: 'Influence', icon: MessageSquare, category: 'relational', categoryColor: 'gold' },
  { id: 'mentoringCoaching', name: 'Mentoring & Coaching', shortName: 'Mentoring', icon: Heart, category: 'relational', categoryColor: 'gold' },
  { id: 'financialAcumen', name: 'Financial Acumen', shortName: 'Financial', icon: DollarSign, category: 'operational', categoryColor: 'purple-400' },
  { id: 'riskAssessment', name: 'Risk Assessment', shortName: 'Risk', icon: Shield, category: 'operational', categoryColor: 'purple-400' },
  { id: 'culturalIntelligence', name: 'Cultural Intelligence', shortName: 'Cultural', icon: Globe, category: 'operational', categoryColor: 'purple-400' },
];

function getOverallProfile(averageScore: number): { label: string; description: string; color: string } {
  if (averageScore >= 4.5) {
    return {
      label: 'Expert Advisor',
      description: 'You demonstrate exceptional capabilities across board advisor competencies. Ready for complex, high-stakes advisory roles.',
      color: 'text-green-500'
    };
  }
  if (averageScore >= 3.5) {
    return {
      label: 'Experienced Advisor',
      description: 'Strong foundation with clear signature strengths. Well-positioned for advisory board roles with some development areas.',
      color: 'text-cyan'
    };
  }
  if (averageScore >= 2.5) {
    return {
      label: 'Developing Advisor',
      description: 'Building advisory capabilities with room for growth. Focus on strengthening top competencies and addressing key gaps.',
      color: 'text-gold'
    };
  }
  return {
    label: 'Emerging Advisor',
    description: 'Early in advisory journey. Prioritize building foundational competencies and gaining relevant experience.',
    color: 'text-orange-500'
  };
}

export function ResultsStep({ responses, onBack, onReset }: ResultsStepProps) {
  const analysis = useMemo(() => {
    const scores = COMPETENCIES.map(comp => ({
      ...comp,
      rating: responses[comp.id]?.rating || 0,
      confidence: responses[comp.id]?.confidence || 'medium',
      notes: responses[comp.id]?.notes || '',
    }));

    const totalScore = scores.reduce((sum, s) => sum + s.rating, 0);
    const averageScore = totalScore / 9;

    // Category averages
    const categoryAverages = {
      strategic: scores.filter(s => s.category === 'strategic').reduce((sum, s) => sum + s.rating, 0) / 3,
      relational: scores.filter(s => s.category === 'relational').reduce((sum, s) => sum + s.rating, 0) / 3,
      operational: scores.filter(s => s.category === 'operational').reduce((sum, s) => sum + s.rating, 0) / 3,
    };

    // Sort by rating
    const sortedByRating = [...scores].sort((a, b) => b.rating - a.rating);
    const topStrengths = sortedByRating.slice(0, 3);
    const developmentAreas = sortedByRating.filter(s => s.rating <= 2);
    const growthOpportunities = sortedByRating.filter(s => s.rating === 3);

    // Signature strengths (4 or 5)
    const signatureStrengths = scores.filter(s => s.rating >= 4);

    // Low confidence ratings
    const lowConfidence = scores.filter(s => s.confidence === 'low');

    return {
      scores,
      totalScore,
      averageScore,
      categoryAverages,
      topStrengths,
      signatureStrengths,
      developmentAreas,
      growthOpportunities,
      lowConfidence,
      profile: getOverallProfile(averageScore),
    };
  }, [responses]);

  const handleExport = () => {
    const exportData = {
      assessmentDate: new Date().toISOString(),
      profile: analysis.profile.label,
      averageScore: analysis.averageScore.toFixed(2),
      categoryAverages: analysis.categoryAverages,
      competencies: analysis.scores.map(s => ({
        name: s.name,
        rating: s.rating,
        confidence: s.confidence,
        notes: s.notes,
      })),
      signatureStrengths: analysis.signatureStrengths.map(s => s.name),
      developmentAreas: analysis.developmentAreas.map(s => s.name),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-competencies-assessment-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overall Profile */}
      <Card className="bg-gradient-to-br from-nex-surface to-nex-dark border-nex-border overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan/10 rounded-xl">
                <Target className="h-8 w-8 text-cyan" />
              </div>
              <div>
                <CardTitle className="text-2xl text-foreground">Your Advisor Profile</CardTitle>
                <CardDescription>Based on your self-assessment across 9 competencies</CardDescription>
              </div>
            </div>
            <Badge className={`text-lg px-4 py-2 ${analysis.profile.color} bg-transparent border-current`}>
              {analysis.profile.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{analysis.profile.description}</p>

          {/* Overall Score */}
          <div className="flex items-center gap-4 p-4 bg-nex-dark/50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan">{analysis.averageScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
            <div className="flex-1">
              <Progress value={(analysis.averageScore / 5) * 100} className="h-3" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">/ 5</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { key: 'strategic', label: 'Strategic', color: 'cyan', icon: Lightbulb },
          { key: 'relational', label: 'Relational', color: 'gold', icon: Network },
          { key: 'operational', label: 'Operational', color: 'purple-400', icon: Shield },
        ].map(cat => {
          const Icon = cat.icon;
          const avg = analysis.categoryAverages[cat.key as keyof typeof analysis.categoryAverages];
          return (
            <Card key={cat.key} className="bg-nex-surface border-nex-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-5 w-5 text-${cat.color}`} />
                  <span className="font-semibold text-foreground">{cat.label}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold text-${cat.color}`}>{avg.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm mb-1">/ 5</span>
                </div>
                <Progress value={(avg / 5) * 100} className="h-2 mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Competencies Visual */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg">Competency Profile</CardTitle>
          <CardDescription>Your ratings across all 9 board advisor competencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.scores.map(comp => {
              const Icon = comp.icon;
              return (
                <div key={comp.id} className="flex items-center gap-3">
                  <div className={`p-1.5 bg-${comp.categoryColor}/10 rounded`}>
                    <Icon className={`h-4 w-4 text-${comp.categoryColor}`} />
                  </div>
                  <div className="w-32 text-sm text-foreground truncate">{comp.shortName}</div>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-6 flex-1 rounded ${
                            level <= comp.rating
                              ? comp.rating >= 4
                                ? 'bg-green-500'
                                : comp.rating >= 3
                                ? 'bg-cyan'
                                : 'bg-orange-500'
                              : 'bg-nex-dark'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-8 text-right font-semibold text-foreground">{comp.rating}</div>
                  {comp.confidence === 'low' && (
                    <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                      ?
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Signature Strengths */}
      {analysis.signatureStrengths.length > 0 && (
        <Card className="bg-gradient-to-r from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg text-green-500">Signature Strengths</CardTitle>
            </div>
            <CardDescription>
              These are your standout competencies (rated 4 or 5). Lead with these in advisory conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {analysis.signatureStrengths.map(comp => {
                const Icon = comp.icon;
                return (
                  <div key={comp.id} className="flex items-center gap-3 p-3 bg-green-500/5 rounded-lg">
                    <Icon className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-foreground">{comp.name}</span>
                    <Badge className="ml-auto bg-green-500 text-white">{comp.rating}/5</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Areas */}
      {analysis.developmentAreas.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/5 to-transparent border-orange-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg text-orange-500">Development Areas</CardTitle>
            </div>
            <CardDescription>
              These competencies scored 2 or below. Consider focused development or partnering with complementary advisors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {analysis.developmentAreas.map(comp => {
                const Icon = comp.icon;
                return (
                  <div key={comp.id} className="flex items-center gap-3 p-3 bg-orange-500/5 rounded-lg">
                    <Icon className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-foreground">{comp.name}</span>
                    <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">{comp.rating}/5</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Opportunities */}
      {analysis.growthOpportunities.length > 0 && (
        <Card className="bg-gradient-to-r from-cyan/5 to-transparent border-cyan/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan" />
              <CardTitle className="text-lg text-cyan">Growth Opportunities</CardTitle>
            </div>
            <CardDescription>
              These competencies scored 3—solid foundation with potential to become signature strengths.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {analysis.growthOpportunities.map(comp => {
                const Icon = comp.icon;
                return (
                  <div key={comp.id} className="flex items-center gap-3 p-3 bg-cyan/5 rounded-lg">
                    <Icon className="h-5 w-5 text-cyan" />
                    <span className="font-medium text-foreground">{comp.name}</span>
                    <Badge variant="outline" className="ml-auto border-cyan text-cyan">{comp.rating}/5</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Confidence Warning */}
      {analysis.lowConfidence.length > 0 && (
        <Card className="bg-nex-surface border-nex-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-gold mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Confidence Check</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You marked low confidence on {analysis.lowConfidence.length} rating(s):
                  {' '}{analysis.lowConfidence.map(c => c.shortName).join(', ')}.
                  Consider gathering feedback from colleagues to validate these self-assessments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-nex-dark/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-semibold text-sm">1</div>
            <div>
              <p className="font-medium text-foreground">Lead with Strengths</p>
              <p className="text-sm text-muted-foreground">
                Position yourself around your top competencies in advisory conversations and profiles.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-nex-dark/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-sm">2</div>
            <div>
              <p className="font-medium text-foreground">Address Critical Gaps</p>
              <p className="text-sm text-muted-foreground">
                {analysis.developmentAreas.length > 0
                  ? `Focus development on ${analysis.developmentAreas[0]?.name} to round out your profile.`
                  : 'Your lowest areas are still solid—consider elevating one to signature strength status.'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-nex-dark/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-400 font-semibold text-sm">3</div>
            <div>
              <p className="font-medium text-foreground">Seek Validation</p>
              <p className="text-sm text-muted-foreground">
                Share this assessment with trusted colleagues or mentors to check your self-assessment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Review Answers
        </Button>
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
          className="bg-cyan text-nex-deep hover:bg-cyan-glow sm:ml-auto"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );
}

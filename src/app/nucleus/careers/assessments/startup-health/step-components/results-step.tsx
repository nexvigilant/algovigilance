'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Heart,
  Package,
  Target,
  Coins,
  TrendingUp,
  DollarSign,
  Building,
  Scale,
  Sparkles,
} from 'lucide-react';
import type { CompanyInfo, StartupHealthResponses, HealthCheckResponse } from '../types';

interface ResultsStepProps {
  companyInfo: CompanyInfo;
  responses: StartupHealthResponses;
  onBack: () => void;
  onReset: () => void;
}

interface AreaDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: (keyof StartupHealthResponses)[];
}

const AREAS: AreaDefinition[] = [
  {
    id: 'team',
    name: 'Founding Team',
    icon: Users,
    color: '#06b6d4', // cyan
    items: ['founderExperience', 'founderCommitment', 'founderCoachability', 'teamComplementary'],
  },
  {
    id: 'culture',
    name: 'Culture & Values',
    icon: Heart,
    color: '#ec4899', // pink
    items: ['cultureClarity', 'valuesAlignment', 'decisionMaking', 'conflictResolution'],
  },
  {
    id: 'product',
    name: 'Product/Service',
    icon: Package,
    color: '#a855f7', // purple
    items: ['problemClarity', 'solutionViability', 'competitiveAdvantage', 'productRoadmap'],
  },
  {
    id: 'market',
    name: 'Market Opportunity',
    icon: Target,
    color: '#f59e0b', // gold/amber
    items: ['marketSize', 'marketTiming', 'customerValidation', 'competitiveLandscape'],
  },
  {
    id: 'business',
    name: 'Business Model',
    icon: Coins,
    color: '#10b981', // emerald
    items: ['revenueModel', 'unitEconomics', 'scalability', 'pricingStrategy'],
  },
  {
    id: 'traction',
    name: 'Traction & Metrics',
    icon: TrendingUp,
    color: '#06b6d4', // cyan
    items: ['currentTraction', 'growthRate', 'keyMetrics', 'customerRetention'],
  },
  {
    id: 'financials',
    name: 'Financials',
    icon: DollarSign,
    color: '#f59e0b', // gold
    items: ['currentRunway', 'fundraisingPlan', 'burnRate', 'financialTransparency'],
  },
  {
    id: 'governance',
    name: 'Governance & Structure',
    icon: Building,
    color: '#3b82f6', // blue
    items: ['legalStructure', 'capTable', 'advisorTerms', 'boardComposition'],
  },
  {
    id: 'legal',
    name: 'Risk & Legal',
    icon: Scale,
    color: '#f97316', // orange
    items: ['regulatoryRisk', 'ipProtection', 'liabilityExposure', 'complianceStatus'],
  },
  {
    id: 'fit',
    name: 'Your Fit',
    icon: Sparkles,
    color: '#a855f7', // purple
    items: ['expertiseRelevance', 'networkValue', 'timeCommitment', 'compensationFairness', 'passionAlignment'],
  },
];

const ITEM_LABELS: Record<keyof StartupHealthResponses, string> = {
  founderExperience: 'Founder Experience',
  founderCommitment: 'Founder Commitment',
  founderCoachability: 'Coachability',
  teamComplementary: 'Complementary Skills',
  cultureClarity: 'Culture Clarity',
  valuesAlignment: 'Values Alignment',
  decisionMaking: 'Decision Making',
  conflictResolution: 'Conflict Resolution',
  problemClarity: 'Problem Clarity',
  solutionViability: 'Solution Viability',
  competitiveAdvantage: 'Competitive Advantage',
  productRoadmap: 'Product Roadmap',
  marketSize: 'Market Size',
  marketTiming: 'Market Timing',
  customerValidation: 'Customer Validation',
  competitiveLandscape: 'Competitive Landscape',
  revenueModel: 'Revenue Model',
  unitEconomics: 'Unit Economics',
  scalability: 'Scalability',
  pricingStrategy: 'Pricing Strategy',
  currentTraction: 'Current Traction',
  growthRate: 'Growth Rate',
  keyMetrics: 'Key Metrics',
  customerRetention: 'Customer Retention',
  currentRunway: 'Current Runway',
  fundraisingPlan: 'Fundraising Plan',
  burnRate: 'Burn Rate',
  financialTransparency: 'Financial Transparency',
  legalStructure: 'Legal Structure',
  capTable: 'Cap Table',
  advisorTerms: 'Advisor Terms',
  boardComposition: 'Board Composition',
  regulatoryRisk: 'Regulatory Risk',
  ipProtection: 'IP Protection',
  liabilityExposure: 'Liability Exposure',
  complianceStatus: 'Compliance Status',
  expertiseRelevance: 'Expertise Relevance',
  networkValue: 'Network Value',
  timeCommitment: 'Time Commitment',
  compensationFairness: 'Compensation Fairness',
  passionAlignment: 'Passion Alignment',
};

export function ResultsStep({ companyInfo, responses, onBack, onReset }: ResultsStepProps) {
  const analysis = useMemo(() => {
    // Calculate area scores
    const areaScores = AREAS.map(area => {
      const items = area.items.map(id => responses[id]);
      const scores = items.filter(i => i?.score !== undefined && i.score !== null).map(i => i?.score ?? 0);
      const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
      return {
        ...area,
        score: avgScore,
        greenCount: items.filter(i => i?.score === 3).length,
        yellowCount: items.filter(i => i?.score === 2).length,
        redCount: items.filter(i => i?.score === 1).length,
      };
    });

    // Calculate overall score
    const allScores = Object.values(responses).filter(r => r?.score !== undefined && r.score !== null).map(r => r?.score ?? 0);
    const overallScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

    // Count totals
    const totalGreen = Object.values(responses).filter(r => r?.score === 3).length;
    const totalYellow = Object.values(responses).filter(r => r?.score === 2).length;
    const totalRed = Object.values(responses).filter(r => r?.score === 1).length;

    // Get strengths (green items)
    const strengths = Object.entries(responses)
      .filter(([_, r]) => r?.score === 3)
      .map(([id]) => ITEM_LABELS[id as keyof StartupHealthResponses]);

    // Get red flags (red items)
    const redFlags = Object.entries(responses)
      .filter(([_, r]) => r?.score === 1)
      .map(([id]) => ({
        name: ITEM_LABELS[id as keyof StartupHealthResponses],
        notes: (responses[id as keyof StartupHealthResponses] as HealthCheckResponse)?.notes,
      }));

    // Determine recommendation
    let recommendation: 'proceed' | 'cautious' | 'pass';
    let recommendationText: string;

    if (overallScore >= 2.5 && totalRed <= 3) {
      recommendation = 'proceed';
      recommendationText = 'Strong Candidate - Proceed with Confidence';
    } else if (overallScore >= 1.8 && totalRed <= 8) {
      recommendation = 'cautious';
      recommendationText = 'Proceed with Caution - Address Key Concerns';
    } else {
      recommendation = 'pass';
      recommendationText = 'Consider Passing - Too Many Red Flags';
    }

    return {
      areaScores,
      overallScore,
      totalGreen,
      totalYellow,
      totalRed,
      strengths,
      redFlags,
      recommendation,
      recommendationText,
    };
  }, [responses]);

  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      company: companyInfo,
      summary: {
        overallScore: analysis.overallScore.toFixed(2),
        recommendation: analysis.recommendationText,
        greenCount: analysis.totalGreen,
        yellowCount: analysis.totalYellow,
        redCount: analysis.totalRed,
      },
      areaScores: analysis.areaScores.map(area => ({
        area: area.name,
        score: area.score.toFixed(2),
        green: area.greenCount,
        yellow: area.yellowCount,
        red: area.redCount,
      })),
      strengths: analysis.strengths,
      redFlags: analysis.redFlags,
      detailedResponses: Object.entries(responses).reduce((acc, [key, value]) => {
        if (value?.score) {
          acc[ITEM_LABELS[key as keyof StartupHealthResponses]] = {
            score: value.score === 3 ? 'Green' : value.score === 2 ? 'Yellow' : 'Red',
            notes: value.notes || '',
          };
        }
        return acc;
      }, {} as Record<string, { score: string; notes: string }>),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-health-${companyInfo.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRecommendationStyle = () => {
    switch (analysis.recommendation) {
      case 'proceed':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: CheckCircle2,
          iconColor: 'text-green-500',
          textColor: 'text-green-500',
        };
      case 'cautious':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          textColor: 'text-yellow-500',
        };
      case 'pass':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: XCircle,
          iconColor: 'text-red-500',
          textColor: 'text-red-500',
        };
    }
  };

  const recStyle = getRecommendationStyle();
  const RecIcon = recStyle.icon;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="p-4 bg-gradient-to-r from-cyan/10 to-purple-500/10 border border-cyan/20 rounded-lg">
        <h2 className="text-2xl font-bold text-foreground">{companyInfo.name || 'Startup'}</h2>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
          {companyInfo.stage && (
            <Badge variant="outline" className="capitalize">{companyInfo.stage.replace('-', ' ')}</Badge>
          )}
          {companyInfo.industry && <span>{companyInfo.industry}</span>}
          {companyInfo.advisoryType && (
            <span>• {companyInfo.advisoryType.charAt(0).toUpperCase() + companyInfo.advisoryType.slice(1)} Advisory</span>
          )}
        </div>
      </div>

      {/* Overall Recommendation */}
      <Card className={`${recStyle.bg} ${recStyle.border} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${recStyle.bg}`}>
              <RecIcon className={`h-8 w-8 ${recStyle.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${recStyle.textColor}`}>
                {analysis.recommendationText}
              </h3>
              <p className="text-muted-foreground mt-1">
                Overall Score: <span className="font-semibold">{analysis.overallScore.toFixed(2)}/3.00</span>
              </p>
            </div>
            <div className="hidden md:flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">{analysis.totalGreen}</div>
                <div className="text-xs text-muted-foreground">Green</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">{analysis.totalYellow}</div>
                <div className="text-xs text-muted-foreground">Yellow</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{analysis.totalRed}</div>
                <div className="text-xs text-muted-foreground">Red</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area-by-Area Breakdown */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">10-Area Breakdown</CardTitle>
          <CardDescription>Score distribution across all due diligence areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.areaScores.map((area) => {
              const Icon = area.icon;
              const scoreColor = area.score >= 2.5 ? 'text-green-500' : area.score >= 1.5 ? 'text-yellow-500' : 'text-red-500';

              return (
                <div key={area.id} className="flex items-center gap-3 p-3 bg-nex-dark rounded-lg">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${area.color}15` }}
                  >
                    <span style={{ color: area.color }}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{area.name}</div>
                    <div className="flex gap-2 mt-1">
                      {area.greenCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                          {area.greenCount} green
                        </span>
                      )}
                      {area.yellowCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
                          {area.yellowCount} yellow
                        </span>
                      )}
                      {area.redCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                          {area.redCount} red
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${scoreColor}`}>
                    {area.score.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Red Flags */}
      {analysis.redFlags.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-red-500 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Red Flags ({analysis.redFlags.length})
            </CardTitle>
            <CardDescription>Areas requiring serious attention before proceeding</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.redFlags.map((flag, i) => (
                <li key={i} className="p-3 bg-nex-dark rounded-lg">
                  <div className="font-medium text-foreground">{flag.name}</div>
                  {flag.notes && (
                    <div className="text-sm text-muted-foreground mt-1">{flag.notes}</div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-green-500 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Key Strengths ({analysis.strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, i) => (
                <Badge key={i} className="bg-green-500/20 text-green-500 border-green-500/30">
                  {strength}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Edit
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
          variant="outline"
          onClick={onReset}
          className="border-nex-border text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-nex-dark/50 rounded-lg text-xs text-muted-foreground">
        <p>
          <strong>Disclaimer:</strong> This checklist is a due diligence tool to help structure your evaluation.
          It does not constitute investment or legal advice. Always consult with appropriate professionals
          before making advisory commitments.
        </p>
      </div>
    </div>
  );
}

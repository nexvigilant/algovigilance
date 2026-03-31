'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  FileText,
  Building,
  Brain,
  TrendingUp,
  MessageSquare,
  Users,
  Target,
  Gauge,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { generateAssessmentPDF } from '@/lib/pdf';
import type { PerformanceResponses, ConditionPreference } from '../assessment-client';

interface ResultsStepProps {
  responses: PerformanceResponses;
  onBack: () => void;
  onReset: () => void;
}

interface DimensionResult {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  items: { label: string; preference: ConditionPreference; leftLabel: string; rightLabel: string }[];
  criticalCount: number;
}

const DIMENSION_CONFIG = {
  environment: {
    name: 'Environment',
    icon: Building,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  autonomy: {
    name: 'Autonomy',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  challenge: {
    name: 'Challenge',
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  feedback: {
    name: 'Feedback',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  collaboration: {
    name: 'Collaboration',
    icon: Users,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  purpose: {
    name: 'Purpose',
    icon: Target,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
  },
};

export function ResultsStep({ responses, onBack, onReset }: ResultsStepProps) {
  const results = useMemo(() => {
    const dimensions: DimensionResult[] = [
      {
        ...DIMENSION_CONFIG.environment,
        items: [
          { label: 'Work Location', preference: responses.envRemoteVsOffice, leftLabel: 'Remote', rightLabel: 'In-Office' },
          { label: 'Noise Level', preference: responses.envNoiseLevel, leftLabel: 'Quiet', rightLabel: 'Energetic' },
          { label: 'Schedule', preference: responses.envStructuredVsFlexible, leftLabel: 'Structured', rightLabel: 'Flexible' },
          { label: 'Privacy', preference: responses.envPrivacyLevel, leftLabel: 'Private', rightLabel: 'Open' },
          { label: 'Tools', preference: responses.envToolsAccess, leftLabel: 'Minimal', rightLabel: 'Latest' },
          { label: 'Travel', preference: responses.envTravelFrequency, leftLabel: 'None', rightLabel: 'Frequent' },
        ],
        criticalCount: 0,
      },
      {
        ...DIMENSION_CONFIG.autonomy,
        items: [
          { label: 'Decisions', preference: responses.autoDecisionAuthority, leftLabel: 'Directed', rightLabel: 'Full Authority' },
          { label: 'Schedule', preference: responses.autoScheduleFlexibility, leftLabel: 'Set', rightLabel: 'Control' },
          { label: 'Methods', preference: responses.autoMethodFreedom, leftLabel: 'Defined', rightLabel: 'Free' },
          { label: 'Priorities', preference: responses.autoPrioritySetting, leftLabel: 'Assigned', rightLabel: 'Self-Set' },
          { label: 'Resources', preference: responses.autoResourceControl, leftLabel: 'Provided', rightLabel: 'Budget Auth' },
        ],
        criticalCount: 0,
      },
      {
        ...DIMENSION_CONFIG.challenge,
        items: [
          { label: 'Stretch', preference: responses.challengeStretchLevel, leftLabel: 'Comfortable', rightLabel: 'Edge' },
          { label: 'Variety', preference: responses.challengeVariety, leftLabel: 'Consistent', rightLabel: 'High' },
          { label: 'Learning', preference: responses.challengeLearningOpportunity, leftLabel: 'Apply', rightLabel: 'Constant' },
          { label: 'Risk', preference: responses.challengeFailureTolerance, leftLabel: 'Minimize', rightLabel: 'OK' },
          { label: 'Pace', preference: responses.challengeProgressionSpeed, leftLabel: 'Steady', rightLabel: 'Rapid' },
        ],
        criticalCount: 0,
      },
      {
        ...DIMENSION_CONFIG.feedback,
        items: [
          { label: 'Frequency', preference: responses.feedbackFrequency, leftLabel: 'Infrequent', rightLabel: 'Continuous' },
          { label: 'Format', preference: responses.feedbackFormat, leftLabel: 'Written', rightLabel: 'Verbal' },
          { label: 'Source', preference: responses.feedbackSource, leftLabel: 'Manager', rightLabel: '360°' },
          { label: 'Recognition', preference: responses.recognitionType, leftLabel: 'Private', rightLabel: 'Public' },
          { label: 'Visibility', preference: responses.recognitionVisibility, leftLabel: 'Results', rightLabel: 'Promoted' },
        ],
        criticalCount: 0,
      },
      {
        ...DIMENSION_CONFIG.collaboration,
        items: [
          { label: 'Team Size', preference: responses.teamSize, leftLabel: 'Solo', rightLabel: 'Large' },
          { label: 'Interaction', preference: responses.teamInteractionFrequency, leftLabel: 'Minimal', rightLabel: 'Frequent' },
          { label: 'Diversity', preference: responses.teamDiversity, leftLabel: 'Similar', rightLabel: 'Diverse' },
          { label: 'Dynamic', preference: responses.teamCompetitionVsCollaboration, leftLabel: 'Competitive', rightLabel: 'Collaborative' },
          { label: 'Social', preference: responses.teamSocialConnection, leftLabel: 'Professional', rightLabel: 'Deep' },
        ],
        criticalCount: 0,
      },
      {
        ...DIMENSION_CONFIG.purpose,
        items: [
          { label: 'Mission', preference: responses.purposeMissionAlignment, leftLabel: 'Job', rightLabel: 'Deep Fit' },
          { label: 'Impact', preference: responses.purposeImpactVisibility, leftLabel: 'Trust', rightLabel: 'See It' },
          { label: 'Customer', preference: responses.purposeCustomerConnection, leftLabel: 'Behind', rightLabel: 'Direct' },
          { label: 'Value', preference: responses.purposeValueContribution, leftLabel: 'Part', rightLabel: 'Unique' },
        ],
        criticalCount: 0,
      },
    ];

    // Count critical items per dimension
    dimensions.forEach(dim => {
      dim.criticalCount = dim.items.filter(i => i.preference.importance === 'critical').length;
    });

    // Get all critical items across dimensions
    const criticalConditions = dimensions.flatMap(dim =>
      dim.items
        .filter(i => i.preference.importance === 'critical')
        .map(i => ({ ...i, dimension: dim.name, color: dim.color }))
    );

    return { dimensions, criticalConditions };
  }, [responses]);

  const handleExportJSON = () => {
    const exportData = {
      assessmentDate: new Date().toISOString(),
      context: responses.context,
      dimensions: results.dimensions.map(dim => ({
        name: dim.name,
        criticalCount: dim.criticalCount,
        preferences: dim.items.map(item => ({
          label: item.label,
          value: item.preference.value,
          importance: item.preference.importance,
          interpretation: item.preference.value
            ? item.preference.value <= 3
              ? item.leftLabel
              : item.preference.value >= 5
              ? item.rightLabel
              : 'Balanced'
            : 'Not set',
        })),
      })),
      criticalConditions: results.criticalConditions.map(c => ({
        dimension: c.dimension,
        condition: c.label,
        preference: c.preference.value,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-conditions-map-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    generateAssessmentPDF({
      title: 'High-Performance Conditions Map',
      subtitle: 'Personal Work Preference Assessment',
      assessmentDate: new Date(),
      context: {
        Role: responses.context.currentRole || 'Not specified',
        Experience: responses.context.yearsExperience || 'Not specified',
        Purpose: responses.context.assessmentPurpose?.replace(/-/g, ' ') || 'Not specified',
      },
      summary: {
        metrics: [
          { label: 'Dimensions', value: 6, color: '#00D4FF' },
          { label: 'Preferences', value: 30, color: '#00D4FF' },
          { label: 'Critical', value: results.criticalConditions.length, color: '#EF4444' },
        ],
      },
      criticalItems: results.criticalConditions.map(c => ({
        dimension: c.dimension,
        label: `${c.label}: ${getPreferenceLabel(c.preference.value, c.leftLabel, c.rightLabel)}`,
      })),
      sections: results.dimensions.map(dim => ({
        title: dim.name,
        color: dim.color.replace('text-', '#').replace('blue-500', '3B82F6').replace('purple-500', 'A855F7').replace('orange-500', 'F97316').replace('green-500', '22C55E').replace('pink-500', 'EC4899').replace('gold', 'D4AF37'),
        items: dim.items.map(item => ({
          label: item.label,
          value: getPreferenceLabel(item.preference.value, item.leftLabel, item.rightLabel),
          status: item.preference.importance === 'critical' ? 'critical' as const : item.preference.importance === 'important' ? 'warning' as const : 'neutral' as const,
          importance: item.preference.importance || undefined,
        })),
      })),
      recommendations: [
        'Use your critical conditions as non-negotiables when evaluating job opportunities',
        'Share this map with potential employers to align expectations early',
        'Review and update annually as your preferences may evolve',
        'Consider discussing misaligned conditions in your current role with your manager',
      ],
      footer: 'AlgoVigilance Academy - High-Performance Conditions Assessment',
    });
  };

  const getPreferenceLabel = (value: number | null, leftLabel: string, rightLabel: string) => {
    if (!value) return 'Not set';
    if (value <= 2) return `Strong ${leftLabel}`;
    if (value <= 3) return leftLabel;
    if (value === 4) return 'Balanced';
    if (value <= 5) return rightLabel;
    return `Strong ${rightLabel}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan/5 border-emerald-500/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Gauge className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-emerald-500">Your Performance Conditions Map</CardTitle>
              <CardDescription className="mt-2 text-foreground/80">
                This map shows the work conditions under which you perform your best.
                Use it to evaluate opportunities, negotiate role conditions, and communicate your needs.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Conditions Summary */}
      {results.criticalConditions.length > 0 && (
        <Card className="bg-nex-surface border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-foreground">
                Your Non-Negotiables ({results.criticalConditions.length})
              </CardTitle>
            </div>
            <CardDescription>
              These conditions are critical to your performance. Prioritize these when evaluating opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.criticalConditions.map((condition, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`${condition.color} border-current`}
                >
                  {condition.dimension}: {condition.label} →{' '}
                  {getPreferenceLabel(condition.preference.value, condition.leftLabel, condition.rightLabel)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dimension Breakdown */}
      <div className="grid gap-4">
        {results.dimensions.map((dimension) => {
          const Icon = dimension.icon;
          return (
            <Card key={dimension.name} className="bg-nex-surface border-nex-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 ${dimension.bgColor} rounded-lg`}>
                      <Icon className={`h-4 w-4 ${dimension.color}`} />
                    </div>
                    <CardTitle className="text-base text-foreground">{dimension.name}</CardTitle>
                  </div>
                  {dimension.criticalCount > 0 && (
                    <Badge variant="outline" className="text-red-500 border-red-500">
                      {dimension.criticalCount} critical
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dimension.items.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-muted-foreground">{item.label}</div>

                      {/* Visual spectrum bar */}
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground w-16 text-right">{item.leftLabel}</span>
                        <div className="flex-1 flex gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                            <div
                              key={level}
                              className={`h-4 flex-1 rounded-sm transition-all ${
                                item.preference.value === level
                                  ? level <= 3
                                    ? 'bg-blue-500'
                                    : level === 4
                                    ? 'bg-purple-500'
                                    : 'bg-emerald-500'
                                  : 'bg-nex-border'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground w-16">{item.rightLabel}</span>
                      </div>

                      {/* Importance indicator */}
                      <div className="w-6">
                        {item.preference.importance === 'critical' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {item.preference.importance === 'important' && (
                          <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How to Use */}
      <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
        <h3 className="font-semibold text-gold mb-2">Using Your Map</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Job Interviews:</strong> Ask questions to assess if the role matches your critical conditions</li>
          <li>• <strong>Negotiations:</strong> Use your non-negotiables to guide what you ask for</li>
          <li>• <strong>Current Role:</strong> Identify gaps and have conversations about adjustments</li>
          <li>• <strong>Team Building:</strong> Share with colleagues to improve collaboration</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Purpose
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="border-cyan text-cyan hover:bg-cyan/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={onReset}
            className="bg-gold text-nex-deep hover:bg-gold-bright"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}

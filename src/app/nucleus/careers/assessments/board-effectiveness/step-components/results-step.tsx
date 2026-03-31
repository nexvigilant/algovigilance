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
  Compass,
  Scale,
  DollarSign,
  ShieldAlert,
  Crown,
  UsersRound,
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  ClipboardCheck,
} from 'lucide-react';
import type { BoardEffectivenessResponses, ChecklistItem } from '../assessment-client';
import { generateAssessmentPDF } from '@/lib/pdf';

interface ResultsStepProps {
  responses: BoardEffectivenessResponses;
  onBack: () => void;
  onReset: () => void;
}

interface DimensionResult {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  items: { label: string; item: ChecklistItem }[];
  score: { yes: number; partial: number; no: number; na: number };
}

const DIMENSION_CONFIG = {
  strategy: { name: 'Strategy & Oversight', icon: Compass, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  governance: { name: 'Governance & Compliance', icon: Scale, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  financial: { name: 'Financial Stewardship', icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  risk: { name: 'Risk Management', icon: ShieldAlert, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  leadership: { name: 'CEO & Leadership', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  composition: { name: 'Board Composition', icon: UsersRound, color: 'text-cyan', bgColor: 'bg-cyan/10' },
  culture: { name: 'Board Culture', icon: Sparkles, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  stakeholder: { name: 'Stakeholder Relations', icon: Globe, color: 'text-gold', bgColor: 'bg-gold/10' },
};

export function ResultsStep({ responses, onBack, onReset }: ResultsStepProps) {
  const results = useMemo(() => {
    const dimensions: DimensionResult[] = [
      {
        ...DIMENSION_CONFIG.strategy,
        items: [
          { label: 'Strategy Clarity', item: responses.strategyClarity },
          { label: 'Strategy Alignment', item: responses.strategyAlignment },
          { label: 'Progress Monitoring', item: responses.strategyMonitoring },
          { label: 'Strategy Adaptation', item: responses.strategyAdaptation },
          { label: 'Performance Metrics', item: responses.performanceMetrics },
          { label: 'Competitive Awareness', item: responses.competitiveAwareness },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.governance,
        items: [
          { label: 'Governance Framework', item: responses.governanceFramework },
          { label: 'Regulatory Compliance', item: responses.regulatoryCompliance },
          { label: 'Ethics Standards', item: responses.ethicsStandards },
          { label: 'Conflict Management', item: responses.conflictManagement },
          { label: 'Documentation Practices', item: responses.documentationPractices },
          { label: 'Audit Oversight', item: responses.auditOversight },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.financial,
        items: [
          { label: 'Financial Literacy', item: responses.financialLiteracy },
          { label: 'Budget Oversight', item: responses.budgetOversight },
          { label: 'Financial Reporting', item: responses.financialReporting },
          { label: 'Capital Allocation', item: responses.capitalAllocation },
          { label: 'Financial Risk', item: responses.financialRisk },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.risk,
        items: [
          { label: 'Risk Framework', item: responses.riskFramework },
          { label: 'Risk Appetite', item: responses.riskAppetite },
          { label: 'Risk Monitoring', item: responses.riskMonitoring },
          { label: 'Crisis Preparedness', item: responses.crisisPreparedness },
          { label: 'Cybersecurity Oversight', item: responses.cybersecurityOversight },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.leadership,
        items: [
          { label: 'CEO Relationship', item: responses.ceoRelationship },
          { label: 'CEO Evaluation', item: responses.ceoEvaluation },
          { label: 'Succession Planning', item: responses.successionPlanning },
          { label: 'Executive Compensation', item: responses.executiveCompensation },
          { label: 'Leadership Development', item: responses.leadershipDevelopment },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.composition,
        items: [
          { label: 'Skills Diversity', item: responses.skillsDiversity },
          { label: 'Demographic Diversity', item: responses.demographicDiversity },
          { label: 'Independence Balance', item: responses.independenceBalance },
          { label: 'Tenure Mix', item: responses.tenureMix },
          { label: 'Recruitment Process', item: responses.recruitmentProcess },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.culture,
        items: [
          { label: 'Meeting Effectiveness', item: responses.meetingEffectiveness },
          { label: 'Constructive Debate', item: responses.constructiveDebate },
          { label: 'Information Flow', item: responses.informationFlow },
          { label: 'Continuous Learning', item: responses.continuousLearning },
          { label: 'Board Evaluation', item: responses.boardEvaluation },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
      {
        ...DIMENSION_CONFIG.stakeholder,
        items: [
          { label: 'Shareholder Engagement', item: responses.shareholderEngagement },
          { label: 'Stakeholder Awareness', item: responses.stakeholderAwareness },
          { label: 'Transparency', item: responses.transparencyCommunication },
          { label: 'Reputation Management', item: responses.reputationManagement },
          { label: 'ESG Oversight', item: responses.esgOversight },
        ],
        score: { yes: 0, partial: 0, no: 0, na: 0 },
      },
    ];

    dimensions.forEach(dim => {
      dim.items.forEach(({ item }) => {
        if (item.rating === 'yes') dim.score.yes++;
        else if (item.rating === 'partial') dim.score.partial++;
        else if (item.rating === 'no') dim.score.no++;
        else if (item.rating === 'na') dim.score.na++;
      });
    });

    const overall = { yes: 0, partial: 0, no: 0, na: 0 };
    dimensions.forEach(dim => {
      overall.yes += dim.score.yes;
      overall.partial += dim.score.partial;
      overall.no += dim.score.no;
      overall.na += dim.score.na;
    });

    const criticalGaps = dimensions.flatMap(dim =>
      dim.items
        .filter(({ item }) => item.rating === 'no' && item.importance === 'critical')
        .map(({ label }) => ({ dimension: dim.name, label, color: dim.color }))
    );

    const improvementAreas = dimensions.flatMap(dim =>
      dim.items
        .filter(({ item }) => item.rating === 'partial' && (item.importance === 'critical' || item.importance === 'important'))
        .map(({ label }) => ({ dimension: dim.name, label, color: dim.color }))
    );

    return { dimensions, overall, criticalGaps, improvementAreas };
  }, [responses]);

  // Calculate health score early so it can be used in export functions
  const applicable = results.overall.yes + results.overall.partial + results.overall.no;
  const healthScore = applicable > 0 ? Math.round(((results.overall.yes + results.overall.partial * 0.5) / applicable) * 100) : 0;
  const healthLabel = healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Moderate' : healthScore >= 40 ? 'Needs Attention' : 'Critical';
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 60 ? 'text-yellow-500' : healthScore >= 40 ? 'text-orange-500' : 'text-red-500';

  const handleExportJSON = () => {
    const exportData = {
      assessmentDate: new Date().toISOString(),
      context: { boardRole: responses.boardRole, boardType: responses.boardType, evaluationPurpose: responses.evaluationPurpose },
      overall: results.overall,
      dimensions: results.dimensions.map(dim => ({
        name: dim.name,
        scores: dim.score,
        items: dim.items.map(({ label, item }) => ({ label, rating: item.rating, importance: item.importance })),
      })),
      criticalGaps: results.criticalGaps,
      improvementAreas: results.improvementAreas,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-effectiveness-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const roleLabels: Record<string, string> = {
      'board-member': 'Board Member',
      'executive': 'Executive',
      'advisor': 'Advisor',
      'observer': 'Observer',
      'evaluator': 'Evaluator',
    };
    const typeLabels: Record<string, string> = {
      'corporate': 'Corporate',
      'nonprofit': 'Nonprofit',
      'startup': 'Startup',
      'advisory': 'Advisory',
      'public-sector': 'Public Sector',
    };
    const purposeLabels: Record<string, string> = {
      'self-assessment': 'Self-Assessment',
      'improvement-planning': 'Improvement Planning',
      'board-development': 'Board Development',
      'due-diligence': 'Due Diligence',
    };

    const ratingLabels: Record<string, string> = {
      yes: 'Yes',
      partial: 'Partial',
      no: 'No',
      na: 'N/A',
    };

    const importanceLabels: Record<string, string> = {
      critical: 'Critical',
      important: 'Important',
      'nice-to-have': 'Nice to Have',
    };

    generateAssessmentPDF({
      title: 'Board Effectiveness Checklist',
      subtitle: 'Governance Health Assessment',
      assessmentDate: new Date(),
      context: {
        Role: responses.boardRole ? roleLabels[responses.boardRole] || responses.boardRole : 'Not specified',
        'Board Type': responses.boardType ? typeLabels[responses.boardType] || responses.boardType : 'Not specified',
        Purpose: responses.evaluationPurpose ? purposeLabels[responses.evaluationPurpose] || responses.evaluationPurpose : 'Not specified',
      },
      summary: {
        score: healthScore,
        scoreLabel: healthLabel,
        metrics: [
          { label: 'Yes', value: results.overall.yes, color: '#22C55E' },
          { label: 'Partial', value: results.overall.partial, color: '#EAB308' },
          { label: 'No', value: results.overall.no, color: '#EF4444' },
          { label: 'N/A', value: results.overall.na, color: '#94A3B8' },
        ],
      },
      criticalItems: results.criticalGaps.map(gap => ({
        dimension: gap.dimension,
        label: gap.label,
      })),
      sections: results.dimensions.map(dim => {
        const dimApplicable = dim.score.yes + dim.score.partial + dim.score.no;
        const dimScore = dimApplicable > 0 ? Math.round(((dim.score.yes + dim.score.partial * 0.5) / dimApplicable) * 100) : 0;

        return {
          title: `${dim.name} (${dimScore}%)`,
          items: dim.items.map(({ label, item }) => ({
            label,
            value: item.rating ? ratingLabels[item.rating] || item.rating : 'Not rated',
            status: item.rating === 'yes' ? 'good' as const :
                    item.rating === 'partial' ? 'warning' as const :
                    item.rating === 'no' ? 'critical' as const : 'neutral' as const,
            importance: item.importance ? importanceLabels[item.importance] : undefined,
          })),
        };
      }),
      recommendations: [
        'Address critical gaps immediately - these represent material governance risks',
        'Schedule quarterly board evaluations to track improvement progress',
        'Assign dimension ownership to relevant board committees',
        'Use improvement areas to develop targeted board training initiatives',
      ],
      footer: 'AlgoVigilance Academy - Board Effectiveness Assessment',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <ClipboardCheck className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-amber-500">Board Effectiveness Results</CardTitle>
              <CardDescription className="mt-2 text-foreground/80">
                Comprehensive evaluation across 8 governance dimensions with 42 checkpoints.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Score Methodology Note */}
          <div className="mb-4 p-3 bg-nex-dark/50 rounded-lg border border-nex-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How scores are calculated:</strong> Yes = 100%, Partial = 50%, No = 0%.
              N/A items are excluded. A score of 80%+ indicates strong governance practices.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-nex-dark rounded-lg" title={`Health Score: (Yes × 100% + Partial × 50%) ÷ Applicable Items`}>
              <div className={`text-2xl font-bold ${healthColor}`}>{healthScore}%</div>
              <div className="text-xs text-muted-foreground">{healthLabel}</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-green-500">{results.overall.yes}</div>
              <div className="text-xs text-muted-foreground">Yes</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">{results.overall.partial}</div>
              <div className="text-xs text-muted-foreground">Partial</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-red-500">{results.overall.no}</div>
              <div className="text-xs text-muted-foreground">No</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-slate-400">{results.overall.na}</div>
              <div className="text-xs text-muted-foreground">N/A</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.criticalGaps.length > 0 && (
        <Card className="bg-nex-surface border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-foreground">Critical Gaps ({results.criticalGaps.length})</CardTitle>
            </div>
            <CardDescription>Items marked critical but rated No - prioritize these first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.criticalGaps.map((gap, idx) => (
                <Badge key={idx} variant="outline" className={`${gap.color} border-current`}>
                  {gap.dimension}: {gap.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.improvementAreas.length > 0 && (
        <Card className="bg-nex-surface border-yellow-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg text-foreground">Improvement Areas ({results.improvementAreas.length})</CardTitle>
            </div>
            <CardDescription>Important items partially met - opportunities to strengthen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.improvementAreas.map((area, idx) => (
                <Badge key={idx} variant="outline" className={`${area.color} border-current`}>
                  {area.dimension}: {area.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {results.dimensions.map((dimension) => {
          const Icon = dimension.icon;
          const dimApplicable = dimension.score.yes + dimension.score.partial + dimension.score.no;
          const dimScore = dimApplicable > 0 ? Math.round(((dimension.score.yes + dimension.score.partial * 0.5) / dimApplicable) * 100) : 0;

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
                  <Badge variant="outline" className={dimScore >= 80 ? 'text-green-500 border-green-500' : dimScore >= 60 ? 'text-yellow-500 border-yellow-500' : 'text-red-500 border-red-500'}>
                    {dimScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dimension.items.map(({ label, item }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-5">
                        {item.rating === 'yes' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {item.rating === 'partial' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        {item.rating === 'no' && <XCircle className="h-4 w-4 text-red-500" />}
                        {item.rating === 'na' && <MinusCircle className="h-4 w-4 text-slate-400" />}
                      </div>
                      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
                      {item.importance === 'critical' && <Badge variant="outline" className="text-xs text-red-500 border-red-500">Critical</Badge>}
                      {item.importance === 'important' && <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500">Important</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
        <h3 className="font-semibold text-gold mb-2">Using Your Results</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>&#8226; <strong>Critical Gaps:</strong> Address red items marked critical immediately</li>
          <li>&#8226; <strong>Board Development:</strong> Use results to plan training initiatives</li>
          <li>&#8226; <strong>Benchmark Progress:</strong> Re-evaluate quarterly to track improvement</li>
          <li>&#8226; <strong>Committee Focus:</strong> Assign dimensions to relevant committees</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack} className="border-nex-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stakeholders
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExportPDF} className="border-amber-500 text-amber-500 hover:bg-amber-500/10">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportJSON} className="border-cyan text-cyan hover:bg-cyan/10">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={onReset} className="bg-gold text-nex-deep hover:bg-gold-bright">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}

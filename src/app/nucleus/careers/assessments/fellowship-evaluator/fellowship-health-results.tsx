'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Download, Share2 } from 'lucide-react';
import { calculateFellowshipHealthScore, type QuestionResponse } from './questions';

import { logger } from '@/lib/logger';
const log = logger.scope('fellowship-evaluator/fellowship-health-results');

interface FellowshipHealthResultsProps {
  email: string;
  organizationName: string;
  respondentName: string;
  responses: { [questionId: string]: string | number | boolean | null };
}

export default function FellowshipHealthResults({
  email,
  organizationName,
  respondentName: _respondentName,
  responses
}: FellowshipHealthResultsProps) {
  // Calculate results
  const formattedResponses: QuestionResponse[] = Object.entries(responses).map(([id, value]) => ({
    questionId: id,
    response: value || ''
  }));

  const results = calculateFellowshipHealthScore(formattedResponses);

  const handleDownloadReport = async () => {
    const { downloadAssessmentReport } = await import('@/lib/documents/generators/assessment-report');
    downloadAssessmentReport({
      title: 'Fellowship Program Quality Assessment',
      assessmentType: 'maturity',
      assessmentDate: new Date(),
      reportDate: new Date(),
      client: { name: email, organization: organizationName },
      executiveSummary: `Overall program health score: ${results.overallScore}/100. Status: ${results.healthStatus}. Estimated time to improvement: ${results.estimatedTimeToHealth}.`,
      scope: {
        areasAssessed: Object.keys(results.categoryScores),
      },
      findings: Object.entries(results.categoryScores).map(([category, data]) => ({
        category,
        currentState: `Score: ${data.score}/100 — ${data.status} (${data.percentile}th percentile)`,
        observations: [`Status: ${data.status}`, `Percentile: ${data.percentile}%`],
        rating: data.status === 'Strong' ? 'satisfactory' as const : data.status === 'Adequate' ? 'medium' as const : data.status === 'Needs Improvement' ? 'high' as const : 'critical' as const,
      })),
      overallRating: {
        score: results.overallScore,
        maxScore: 100,
        interpretation: `${results.healthStatus} — ${results.estimatedTimeToHealth}`,
      },
      gaps: results.criticalGaps.map(gap => ({
        area: gap,
        currentState: 'Below threshold',
        desiredState: 'Industry benchmark',
        priority: 'high' as const,
      })),
      recommendations: results.recommendations.map(rec => ({
        priority: rec.priority === 'Critical' ? 'immediate' as const : rec.priority === 'High' ? 'short-term' as const : 'long-term' as const,
        recommendation: `${rec.area}: ${rec.solution}`,
        rationale: rec.problem,
        estimatedEffort: `${rec.timelineMonths} month${rec.timelineMonths === 1 ? '' : 's'} — ROI: ${rec.estimatedROI}`,
      })),
    });
  };

  const handleShare = () => {
    const text = `My fellowship program scored ${results.overallScore}/100 on the Fellowship Program Quality Assessment. Status: ${results.healthStatus}.`;
    if (navigator.share) {
      navigator.share({
        title: 'Fellowship Program Quality Assessment',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className={`p-8 ${
        results.healthStatus === 'Healthy'
          ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20'
          : results.healthStatus === 'At Risk'
          ? 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20'
          : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20'
      }`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {results.healthStatus === 'Healthy' && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            {results.healthStatus === 'At Risk' && <AlertTriangle className="h-8 w-8 text-amber-600" />}
            {results.healthStatus === 'Critical' && <AlertTriangle className="h-8 w-8 text-red-600" />}
            <h1 className="text-3xl font-bold font-headline">Assessment Complete</h1>
          </div>

          <p className="text-lg text-muted-foreground">
            Your fellowship program evaluation for <strong>{organizationName}</strong> has been completed.
          </p>

          <p className="text-muted-foreground">
            A detailed report with benchmarking and recommendations has been sent to <strong>{email}</strong>
          </p>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleDownloadReport} className="bg-cyan hover:bg-cyan-dark/80">
              <Download className="h-4 w-4 mr-2" />
              Download Full Report (PDF)
            </Button>

            <Button onClick={handleShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Health Score */}
      <Card className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Score Display */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Fellowship Program Health</h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold text-cyan">{results.overallScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>

                <Progress value={results.overallScore} className="h-3" />
              </div>

              <div>
                <Badge
                  className={`text-white text-lg px-4 py-2 mb-4 ${
                    results.healthStatus === 'Healthy'
                      ? 'bg-green-600'
                      : results.healthStatus === 'At Risk'
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }`}
                >
                  Status: {results.healthStatus}
                </Badge>

                <p className="text-muted-foreground text-sm">
                  {results.healthStatus === 'Healthy' &&
                    'Your fellowship program is well-structured with strong fundamentals. Focus on optimization and innovation.'}
                  {results.healthStatus === 'At Risk' &&
                    'Your program has gaps that impact fellow development. Strategic improvements over 6-9 months will significantly improve outcomes.'}
                  {results.healthStatus === 'Critical' &&
                    'Your program needs urgent attention. Fellows are not receiving clear development pathways. A structured improvement plan is essential.'}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>Timeline to improvement:</strong> {results.estimatedTimeToHealth}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Breakdown by Area</h3>

            <div className="space-y-3">
              {Object.entries(results.categoryScores).map(([category, data]) => (
                <div key={category} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{category}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        data.status === 'Strong'
                          ? 'bg-green-50 text-green-800 dark:bg-green-950/30'
                          : data.status === 'Adequate'
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/30'
                          : data.status === 'Needs Improvement'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30'
                          : 'bg-red-50 text-red-800 dark:bg-red-950/30'
                      }`}
                    >
                      {data.status}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-cyan">{data.score}</span>
                    <span className="text-xs text-muted-foreground">(Percentile: {data.percentile}%)</span>
                  </div>

                  <Progress value={data.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Benchmark Comparisons */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">How You Compare to Industry</h2>

        <div className="space-y-4">
          {results.benchmarkComparisons.map((comp, i) => (
            <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
              <h3 className="font-semibold mb-3">{comp.metric}</h3>

              <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded">
                  <div className="text-xs text-muted-foreground mb-1">Your Program</div>
                  <div className="text-lg font-bold text-cyan-muted">{comp.yourProgram}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded">
                  <div className="text-xs text-muted-foreground mb-1">Industry Average</div>
                  <div className="text-lg font-bold">{comp.industryAverage}</div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                  <div className="text-xs text-muted-foreground mb-1">Top Performers</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{comp.topPerformers}</div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">{comp.insight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Strengths & Gaps */}
      <div className="grid md:grid-cols-2 gap-6">
        {results.topStrengths.length > 0 && (
          <Card className="p-6 border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Your Strengths</h3>
            </div>

            <ul className="space-y-2">
              {results.topStrengths.map(strength => (
                <li key={strength} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  {strength}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {results.criticalGaps.length > 0 && (
          <Card className="p-6 border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-lg">Critical Gaps</h3>
            </div>

            <ul className="space-y-2">
              {results.criticalGaps.map(gap => (
                <li key={gap} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  {gap}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">Recommended Actions</h2>

        <div className="space-y-4">
          {results.recommendations.map((rec, i) => (
            <div key={i} className="border-l-4 border-cyan pl-4 py-2">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{rec.area}</h3>
                  <p className="text-sm text-muted-foreground">{rec.problem}</p>
                </div>

                <Badge
                  className={`flex-shrink-0 ${
                    rec.priority === 'Critical'
                      ? 'bg-red-600'
                      : rec.priority === 'High'
                      ? 'bg-amber-600'
                      : rec.priority === 'Medium'
                      ? 'bg-blue-600'
                      : 'bg-slate-600'
                  }`}
                >
                  {rec.priority} Priority
                </Badge>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded my-3">
                <p className="text-sm font-semibold mb-2">Solution:</p>
                <p className="text-sm text-muted-foreground">{rec.solution}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Timeline: </span>
                  <span className="font-semibold">{rec.timelineMonths} {rec.timelineMonths === 1 ? 'month' : 'months'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected ROI: </span>
                  <span className="font-semibold">{rec.estimatedROI}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Implementation Roadmap CTA */}
      <Card className="p-8 bg-gradient-to-r from-cyan/10 to-nex-blue-500/10">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Next Steps</h2>

          <p className="text-muted-foreground">
            You have a clear picture of your fellowship program's strengths and gaps. The recommendations above can guide your improvement strategy.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold">1</div>
              <div>
                <h3 className="font-semibold">Review your full report</h3>
                <p className="text-sm text-muted-foreground">A comprehensive PDF with detailed analysis is in your email.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold">2</div>
              <div>
                <h3 className="font-semibold">Identify your starting point</h3>
                <p className="text-sm text-muted-foreground">Which critical gap has the biggest impact on your fellows' outcomes?</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold">3</div>
              <div>
                <h3 className="font-semibold">Get an implementation roadmap</h3>
                <p className="text-sm text-muted-foreground">We offer implementation support and guidance to move from assessment to improvement.</p>
              </div>
            </div>
          </div>

          <Button className="w-full bg-cyan hover:bg-cyan-dark/80 h-12 text-base">
            Schedule Strategy Session with an Expert (Free 60 Minutes)
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Limited slots available for fellowship directors implementing competency-based assessment
          </p>
        </div>
      </Card>

      {/* Resource CTA */}
      <Card className="p-8 border-2 border-cyan">
        <div className="space-y-4 text-center">
          <h3 className="text-lg font-semibold">Ready to Transform Your Fellowship?</h3>
          <p className="text-muted-foreground">
            The highest-performing fellowship programs implement competency-based assessment. We provide the framework, training, and ongoing support to make it work for you.
          </p>
          <Button className="bg-cyan hover:bg-cyan-dark/80">
            Download Implementation Guide (Free)
          </Button>
        </div>
      </Card>
    </div>
  );
}

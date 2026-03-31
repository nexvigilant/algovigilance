'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Target, Download, Share2 } from 'lucide-react';
import { calculateMaturityScore, maturityLevels, maturityQuestions, type QuestionResponse } from './questions';

import { logger } from '@/lib/logger';
const log = logger.scope('maturity-model/maturity-model-results');

interface MaturityModelResultsProps {
  email: string;
  organizationName: string;
  respondentName: string;
  responses: { [questionId: string]: number | null };
}

export default function MaturityModelResults({
  email: _email,
  organizationName,
  respondentName: _respondentName,
  responses
}: MaturityModelResultsProps) {
  // Calculate results
  const formattedResponses: QuestionResponse[] = maturityQuestions.map(q => ({
    questionId: q.id,
    response: responses[q.id] || 1
  }));

  const results = calculateMaturityScore(formattedResponses);
  const levelDescription = maturityLevels[results.overallMaturityLevel];

  const handleDownloadReport = () => {
    log.debug('Download PDF report');
  };

  const handleShare = () => {
    const text = `${organizationName}'s PV program is at Maturity Level ${results.overallMaturityLevel} (${levelDescription.name}). Overall score: ${results.overallScore}/100.`;
    if (navigator.share) {
      navigator.share({
        title: 'PV Maturity Model Assessment',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const levelColors = {
    1: 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20',
    2: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20',
    3: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
    4: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20',
    5: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20'
  };

  const levelBadgeColors = {
    1: 'bg-red-600',
    2: 'bg-amber-600',
    3: 'bg-blue-600',
    4: 'bg-green-600',
    5: 'bg-purple-600'
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className={`p-8 bg-gradient-to-r ${levelColors[results.overallMaturityLevel]}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-cyan" />
            <h1 className="text-3xl font-bold font-headline">Your Organization's PV Maturity</h1>
          </div>

          <p className="text-lg text-muted-foreground">
            <strong>{organizationName}</strong> is currently at <strong>Maturity Level {results.overallMaturityLevel}</strong>: <strong>{levelDescription.name}</strong>
          </p>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleDownloadReport} className="bg-cyan hover:bg-cyan-dark/80">
              <Download className="h-4 w-4 mr-2" />
              Download Strategic Roadmap (PDF)
            </Button>

            <Button onClick={handleShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Score */}
      <Card className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-6">Overall Maturity Score</h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold text-cyan">{results.overallScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>

                <Progress value={results.overallScore} className="h-3" />
              </div>

              <div>
                <Badge className={`text-white text-lg px-4 py-2 mb-4 ${levelBadgeColors[results.overallMaturityLevel]}`}>
                  Level {results.overallMaturityLevel}: {levelDescription.name}
                </Badge>

                <p className="text-muted-foreground text-sm">{levelDescription.description}</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
                <p className="text-sm font-semibold mb-2">Characteristics at this level:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {levelDescription.characteristics.map((char, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-cyan" />
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div>
            <h3 className="text-xl font-semibold mb-4">By Dimension</h3>

            <div className="space-y-3">
              {Object.entries(results.dimensionScores).map(([dimension, data]) => (
                <div key={dimension} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{dimension}</h4>
                    <Badge
                      className={`text-white text-xs ${levelBadgeColors[data.level]}`}
                    >
                      L{data.level}
                    </Badge>
                  </div>

                  <Progress value={data.score * 20} className="h-2" />

                  <p className="text-xs text-muted-foreground mt-2">{data.assessment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Strengths & Opportunities */}
      <div className="grid md:grid-cols-2 gap-6">
        {results.strengths.length > 0 && (
          <Card className="p-6 border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Your Strengths</h3>
            </div>

            <ul className="space-y-2">
              {results.strengths.map(strength => (
                <li key={strength} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  {strength}
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mt-4">
              These areas are well-developed. Continue investing to maintain competitive advantage.
            </p>
          </Card>
        )}

        {results.weaknesses.length > 0 && (
          <Card className="p-6 border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Growth Opportunities</h3>
            </div>

            <ul className="space-y-2">
              {results.weaknesses.map(weakness => (
                <li key={weakness} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  {weakness}
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mt-4">
              These areas represent the highest ROI for investment. Focus here first.
            </p>
          </Card>
        )}
      </div>

      {/* Pathway to Next Level */}
      {results.overallMaturityLevel < 5 && (
        <Card className="p-8 bg-gradient-to-r from-cyan/10 to-nex-blue-500/10">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-cyan" />
            <h2 className="text-2xl font-bold">Path to Level {results.overallMaturityLevel + 1}</h2>
          </div>

          <div className="space-y-4 mb-6">
            {results.pathwayToNextLevel.map((step, i) => (
              <div key={i} className="border-l-4 border-cyan pl-4 py-2">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold">{step.action}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  <Badge className="flex-shrink-0 bg-cyan-muted">
                    {step.priority}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm mt-3 p-3 bg-slate-50 dark:bg-slate-800/20 rounded">
                  <div>
                    <span className="text-muted-foreground">Timeline: </span>
                    <span className="font-semibold">{step.estimatedTimeMonths} months</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Impact: </span>
                    <span className="font-semibold">{step.expectedImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ROI Estimate */}
          <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-cyan/20">
            <h3 className="font-semibold mb-4">Estimated ROI for Advancement</h3>

            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                <p className="text-lg font-bold text-cyan-muted">{results.roiEstimate.timelineMonths} months</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Retention Improvement</p>
                <p className="text-lg font-bold text-green-600">+{results.roiEstimate.estimatedRetentionImprovement}%</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Productivity Gain</p>
                <p className="text-lg font-bold text-blue-600">+{results.roiEstimate.estimatedProductivityGain}%</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Annual Savings</p>
                <p className="text-lg font-bold text-purple-600">{results.roiEstimate.estimatedSavings}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                ROI: {results.roiEstimate.estimatedROI}
              </p>
              <p className="text-xs text-muted-foreground">
                For every dollar invested in advancing maturity, expect {results.roiEstimate.estimatedROI.split(':')[0]} dollars in return
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {results.recommendations.length > 0 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Strategic Recommendations</h2>

          <div className="space-y-4">
            {results.recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-semibold">{rec.dimension}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                    L{rec.currentLevel} → L{rec.nextLevel}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{rec.recommendation}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Key Actions:</p>
                  <ul className="text-sm space-y-1">
                    {rec.keyActions.map((action, j) => (
                      <li key={j} className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Implementation CTA */}
      <Card className="p-8 border-2 border-cyan">
        <div className="space-y-4 text-center">
          <h3 className="text-xl font-semibold">Ready to Advance Your Organization?</h3>

          <p className="text-muted-foreground">
            Moving from Level {results.overallMaturityLevel} to Level {results.overallMaturityLevel + 1} will save approximately {results.roiEstimate.estimatedSavings} annually and improve retention by {results.roiEstimate.estimatedRetentionImprovement}%.
          </p>

          <p className="text-muted-foreground text-sm">
            We provide implementation support, training, and ongoing guidance to help organizations make this transition successfully.
          </p>

          <Button className="bg-cyan hover:bg-cyan-dark/80 h-12 px-8">
            Schedule Strategic Roadmap Planning (Free Consultation)
          </Button>

          <p className="text-xs text-muted-foreground">
            Limited availability. We reserve consultation slots for organizations committed to advancing their maturity level within 12 months.
          </p>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-8">
        <h2 className="text-xl font-bold mb-4">What Comes Next</h2>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold text-sm">1</div>
            <div>
              <h4 className="font-semibold">Review your detailed report</h4>
              <p className="text-sm text-muted-foreground">Check your email for the complete strategic roadmap with dimension-by-dimension analysis</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold text-sm">2</div>
            <div>
              <h4 className="font-semibold">Identify your starting point</h4>
              <p className="text-sm text-muted-foreground">Which dimension will provide the highest ROI to focus on first?</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center flex-shrink-0 font-semibold text-sm">3</div>
            <div>
              <h4 className="font-semibold">Get expert guidance</h4>
              <p className="text-sm text-muted-foreground">Schedule a free consultation to develop your customized implementation plan</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

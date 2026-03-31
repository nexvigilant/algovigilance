'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Share2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { assessmentQuestions, cpaDefinitions, calculateProficiencyLevel, getProfileMessage, type CPA } from './questions';

import { logger } from '@/lib/logger';
const log = logger.scope('competency-assessment/assessment-results');

interface AssessmentResultsProps {
  email: string;
  responses: { [questionId: string]: number | null };
}

interface CpaScore {
  cpa: CPA;
  score: number;
  proficiencyLevel: 'L1' | 'L2' | 'L3' | 'Pre-L1';
  questionsAnswered: number;
  message: string;
  strengths: string[];
  gaps: string[];
}

export default function AssessmentResults({ email, responses }: AssessmentResultsProps) {
  // Calculate results by CPA
  const calculateResults = (): CpaScore[] => {
    const groupedByQuestionCpa: { [cpa: string]: { scores: number[]; questions: string[] } } = {};

    assessmentQuestions.forEach(q => {
      if (!groupedByQuestionCpa[q.cpa]) {
        groupedByQuestionCpa[q.cpa] = { scores: [], questions: [] };
      }
      const score = responses[q.id];
      if (score !== null && score !== undefined) {
        groupedByQuestionCpa[q.cpa].scores.push(score);
      }
      groupedByQuestionCpa[q.cpa].questions.push(q.id);
    });

    return Object.entries(groupedByQuestionCpa).map(([cpaName, data]) => {
      const avgScore = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b) / data.scores.length : 0;
      const level = calculateProficiencyLevel(avgScore);
      const cpa = cpaName as CPA;

      return {
        cpa,
        score: avgScore,
        proficiencyLevel: level,
        questionsAnswered: data.scores.length,
        message: getProfileMessage(cpa, level, avgScore),
        strengths: level === 'L3' ? ['Advanced application', 'Strategic judgment'] : [],
        gaps: level === 'Pre-L1' ? ['Foundational knowledge', 'Practical experience'] : []
      };
    });
  };

  const results = calculateResults();
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const overallLevel = calculateProficiencyLevel(overallScore);
  const topStrengths = results.filter(r => r.proficiencyLevel === 'L3').map(r => cpaDefinitions[r.cpa].name);
  const developmentAreas = results.filter(r => r.proficiencyLevel === 'Pre-L1' || r.proficiencyLevel === 'L1').map(r => cpaDefinitions[r.cpa].name);

  const handleDownloadPDF = async () => {
    const { downloadAssessmentReport } = await import('@/lib/documents/generators/assessment-report');
    downloadAssessmentReport({
      title: 'PV Competency Self-Assessment Report',
      assessmentType: 'capability',
      assessmentDate: new Date(),
      reportDate: new Date(),
      client: { name: email, organization: 'Self-Assessment' },
      executiveSummary: `Overall proficiency score: ${overallScore.toFixed(1)}/5.0 (${overallLevel}). Assessment covered ${results.length} competency areas across pharmacovigilance practice.`,
      scope: {
        areasAssessed: results.map(r => cpaDefinitions[r.cpa].name),
      },
      findings: results.map(r => ({
        category: cpaDefinitions[r.cpa].name,
        currentState: `Score: ${r.score.toFixed(1)}/5.0 — Level ${r.proficiencyLevel}`,
        observations: [r.message, ...r.strengths, ...r.gaps].filter(Boolean),
        rating: r.proficiencyLevel === 'L3' ? 'satisfactory' as const : r.proficiencyLevel === 'L2' ? 'medium' as const : r.proficiencyLevel === 'L1' ? 'high' as const : 'critical' as const,
      })),
      overallRating: {
        score: Math.round(overallScore * 20),
        maxScore: 100,
        interpretation: `${overallLevel} — ${overallScore.toFixed(1)}/5.0`,
      },
      recommendations: [
        ...(developmentAreas.length > 0 ? [{ priority: 'immediate' as const, recommendation: `Focus on development areas: ${developmentAreas.join(', ')}` }] : []),
        { priority: 'short-term' as const, recommendation: 'Connect with a mentor for guided competency development' },
        { priority: 'long-term' as const, recommendation: 'Build an evidence portfolio to document competency progression' },
      ],
    });
  };

  const handleShare = () => {
    const text = `I just completed the PV Competency Self-Assessment and discovered my proficiency levels across pharmacovigilance competencies. Take the assessment to see your strengths and development areas.`;
    if (navigator.share) {
      navigator.share({
        title: 'PV Competency Self-Assessment',
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
      <Card className="p-8 bg-gradient-to-r from-cyan/10 to-nex-blue-500/10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-cyan" />
            <h1 className="text-3xl font-bold font-headline">Your Assessment Complete</h1>
          </div>

          <p className="text-lg text-muted-foreground">
            Your personalized PV competency profile has been generated. A detailed report has been sent to <strong>{email}</strong>
          </p>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleDownloadPDF} className="bg-cyan hover:bg-cyan-dark/80">
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

      {/* Overall Score */}
      <Card className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Overall Proficiency</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-cyan">{overallScore.toFixed(1)}</span>
                  <span className="text-lg text-muted-foreground">/5.0</span>
                </div>
                <Progress value={(overallScore / 5) * 100} className="h-3" />
              </div>

              <div>
                <Badge className="bg-cyan-dark text-white text-lg px-4 py-2 mb-3">
                  {overallLevel === 'L3' ? 'Advanced Proficiency' : overallLevel === 'L2' ? 'Intermediate Proficiency' : overallLevel === 'L1' ? 'Foundational Knowledge' : 'Pre-Foundational'}
                </Badge>

                <p className="text-muted-foreground">
                  {overallLevel === 'L3' && 'You demonstrate strong PV competencies across most areas. Focus on advanced specialization and mentoring.'}
                  {overallLevel === 'L2' && 'You have solid foundational PV knowledge. Continue building practical experience and specialization.'}
                  {overallLevel === 'L1' && 'You have basic PV knowledge. Focused training and mentored experience will accelerate your development.'}
                  {overallLevel === 'Pre-L1' && 'PV fundamentals require structured training. Recommended to pursue formal education or mentorship.'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
            <div className="space-y-4">
              {topStrengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-cyan" />
                    <h3 className="font-semibold">Your Strengths</h3>
                  </div>
                  <ul className="space-y-1">
                    {topStrengths.map(strength => (
                      <li key={strength} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {developmentAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold">Development Areas</h3>
                  </div>
                  <ul className="space-y-1">
                    {developmentAreas.map(area => (
                      <li key={area} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Competency Breakdown */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Competency Profile</h2>
        <div className="grid gap-4">
          {results.map(result => (
            <Card key={result.cpa} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{cpaDefinitions[result.cpa].name}</h3>
                    <p className="text-sm text-muted-foreground">{cpaDefinitions[result.cpa].description}</p>
                  </div>
                  <Badge
                    className={`text-white ${
                      result.proficiencyLevel === 'L3' ? 'bg-cyan-muted' :
                      result.proficiencyLevel === 'L2' ? 'bg-cyan' :
                      result.proficiencyLevel === 'L1' ? 'bg-amber-500' :
                      'bg-slate-500'
                    }`}
                  >
                    Level {result.proficiencyLevel}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan">{result.score.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/5.0 ({result.questionsAnswered} questions)</span>
                  </div>
                  <Progress value={(result.score / 5) * 100} className="h-2" />
                </div>

                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <Card className="p-8 bg-blue-50/50 dark:bg-blue-950/20">
        <h2 className="text-xl font-semibold mb-4">Recommended Next Steps</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center font-semibold flex-shrink-0">1</div>
            <div>
              <h3 className="font-semibold">Review Your Full Report</h3>
              <p className="text-sm text-muted-foreground">Check your email for detailed recommendations and learning resources for each competency area.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center font-semibold flex-shrink-0">2</div>
            <div>
              <h3 className="font-semibold">Connect with a Mentor</h3>
              <p className="text-sm text-muted-foreground">Mentored development accelerates competency growth. Browse our mentor directory or schedule a consultation.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-dark text-white flex items-center justify-center font-semibold flex-shrink-0">3</div>
            <div>
              <h3 className="font-semibold">Build Your Portfolio</h3>
              <p className="text-sm text-muted-foreground">Start collecting evidence of your competencies. Formal assessments validate your progression.</p>
            </div>
          </div>
        </div>

        <Button className="mt-6 bg-cyan hover:bg-cyan-dark/80 w-full">
          View Mentors & Learning Resources
        </Button>
      </Card>

      {/* Footer CTA */}
      <Card className="p-6 border-2 border-cyan">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Ready to Build Your Professional Development Plan?</h3>
          <p className="text-muted-foreground">Schedule a consultation with a PV development specialist to create a personalized learning pathway.</p>
          <Button className="bg-cyan hover:bg-cyan-dark/80">Schedule Free 30-Minute Consultation</Button>
        </div>
      </Card>
    </div>
  );
}

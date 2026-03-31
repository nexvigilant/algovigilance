'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Target,
  ListChecks,
  Scale,
  Lightbulb,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import type { Scenario } from './scenario-data';

interface UserResponses {
  challengeResponse: string;
  selectedChoices: string[];
  consequenceRankings: { [key: string]: number };
  creativeResponse: string;
  creativeFeedback: string | null;
  selectedRecommendation: string | null;
  justification: string;
}

interface ResultsSummaryProps {
  scenario: Scenario;
  responses: UserResponses;
  onRestart: () => void;
  onSelectNewScenario: () => void;
  completedCount: number;
  totalScenarios: number;
}

export function ResultsSummary({
  scenario,
  responses,
  onRestart,
  onSelectNewScenario,
  completedCount,
  totalScenarios
}: ResultsSummaryProps) {
  // Calculate scores
  const calculateChoicesScore = (): { score: number; maxScore: number; details: string[] } => {
    const recommendedChoices = scenario.choices.options
      .filter(opt => opt.isRecommended)
      .map(opt => opt.id);

    const correctSelections = responses.selectedChoices.filter(
      id => recommendedChoices.includes(id)
    ).length;

    const incorrectSelections = responses.selectedChoices.filter(
      id => !recommendedChoices.includes(id)
    ).length;

    const maxScore = recommendedChoices.length;
    const score = Math.max(0, correctSelections - (incorrectSelections * 0.5));

    const details: string[] = [];
    responses.selectedChoices.forEach(id => {
      const choice = scenario.choices.options.find(opt => opt.id === id);
      if (choice) {
        if (choice.isRecommended) {
          details.push(`✓ ${choice.label} - Recommended approach`);
        } else {
          details.push(`△ ${choice.label} - Valid but not optimal`);
        }
      }
    });

    return { score, maxScore, details };
  };

  const calculateRecommendationScore = (): { isOptimal: boolean; feedback: string } => {
    const selectedOption = scenario.conclusions.recommendationOptions.find(
      opt => opt.id === responses.selectedRecommendation
    );

    if (!selectedOption) {
      return { isOptimal: false, feedback: 'No recommendation selected' };
    }

    return {
      isOptimal: selectedOption.isOptimal,
      feedback: selectedOption.isOptimal
        ? 'You selected the optimal recommendation for this scenario.'
        : `Your recommendation is valid but consider: ${scenario.conclusions.recommendationOptions.find(o => o.isOptimal)?.action}`
    };
  };

  const choicesResult = calculateChoicesScore();
  const recommendationResult = calculateRecommendationScore();

  // Calculate overall performance
  const calculateOverallScore = (): number => {
    let totalPoints = 0;
    let maxPoints = 0;

    // Challenge response (20 points for substantive response)
    maxPoints += 20;
    if (responses.challengeResponse.length >= 100) totalPoints += 20;
    else if (responses.challengeResponse.length >= 50) totalPoints += 15;
    else if (responses.challengeResponse.length >= 20) totalPoints += 10;

    // Choices (30 points)
    maxPoints += 30;
    totalPoints += Math.round((choicesResult.score / choicesResult.maxScore) * 30);

    // Consequences (20 points for completing all rankings)
    maxPoints += 20;
    if (Object.keys(responses.consequenceRankings).length === 4) {
      totalPoints += 20;
    }

    // Creative (15 points)
    maxPoints += 15;
    if (responses.creativeResponse.length >= 150) totalPoints += 15;
    else if (responses.creativeResponse.length >= 100) totalPoints += 12;
    else if (responses.creativeResponse.length >= 50) totalPoints += 8;

    // Recommendation (15 points)
    maxPoints += 15;
    if (recommendationResult.isOptimal) {
      totalPoints += 15;
    } else if (responses.selectedRecommendation) {
      totalPoints += 8;
    }

    return Math.round((totalPoints / maxPoints) * 100);
  };

  const overallScore = calculateOverallScore();

  const getPerformanceLevel = (score: number): { label: string; color: string; icon: typeof Trophy } => {
    if (score >= 90) return { label: 'Expert', color: 'text-gold', icon: Trophy };
    if (score >= 75) return { label: 'Proficient', color: 'text-green-500', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Developing', color: 'text-cyan', icon: Target };
    return { label: 'Emerging', color: 'text-amber-500', icon: AlertTriangle };
  };

  const performance = getPerformanceLevel(overallScore);
  const PerformanceIcon = performance.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-cyan/10 to-purple-500/10 border-cyan/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Assessment Complete
            </h1>
            <p className="text-muted-foreground mt-1">{scenario.title}</p>
          </div>
          <Badge className="bg-green-500 text-white text-lg px-4 py-2">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Completed
          </Badge>
        </div>

        {/* Overall Score */}
        <div className="flex items-center gap-6 mt-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-nex-dark flex items-center justify-center">
              <span className="text-3xl font-bold text-cyan">{overallScore}%</span>
            </div>
          </div>
          <div>
            <div className={`flex items-center gap-2 ${performance.color}`}>
              <PerformanceIcon className="h-6 w-6" />
              <span className="text-xl font-semibold">{performance.label}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} of {totalScenarios} scenarios completed
            </p>
          </div>
        </div>
      </Card>

      {/* Step-by-Step Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Challenge Step */}
        <Card className="p-5 bg-nex-surface border-nex-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-cyan" />
            <h3 className="font-semibold">Step 1: Challenge</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your identification of the core problem:
          </p>
          <div className="p-3 bg-muted rounded-lg text-sm">
            {responses.challengeResponse || 'No response provided'}
          </div>
          <Badge variant="outline" className="mt-3">
            {responses.challengeResponse.length >= 100 ? '✓ Comprehensive' :
             responses.challengeResponse.length >= 50 ? '○ Adequate' : '△ Brief'}
          </Badge>
        </Card>

        {/* Choices Step */}
        <Card className="p-5 bg-nex-surface border-nex-border">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-5 w-5 text-cyan" />
            <h3 className="font-semibold">Step 2: Choices</h3>
            <Badge className={choicesResult.score === choicesResult.maxScore ? 'bg-green-500' : 'bg-amber-500'}>
              {Math.round((choicesResult.score / choicesResult.maxScore) * 100)}%
            </Badge>
          </div>
          <ul className="space-y-1 text-sm">
            {choicesResult.details.map((detail, i) => (
              <li key={i} className="text-muted-foreground">{detail}</li>
            ))}
          </ul>
        </Card>

        {/* Consequences Step */}
        <Card className="p-5 bg-nex-surface border-nex-border">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5 text-cyan" />
            <h3 className="font-semibold">Step 3: Consequences</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Your risk prioritization:</p>
          <div className="space-y-2">
            {Object.entries(responses.consequenceRankings)
              .sort((a, b) => b[1] - a[1])
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={value * 20} className="w-20 h-2" />
                    <span className="text-muted-foreground">{value}/5</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Creative Step */}
        <Card className="p-5 bg-nex-surface border-nex-border">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Step 4: Creative</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Your innovative approach:</p>
          <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
            {responses.creativeResponse || 'No response provided'}
          </div>
          {responses.creativeFeedback && (
            <div className="mt-3 p-3 bg-cyan/10 rounded-lg">
              <p className="text-xs text-cyan font-semibold mb-1">AI Feedback:</p>
              <p className="text-xs text-muted-foreground">{responses.creativeFeedback}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Conclusions Step - Full Width */}
      <Card className="p-5 bg-nex-surface border-nex-border">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="h-5 w-5 text-cyan" />
          <h3 className="font-semibold">Step 5: Conclusions</h3>
          {recommendationResult.isOptimal ? (
            <Badge className="bg-green-500">Optimal</Badge>
          ) : (
            <Badge variant="outline">Valid</Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your recommendation:</p>
            <div className="p-3 bg-muted rounded-lg">
              {scenario.conclusions.recommendationOptions.find(
                opt => opt.id === responses.selectedRecommendation
              )?.action || 'No recommendation selected'}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your justification:</p>
            <div className="p-3 bg-muted rounded-lg text-sm max-h-24 overflow-y-auto">
              {responses.justification || 'No justification provided'}
            </div>
          </div>
        </div>

        <div className={`mt-4 p-3 rounded-lg ${
          recommendationResult.isOptimal ? 'bg-green-500/10' : 'bg-amber-500/10'
        }`}>
          <p className="text-sm">
            {recommendationResult.isOptimal ? (
              <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 inline mr-2 text-amber-500" />
            )}
            {recommendationResult.feedback}
          </p>
        </div>
      </Card>

      {/* Expert Debrief */}
      <Card className="p-6 bg-nex-dark border-gold/30">
        <h3 className="font-semibold text-gold mb-4">Expert Debrief</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Key Learning Points</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {scenario.conclusions.expertGuidance}</li>
              <li>• {scenario.conclusions.regulatoryContext}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Domain Competencies Practiced</h4>
            <div className="flex flex-wrap gap-2">
              {scenario.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4 bg-nex-surface border-nex-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Scenario
            </Button>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export to Portfolio
            </Button>
            <Button variant="outline" disabled>
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>

          <Button
            onClick={onSelectNewScenario}
            className="bg-cyan hover:bg-cyan-dark/80 text-nex-deep"
          >
            Next Scenario
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

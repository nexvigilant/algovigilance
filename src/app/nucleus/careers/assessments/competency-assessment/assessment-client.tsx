'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { assessmentQuestions } from './questions';
import AssessmentResults from './assessment-results';

interface ResponseState {
  [questionId: string]: number | null;
}

export function CompetencyAssessmentClient() {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseState>({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const totalQuestions = assessmentQuestions.length;
  const questionsAnswered = Object.keys(responses).filter(k => responses[k] !== null).length;
  const progressPercent = (questionsAnswered / totalQuestions) * 100;

  const handleResponse = (score: number) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: score
    }));

    // Auto-advance to next unanswered question after a brief delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleEmailSubmit = () => {
    if (!email) return;
    setEmailSubmitted(true);
  };

  const handleSubmitAssessment = async () => {
    if (questionsAnswered < totalQuestions) return;

    setIsLoading(true);
    try {
      // Results are calculated in AssessmentResults component from responses
      setShowResults(true);

      // BACKLOG: Email delivery requires Resend server action with PDF attachment
    } finally {
      setIsLoading(false);
    }
  };

  const _calculateAssessmentResults = () => { // Reserved for future local calculation
    const groupedResponses: { [cpa: string]: number[] } = {};

    assessmentQuestions.forEach(q => {
      if (!groupedResponses[q.cpa]) {
        groupedResponses[q.cpa] = [];
      }
      const score = responses[q.id];
      if (score !== null && score !== undefined) {
        groupedResponses[q.cpa].push(score);
      }
    });

    return groupedResponses;
  };

  // Screen 1: Email Capture
  if (!emailSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold font-headline mb-4">PV Competency Self-Assessment</h1>
          <p className="text-lg text-muted-foreground mb-2">Discover your pharmacovigilance strengths and development areas</p>
          <p className="text-sm text-muted-foreground mb-6">15 minutes • 30 questions • Free report</p>

          <div className="space-y-4 mt-8">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-cyan"
              />
            </div>

            <Button
              onClick={handleEmailSubmit}
              disabled={!email}
              className="w-full bg-cyan-dark hover:bg-cyan-dark/80 text-white h-12 text-base"
            >
              Start Assessment <ChevronRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              We'll send you a personalized report with your proficiency levels across 8 competency areas.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Screen 2: Assessment Questions
  if (!showResults) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Assessment</h1>
            <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-cyan/10">
                {currentQuestion.cpa}
              </Badge>
            </div>

            <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>

            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            )}
          </div>

          {/* Likert Scale */}
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleResponse(score)}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold text-sm ${
                    responses[currentQuestion.id] === score
                      ? 'border-cyan bg-cyan/10 text-cyan-deep'
                      : 'border-muted hover:border-cyan/50'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="text-left">Not Confident</span>
              <span className="text-right">Very Confident</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <Button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex-1" />

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAssessment}
                disabled={questionsAnswered < totalQuestions || isLoading}
                className="bg-cyan hover:bg-cyan-dark/80"
              >
                {isLoading ? 'Generating Report...' : 'Complete Assessment'}
                {!isLoading && <CheckCircle2 className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </div>
        </Card>

        {/* Question List - Show answered status */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3">Progress</h3>
          <div className="grid grid-cols-10 gap-1">
            {assessmentQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`h-8 rounded text-xs font-medium transition-all ${
                  responses[q.id] !== undefined && responses[q.id] !== null
                    ? 'bg-cyan text-white'
                    : i === currentQuestionIndex
                    ? 'bg-cyan/30 border border-cyan'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Results
  return <AssessmentResults email={email} responses={responses} />;
}

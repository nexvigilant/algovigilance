'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { maturityQuestions } from './questions';
import MaturityModelResults from './maturity-model-results';

const _dimensions = ['Competency', 'Assessment', 'Technology', 'Outcomes', 'Alignment'] as const;

interface ResponseState {
  [questionId: string]: number | null;
}

interface QuestionResponse {
  questionId: string;
  response: number;
}

export function MaturityModelClient() {
  const [organizationName, setOrganizationName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [infoSubmitted, setInfoSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseState>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = maturityQuestions[currentQuestionIndex];
  const totalQuestions = maturityQuestions.length;
  const questionsAnswered = Object.keys(responses).filter(k => responses[k] !== null).length;
  const progressPercent = (questionsAnswered / totalQuestions) * 100;

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !respondentName || !respondentEmail) return;
    setInfoSubmitted(true);
  };

  const handleResponse = (value: number) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Auto-advance after selection
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmitAssessment = () => {
    if (questionsAnswered < totalQuestions) return;

    const _formattedResponses: QuestionResponse[] = maturityQuestions.map(q => ({
      questionId: q.id,
      response: responses[q.id] || 1
    }));

    setShowResults(true);
  };

  // Screen 1: Organization Info
  if (!infoSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-3xl font-bold font-headline mb-2">PV Organization Maturity Model</h1>
          <p className="text-lg text-muted-foreground mb-2">Assess your organization's pharmacovigilance capability maturity</p>
          <p className="text-sm text-muted-foreground mb-8">8 minutes • 20 questions • Strategic assessment</p>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Your company name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-cyan"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="First Last"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-cyan"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✓ Results are confidential and sent only to you
                <br />
                ✓ No organization data is shared publicly
                <br />
                ✓ You'll receive a detailed maturity report with ROI analysis and strategic recommendations
              </p>
            </div>

            <Button
              type="submit"
              disabled={!organizationName || !respondentName || !respondentEmail}
              className="w-full bg-cyan-dark hover:bg-cyan-dark/80 text-white h-12 text-base"
            >
              Begin Assessment <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Screen 2: Assessment Questions
  if (!showResults) {
    const getOptionColor = (optionValue: number) => {
      if (optionValue === 1) return 'border-red-200 hover:border-red-400 hover:bg-red-50/30';
      if (optionValue === 2) return 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/30';
      if (optionValue === 3) return 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/30';
      if (optionValue === 4) return 'border-green-200 hover:border-green-400 hover:bg-green-50/30';
      return 'border-green-400 hover:border-green-500 hover:bg-green-50/30';
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Maturity Assessment</h1>
            <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="p-8">
          <div className="mb-8">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-cyan/10">
                {currentQuestion.dimension}
              </Badge>
            </div>

            <h2 className="text-xl font-semibold mb-3">{currentQuestion.text}</h2>

            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            )}
          </div>

          <div className="space-y-2 mb-8">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleResponse(option.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  responses[currentQuestion.id] === option.value
                    ? `border-cyan bg-cyan/10`
                    : `border-muted ${getOptionColor(option.value)}`
                }`}
              >
                <div className="font-semibold text-sm mb-1">{option.label}</div>
                {option.description && <div className="text-xs text-muted-foreground">{option.description}</div>}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
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
                disabled={questionsAnswered < totalQuestions}
                className="bg-cyan hover:bg-cyan-dark/80"
              >
                {questionsAnswered < totalQuestions ? 'Complete All Questions First' : 'View Results'}
                {questionsAnswered === totalQuestions && <CheckCircle2 className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </div>
        </Card>

        {/* Progress by Dimension */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3">Progress by Dimension</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Competency', 'Assessment', 'Technology', 'Outcomes', 'Alignment'].map(dim => {
              const dimQuestions = maturityQuestions.filter(q => q.dimension === dim);
              const answered = dimQuestions.filter(q => responses[q.id] !== undefined && responses[q.id] !== null).length;
              return (
                <div key={dim} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded text-xs">
                  <div className="font-medium mb-1">{dim}</div>
                  <Progress value={(answered / dimQuestions.length) * 100} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Results
  return <MaturityModelResults email={respondentEmail} organizationName={organizationName} respondentName={respondentName} responses={responses} />;
}

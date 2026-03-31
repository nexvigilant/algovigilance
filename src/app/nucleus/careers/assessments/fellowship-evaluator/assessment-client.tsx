'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { fellowshipQuestions, calculateFellowshipHealthScore, type QuestionResponse } from './questions';
import FellowshipHealthResults from './fellowship-health-results';

interface ResponseState {
  [questionId: string]: string | number | boolean | null;
}

export function FellowshipEvaluatorClient() {
  const [organizationName, setOrganizationName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [email, setEmail] = useState('');
  const [infoSubmitted, setInfoSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseState>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = fellowshipQuestions[currentQuestionIndex];
  const totalQuestions = fellowshipQuestions.length;
  const questionsAnswered = Object.keys(responses).filter(k => responses[k] !== null && responses[k] !== undefined).length;
  const progressPercent = (questionsAnswered / totalQuestions) * 100;

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !respondentName || !email) return;
    setInfoSubmitted(true);
  };

  const handleResponse = (value: string | number | boolean) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Auto-advance if yes-no (common case)
    if (currentQuestion.questionType === 'yes-no' && currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmitAssessment = () => {
    if (questionsAnswered < totalQuestions) return;

    // Convert responses to proper format
    const formattedResponses: QuestionResponse[] = fellowshipQuestions.map(q => ({
      questionId: q.id,
      response: responses[q.id] || ''
    }));

    const _results = calculateFellowshipHealthScore(formattedResponses);
    setShowResults(true);
  };

  // Screen 1: Organization Info
  if (!infoSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-3xl font-bold font-headline mb-2">Fellowship Program Quality Assessment</h1>
          <p className="text-lg text-muted-foreground mb-2">Evaluate your fellowship program across 8 critical dimensions</p>
          <p className="text-sm text-muted-foreground mb-8">10 minutes • 25 questions • Confidential assessment</p>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Your organization name (kept confidential)"
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
                <label className="block text-sm font-medium mb-2">Your Role</label>
                <select
                  value={respondentRole}
                  onChange={(e) => setRespondentRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-cyan"
                >
                  <option value="">Select role</option>
                  <option value="fellowship-director">Fellowship Director</option>
                  <option value="program-director">Program Director</option>
                  <option value="hr-talent">HR / Talent Development</option>
                  <option value="medical-director">Medical Director</option>
                  <option value="preceptor">Preceptor / Mentor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

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

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✓ Your organization name will be kept confidential in any public reporting
                <br />
                ✓ Results will be emailed to you immediately after completion
                <br />
                ✓ You'll receive a detailed report with benchmarking and recommendations
              </p>
            </div>

            <Button
              type="submit"
              disabled={!organizationName || !respondentName || !email}
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
    const renderQuestion = () => {
      switch (currentQuestion.questionType) {
        case 'yes-no':
          return (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResponse(true)}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  responses[currentQuestion.id] === true
                    ? 'border-cyan bg-cyan/10'
                    : 'border-muted hover:border-cyan/50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleResponse(false)}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  responses[currentQuestion.id] === false
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-muted hover:border-amber-500/50'
                }`}
              >
                No
              </button>
            </div>
          );

        case 'scale':
          return (
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleResponse(score)}
                  className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                    responses[currentQuestion.id] === score
                      ? 'border-cyan bg-cyan/10'
                      : 'border-muted hover:border-cyan/50'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          );

        case 'text':
          return (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={String(responses[currentQuestion.id] || '')}
                onChange={(e) => handleResponse(e.target.value)}
                placeholder="Enter percentage (0-100)"
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:border-cyan"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          );

        case 'multiple-choice':
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 0, label: 'Not defined' },
                { value: 2, label: 'Partially defined' },
                { value: 4, label: 'Well defined' },
                { value: 5, label: 'Very comprehensive' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                    responses[currentQuestion.id] === option.value
                      ? 'border-cyan bg-cyan/10'
                      : 'border-muted hover:border-cyan/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          );

        default:
          return null;
      }
    };

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
          <div className="mb-8">
            <div className="inline-block mb-4">
              <Badge variant="outline" className="bg-cyan/10">
                {currentQuestion.category}
              </Badge>
            </div>

            <h2 className="text-xl font-semibold mb-3">{currentQuestion.text}</h2>

            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            )}
          </div>

          <div className="mb-8">{renderQuestion()}</div>

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

        {/* Question Progress Grid */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3">Progress by Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Competency Framework', 'Assessment Methodology', 'Outcomes & Measurement', 'Learner Support', 'Program Structure', 'Post-Fellowship'].map(
              category => {
                const categoryQuestions = fellowshipQuestions.filter(q => q.category === category);
                const answeredInCategory = categoryQuestions.filter(q => responses[q.id] !== undefined && responses[q.id] !== null).length;
                return (
                  <div key={category} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded text-xs">
                    <div className="font-medium mb-1">{category}</div>
                    <div className="h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-cyan transition-all"
                        style={{ width: `${(answeredInCategory / categoryQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Results
  return <FellowshipHealthResults email={email} organizationName={organizationName} respondentName={respondentName} responses={responses} />;
}

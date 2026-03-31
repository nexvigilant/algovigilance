'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Target,
  Zap,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

const SparseCodingCalculator = dynamic(
  () => import('@/components/sparse-coding/SparseCodingCalculator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    ),
  }
);

interface LearningStep {
  id: number;
  title: string;
  content: string;
  highlightSection?: string;
  action?: string;
}

const LEARNING_STEPS: LearningStep[] = [
  {
    id: 1,
    title: 'The Brain\'s Energy Budget',
    content:
      'Your brain consumes about 20 Watts - roughly the power of a dim light bulb. Yet it processes more information than the world\'s fastest supercomputers. How? Through sparse coding.',
    highlightSection: 'brain-power',
    action: 'Observe the 20W constraint in the Physical Constants panel',
  },
  {
    id: 2,
    title: 'Sparse vs Dense Activation',
    content:
      'Only 2% of neurons fire at any moment (sparse coding), compared to 15%+ in artificial neural networks (dense coding). Adjust the sliders to see the efficiency difference.',
    highlightSection: 'activation-sliders',
    action: 'Set sparse to 2% and dense to 15%',
  },
  {
    id: 3,
    title: 'Bits Per Joule',
    content:
      'The key metric is bits-per-Joule - how much information is transmitted per unit energy. Sparse coding achieves 7-15x better efficiency than dense coding.',
    highlightSection: 'efficiency-comparison',
    action: 'Compare the bits/Joule values in the metrics grid',
  },
  {
    id: 4,
    title: 'The Landauer Limit',
    content:
      'Physics sets a fundamental minimum: 2.97 × 10⁻²¹ Joules per bit at body temperature. The brain operates remarkably close to this theoretical limit.',
    highlightSection: 'landauer-table',
    action: 'Find the "% of Landauer" metric in the table',
  },
  {
    id: 5,
    title: 'PV Application: Signal Detection',
    content:
      'In pharmacovigilance, we apply similar principles. Not every adverse event report is equally informative. Sparse attention to high-signal cases maximizes detection efficiency.',
    action: 'Consider: Which cases deserve your "neural energy"?',
  },
];

const LEARNING_OBJECTIVES = [
  'Understand why the brain uses sparse coding for energy efficiency',
  'Calculate bits-per-Joule efficiency for different activation patterns',
  'Recognize the Landauer limit as the theoretical efficiency bound',
  'Apply sparse coding principles to pharmacovigilance signal detection',
];

export function SparseCodingLearningModule() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showCalculator, setShowCalculator] = useState(false);

  const handleStepComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < LEARNING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = (completedSteps.size / LEARNING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-nex-deep">
      {/* Header */}
      <header className="border-b border-nex-light bg-nex-surface/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/nucleus/academy"
              className="flex items-center gap-2 text-sm text-slate-dim hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Academy
            </Link>
            <div className="h-6 w-px bg-nex-light" />
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan" />
              <span className="font-medium text-white">
                Interactive Module: Neural Efficiency
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-dim">
              Progress: {completedSteps.size}/{LEARNING_STEPS.length}
            </div>
            <Progress value={progress} className="h-2 w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!showCalculator ? (
          /* Introduction View */
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Title Card */}
            <Card className="border-cyan/20 bg-nex-surface">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan/10">
                    <Zap className="h-6 w-6 text-cyan" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">
                      Sparse Coding Efficiency
                    </CardTitle>
                    <p className="text-slate-dim">
                      Understanding Neural Thermodynamics
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-dim leading-relaxed">
                  This interactive module explores how the brain achieves
                  extraordinary computational efficiency through sparse coding -
                  and how these same principles apply to pharmacovigilance signal
                  detection.
                </p>
              </CardContent>
            </Card>

            {/* Learning Objectives */}
            <Card className="border-gold/20 bg-nex-surface">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gold" />
                  <CardTitle className="text-lg text-white">
                    Learning Objectives
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {LEARNING_OBJECTIVES.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold/50" />
                      <span className="text-slate-dim">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Domain Connection */}
            <Card className="border-nex-light bg-nex-surface">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-cyan" />
                  <CardTitle className="text-lg text-white">
                    Curriculum Connection
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 rounded-lg bg-nex-deep/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan/10 text-sm font-bold text-cyan">
                    D8
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Domain 8: Signal Detection & Management
                    </p>
                    <p className="text-sm text-slate-dim">
                      Applies to EPA 10: Conduct signal detection activities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={() => setShowCalculator(true)}
                className="gap-2 bg-cyan px-8 text-nex-deep hover:bg-cyan-glow"
              >
                <Zap className="h-5 w-5" />
                Launch Interactive Calculator
              </Button>
            </div>
          </div>
        ) : (
          /* Calculator View with Guided Steps */
          <div className="space-y-6">
            {/* Step Navigator */}
            <Card className="border-cyan/20 bg-nex-surface">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {LEARNING_STEPS.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStep(idx)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all ${
                            idx === currentStep
                              ? 'bg-cyan text-nex-deep'
                              : completedSteps.has(idx)
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-nex-light text-slate-dim hover:bg-nex-light/80'
                          }`}
                        >
                          {completedSteps.has(idx) ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentStep === LEARNING_STEPS.length - 1}
                      onClick={() => setCurrentStep(currentStep + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCalculator(false)}
                  >
                    Back to Overview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Step Card */}
            <Card className="border-gold/30 bg-gradient-to-r from-gold/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Lightbulb className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-white">
                      Step {currentStep + 1}: {LEARNING_STEPS[currentStep].title}
                    </h3>
                    <p className="mb-3 text-slate-dim">
                      {LEARNING_STEPS[currentStep].content}
                    </p>
                    {LEARNING_STEPS[currentStep].action && (
                      <div className="flex items-center gap-2 rounded-md bg-nex-deep/50 px-3 py-2 text-sm">
                        <Target className="h-4 w-4 text-cyan" />
                        <span className="text-cyan">
                          Action: {LEARNING_STEPS[currentStep].action}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleStepComplete}
                    className="bg-gold text-nex-deep hover:bg-gold-bright"
                  >
                    {completedSteps.has(currentStep) ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calculator */}
            <div className="overflow-hidden rounded-xl border border-nex-light">
              <SparseCodingCalculator
                highlightSection={LEARNING_STEPS[currentStep]?.highlightSection}
              />
            </div>

            {/* Completion Card */}
            {completedSteps.size === LEARNING_STEPS.length && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Module Complete!
                        </h3>
                        <p className="text-slate-dim">
                          You&apos;ve explored all concepts in this interactive module.
                        </p>
                      </div>
                    </div>
                    <Link href="/nucleus/academy">
                      <Button className="bg-cyan text-nex-deep hover:bg-cyan-glow">
                        Return to Academy
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

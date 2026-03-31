'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardList, Building2, Target, User } from 'lucide-react';
import type { BoardEffectivenessResponses } from '../assessment-client';

interface IntroductionStepProps {
  responses: BoardEffectivenessResponses;
  onUpdate: (updates: Partial<BoardEffectivenessResponses>) => void;
  onNext: () => void;
  onBack: () => void;
}

const BOARD_ROLES = [
  { value: 'board-member', label: 'Board Member', description: 'Serving director with fiduciary duties' },
  { value: 'executive', label: 'Executive/CEO', description: 'C-suite working with the board' },
  { value: 'advisor', label: 'Board Advisor', description: 'Advisory role without voting rights' },
  { value: 'observer', label: 'Board Observer', description: 'Attending meetings without voting' },
  { value: 'evaluator', label: 'External Evaluator', description: 'Assessing board effectiveness' },
] as const;

const BOARD_TYPES = [
  { value: 'corporate', label: 'Corporate Board', description: 'For-profit company governance' },
  { value: 'nonprofit', label: 'Nonprofit Board', description: 'Charitable or social mission' },
  { value: 'startup', label: 'Startup Board', description: 'Early-stage company governance' },
  { value: 'advisory', label: 'Advisory Board', description: 'Non-fiduciary advisory group' },
  { value: 'public-sector', label: 'Public Sector', description: 'Government or quasi-public' },
] as const;

const EVALUATION_PURPOSES = [
  { value: 'self-assessment', label: 'Self-Assessment', description: 'Personal reflection on effectiveness' },
  { value: 'improvement-planning', label: 'Improvement Planning', description: 'Identify areas to strengthen' },
  { value: 'board-development', label: 'Board Development', description: 'Plan board training/growth' },
  { value: 'due-diligence', label: 'Due Diligence', description: 'Evaluate before joining/investing' },
] as const;

export function IntroductionStep({ responses, onUpdate, onNext }: IntroductionStepProps) {
  const [localResponses, setLocalResponses] = useState({
    boardRole: responses.boardRole,
    boardType: responses.boardType,
    evaluationPurpose: responses.evaluationPurpose,
  });

  useEffect(() => {
    setLocalResponses({
      boardRole: responses.boardRole,
      boardType: responses.boardType,
      evaluationPurpose: responses.evaluationPurpose,
    });
  }, [responses]);

  const handleContinue = () => {
    onUpdate(localResponses);
    onNext();
  };

  const isComplete = localResponses.boardRole && localResponses.boardType && localResponses.evaluationPurpose;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <ClipboardList className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-amber-500">Board Effectiveness Checklist</CardTitle>
              <CardDescription className="mt-2 text-foreground/80">
                Evaluate board governance across 8 key dimensions with 42 essential checkpoints.
                Identify strengths and improvement opportunities for more effective governance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-amber-500">8</div>
              <div className="text-xs text-muted-foreground">Dimensions</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-amber-500">42</div>
              <div className="text-xs text-muted-foreground">Checkpoints</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-amber-500">25</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
            <div className="p-3 bg-nex-dark rounded-lg">
              <div className="text-2xl font-bold text-amber-500">4</div>
              <div className="text-xs text-muted-foreground">Rating Levels</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board Role */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-cyan" />
            <CardTitle className="text-lg text-foreground">Your Role</CardTitle>
          </div>
          <CardDescription>What is your relationship to the board?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {BOARD_ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => setLocalResponses(prev => ({ ...prev, boardRole: role.value }))}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  localResponses.boardRole === role.value
                    ? 'border-cyan bg-cyan/10'
                    : 'border-nex-border hover:border-cyan/50'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{role.label}</div>
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Board Type */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan" />
            <CardTitle className="text-lg text-foreground">Board Type</CardTitle>
          </div>
          <CardDescription>What type of board is this?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {BOARD_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setLocalResponses(prev => ({ ...prev, boardType: type.value }))}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  localResponses.boardType === type.value
                    ? 'border-cyan bg-cyan/10'
                    : 'border-nex-border hover:border-cyan/50'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Purpose */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan" />
            <CardTitle className="text-lg text-foreground">Evaluation Purpose</CardTitle>
          </div>
          <CardDescription>Why are you evaluating this board?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {EVALUATION_PURPOSES.map((purpose) => (
              <button
                key={purpose.value}
                onClick={() => setLocalResponses(prev => ({ ...prev, evaluationPurpose: purpose.value }))}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  localResponses.evaluationPurpose === purpose.value
                    ? 'border-cyan bg-cyan/10'
                    : 'border-nex-border hover:border-cyan/50'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{purpose.label}</div>
                  <div className="text-sm text-muted-foreground">{purpose.description}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-amber-500 text-white hover:bg-amber-600"
        >
          Begin Evaluation
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

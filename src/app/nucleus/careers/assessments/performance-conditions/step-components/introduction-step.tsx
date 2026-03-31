'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight, Gauge, Building, Brain, TrendingUp, MessageSquare, Users, Target } from 'lucide-react';
import type { PerformanceContext } from '../assessment-client';

interface IntroductionStepProps {
  context: PerformanceContext;
  onUpdate: (context: PerformanceContext) => void;
  onNext: () => void;
}

const PURPOSE_OPTIONS = [
  { value: 'job-search', label: 'Job Search', description: 'Evaluating potential opportunities' },
  { value: 'role-optimization', label: 'Role Optimization', description: 'Improving current situation' },
  { value: 'self-awareness', label: 'Self-Awareness', description: 'Understanding myself better' },
  { value: 'team-building', label: 'Team Building', description: 'Building or joining a team' },
] as const;

const EXPERIENCE_OPTIONS = [
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6-10', label: '6-10 years' },
  { value: '11-15', label: '11-15 years' },
  { value: '15+', label: '15+ years' },
] as const;

export function IntroductionStep({ context, onUpdate, onNext }: IntroductionStepProps) {
  const [localContext, setLocalContext] = useState<PerformanceContext>(context);

  useEffect(() => {
    setLocalContext(context);
  }, [context]);

  const handleChange = <K extends keyof PerformanceContext>(key: K, value: PerformanceContext[K]) => {
    setLocalContext(prev => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    onUpdate(localContext);
    onNext();
  };

  const isComplete = localContext.assessmentPurpose && localContext.yearsExperience;

  return (
    <div className="space-y-6">
      {/* Framework Overview */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan/5 border-emerald-500/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Gauge className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Your Performance Conditions Map</CardTitle>
              <CardDescription>
                Everyone has unique conditions under which they do their best work.
                This assessment helps you identify yours.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Building, word: 'Environment', color: 'text-blue-500', desc: 'Physical & digital workspace' },
              { icon: Brain, word: 'Autonomy', color: 'text-purple-500', desc: 'Control & decision authority' },
              { icon: TrendingUp, word: 'Challenge', color: 'text-orange-500', desc: 'Growth & stretch level' },
              { icon: MessageSquare, word: 'Feedback', color: 'text-green-500', desc: 'Recognition & input' },
              { icon: Users, word: 'Collaboration', color: 'text-pink-500', desc: 'Team & social dynamics' },
              { icon: Target, word: 'Purpose', color: 'text-gold', desc: 'Meaning & impact' },
            ].map((c) => (
              <div key={c.word} className="text-center p-3 bg-nex-dark/50 rounded-lg">
                <c.icon className={`h-6 w-6 mx-auto mb-2 ${c.color}`} />
                <div className="font-semibold text-foreground text-sm">{c.word}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Context Questions */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">About You</CardTitle>
          <CardDescription>
            Help us personalize your performance conditions map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Role */}
          <div className="space-y-3">
            <Label htmlFor="currentRole" className="text-foreground">
              What is your current or target role? (optional)
            </Label>
            <Input
              id="currentRole"
              value={localContext.currentRole}
              onChange={(e) => handleChange('currentRole', e.target.value)}
              placeholder="e.g., Drug Safety Scientist, PV Manager, Consultant..."
              className="bg-nex-dark border-nex-border"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <Label className="text-foreground">How many years of professional experience do you have?</Label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('yearsExperience', option.value)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    localContext.yearsExperience === option.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'border-nex-border bg-nex-dark hover:border-emerald-500/50 text-muted-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Why are you taking this assessment?</Label>
            <div className="grid md:grid-cols-2 gap-3">
              {PURPOSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('assessmentPurpose', option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    localContext.assessmentPurpose === option.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-nex-border bg-nex-dark hover:border-emerald-500/50'
                  }`}
                >
                  <div className={`font-medium ${localContext.assessmentPurpose === option.value ? 'text-emerald-500' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="p-4 bg-nex-dark/50 border border-nex-border rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">How This Works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Rate your preferences across 6 dimensions of work conditions</li>
          <li>• For each item, choose where you fall on the spectrum (no right or wrong answers)</li>
          <li>• Mark which conditions are most important to you</li>
          <li>• Receive your personalized High-Performance Conditions Map</li>
          <li>• Takes approximately 15-20 minutes to complete</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-emerald-500 text-white hover:bg-emerald-600"
        >
          Begin Mapping
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

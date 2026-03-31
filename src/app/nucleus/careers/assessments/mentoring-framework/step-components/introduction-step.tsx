'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight, Heart, Users, Target, Sparkles, BookOpen } from 'lucide-react';
import type { MentoringContext } from '../assessment-client';

interface IntroductionStepProps {
  context: MentoringContext;
  onUpdate: (context: MentoringContext) => void;
  onNext: () => void;
}

const ROLE_OPTIONS = [
  { value: 'mentor', label: 'Mentor', description: 'I guide and support others' },
  { value: 'mentee', label: 'Mentee', description: 'I receive guidance and support' },
  { value: 'both', label: 'Both', description: 'I serve in both capacities' },
] as const;

const DURATION_OPTIONS = [
  { value: 'new', label: 'Just Starting', description: '< 3 months' },
  { value: '3-6months', label: 'Developing', description: '3-6 months' },
  { value: '6-12months', label: 'Established', description: '6-12 months' },
  { value: '1year+', label: 'Long-term', description: '1+ years' },
] as const;

const TYPE_OPTIONS = [
  { value: 'formal', label: 'Formal Program', description: 'Structured organizational program' },
  { value: 'informal', label: 'Informal', description: 'Organic, self-initiated relationship' },
  { value: 'peer', label: 'Peer Mentoring', description: 'Colleagues at similar levels' },
  { value: 'reverse', label: 'Reverse Mentoring', description: 'Junior mentoring senior' },
] as const;

export function IntroductionStep({ context, onUpdate, onNext }: IntroductionStepProps) {
  const [localContext, setLocalContext] = useState<MentoringContext>(context);

  useEffect(() => {
    setLocalContext(context);
  }, [context]);

  const handleChange = <K extends keyof MentoringContext>(key: K, value: MentoringContext[K]) => {
    setLocalContext(prev => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    onUpdate(localContext);
    onNext();
  };

  const isComplete = localContext.mentoringRole && localContext.relationshipDuration && localContext.relationshipType;

  return (
    <div className="space-y-6">
      {/* Framework Overview */}
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/5 border-pink-500/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">The 5 C&apos;s of Effective Mentoring</CardTitle>
              <CardDescription>
                A comprehensive framework for building transformative mentoring relationships
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { letter: 'C', word: 'Clarity', icon: Target, color: 'text-blue-500', desc: 'Clear goals & expectations' },
              { letter: 'C', word: 'Connection', icon: Users, color: 'text-green-500', desc: 'Trust & psychological safety' },
              { letter: 'C', word: 'Challenge', icon: Sparkles, color: 'text-orange-500', desc: 'Growth through stretch' },
              { letter: 'C', word: 'Commitment', icon: Heart, color: 'text-red-500', desc: 'Consistent engagement' },
              { letter: 'C', word: 'Capability', icon: BookOpen, color: 'text-purple-500', desc: 'Skills & knowledge transfer' },
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
          <CardTitle className="text-lg text-foreground">Your Mentoring Context</CardTitle>
          <CardDescription>
            Help us personalize your assessment by sharing about your mentoring relationship
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">What is your primary role in this relationship?</Label>
            <div className="grid md:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('mentoringRole', option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    localContext.mentoringRole === option.value
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-nex-border bg-nex-dark hover:border-pink-500/50'
                  }`}
                >
                  <div className={`font-medium ${localContext.mentoringRole === option.value ? 'text-pink-500' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">How long have you been in this mentoring relationship?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('relationshipDuration', option.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    localContext.relationshipDuration === option.value
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-nex-border bg-nex-dark hover:border-pink-500/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${localContext.relationshipDuration === option.value ? 'text-pink-500' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">What type of mentoring relationship is this?</Label>
            <div className="grid md:grid-cols-2 gap-3">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('relationshipType', option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    localContext.relationshipType === option.value
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-nex-border bg-nex-dark hover:border-pink-500/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${localContext.relationshipType === option.value ? 'text-pink-500' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          <div className="space-y-3">
            <Label htmlFor="primaryGoal" className="text-foreground">
              What is the primary goal of this mentoring relationship? (optional)
            </Label>
            <Input
              id="primaryGoal"
              value={localContext.primaryGoal}
              onChange={(e) => handleChange('primaryGoal', e.target.value)}
              placeholder="e.g., Career transition, leadership development, technical skills..."
              className="bg-nex-dark border-nex-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="p-4 bg-nex-dark/50 border border-nex-border rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">How This Assessment Works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Rate yourself on 25 statements across the 5 C&apos;s (5 items each)</li>
          <li>• Be honest — this is for your growth, not judgment</li>
          <li>• Add reflections to capture insights and action items</li>
          <li>• Receive personalized recommendations for strengthening each area</li>
          <li>• Takes approximately 15-20 minutes to complete</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isComplete}
          className="bg-pink-500 text-white hover:bg-pink-600"
        >
          Begin Assessment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

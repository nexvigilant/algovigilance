'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Building2, Network, FileText, CheckCircle2, RotateCcw, Briefcase } from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  EcosystemStep,
  CompanyStep,
  SectorStep,
  PreparationStep
} from './step-components';
import { COMPANY_TYPES } from './due-diligence-data';

type Step = 'setup' | 'ecosystem' | 'company' | 'sector' | 'preparation' | 'complete';

interface ResearchResponses {
  ecosystem: Record<string, string>;
  company: Record<string, string>;
  sector: Record<string, string>;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'ecosystem', label: 'Ecosystem', icon: Globe, color: 'cyan' },
  { id: 'company', label: 'Company', icon: Building2, color: 'purple-400' },
  { id: 'sector', label: 'Sector', icon: Network, color: 'gold' },
  { id: 'preparation', label: 'Prepare', icon: FileText, color: 'green-400' },
];

const STEP_ORDER: Step[] = ['setup', 'ecosystem', 'company', 'sector', 'preparation', 'complete'];

export function PreparationClient() {
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [responses, setResponses] = useState<ResearchResponses>({
    ecosystem: {},
    company: {},
    sector: {}
  });

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const _progress = currentStep === 'complete'
    ? 100
    : currentStep === 'setup'
    ? 0
    : ((currentStepIndex - 1) / (STEP_ORDER.length - 2)) * 100;

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const updateResponses = useCallback((area: keyof ResearchResponses, newResponses: Record<string, string>) => {
    setResponses(prev => ({
      ...prev,
      [area]: newResponses
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses({
      ecosystem: {},
      company: {},
      sector: {}
    });
    setCompanyName('');
    setCompanyType('');
    setCurrentStep('setup');
  }, []);

  const handleComplete = useCallback(() => {
    setCurrentStep('complete');
  }, []);

  const canStartResearch = companyName.trim().length >= 2;

  // Setup screen
  if (currentStep === 'setup') {
    return (
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-cyan" />
            </div>
            <div>
              <CardTitle>Target Company Setup</CardTitle>
              <CardDescription>
                Enter the company you&apos;re researching for your interview or advisory conversation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="e.g., Vertex Pharmaceuticals, Moderna, IQVIA"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-nex-dark border-nex-border"
            />
            <p className="text-xs text-muted-foreground">
              Enter the name of the company you&apos;re preparing to meet with
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-type">Company Type</Label>
            <Select value={companyType} onValueChange={setCompanyType}>
              <SelectTrigger className="bg-nex-dark border-nex-border">
                <SelectValue placeholder="Select company type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This helps customize research prompts and PV insights
            </p>
          </div>

          <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">What You&apos;ll Research</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-cyan mt-0.5" />
                <span><strong>Ecosystem:</strong> Market position, funding, regulatory environment, trends</span>
              </li>
              <li className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-purple-400 mt-0.5" />
                <span><strong>Company:</strong> Products, leadership, PV structure, recent events</span>
              </li>
              <li className="flex items-start gap-2">
                <Network className="h-4 w-4 text-gold mt-0.5" />
                <span><strong>Sector:</strong> Competitors, therapeutic landscape, sector challenges</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={goNext}
            disabled={!canStartResearch}
            className="w-full bg-cyan text-nex-deep hover:bg-cyan-glow"
          >
            Start Research
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completion screen
  if (currentStep === 'complete') {
    const totalResponses =
      Object.values(responses.ecosystem).filter(v => v.trim().length >= 30).length +
      Object.values(responses.company).filter(v => v.trim().length >= 30).length +
      Object.values(responses.sector).filter(v => v.trim().length >= 30).length;

    return (
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-cyan" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Preparation Complete!
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You&apos;ve completed your due diligence research for <strong className="text-foreground">{companyName}</strong>.
            Your preparation materials are ready for download and review.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
            {STEPS.slice(0, 3).map(step => {
              const Icon = step.icon;
              const area = step.id as keyof ResearchResponses;
              const filledCount = Object.values(responses[area] || {}).filter(v => v.trim().length >= 30).length;

              return (
                <div key={step.id} className="text-center">
                  {Icon && <Icon className={`h-6 w-6 mx-auto mb-1 text-${step.color}`} />}
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{filledCount} entries</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => goToStep('preparation')}
              className="border-cyan text-cyan hover:bg-cyan/10"
            >
              View Outputs
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-nex-border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Research
            </Button>
          </div>

          <div className="mt-8 p-4 bg-gold/5 border border-gold/20 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Before Your Meeting:</strong> Review your preparation brief
              30 minutes before the conversation. Remember: active listening &gt; jumping to solutions.
            </p>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Research depth: {totalResponses}/12 areas completed
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center gap-3 p-3 bg-nex-surface border border-nex-border rounded-lg">
        <Briefcase className="h-5 w-5 text-cyan" />
        <div>
          <p className="font-semibold text-foreground">{companyName}</p>
          {companyType && (
            <p className="text-xs text-muted-foreground">
              {COMPANY_TYPES.find(t => t.id === companyType)?.label}
            </p>
          )}
        </div>
      </div>

      <AssessmentLayout
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="Due Diligence Progress"
        badgeLabel={`${STEPS.find(s => s.id === currentStep)?.label} Research`}
        onStepClick={(id) => (currentStep as string) !== 'complete' && STEP_ORDER.indexOf(id as Step) <= currentStepIndex && goToStep(id as Step)}
      >
        {currentStep === 'ecosystem' && (
          <EcosystemStep
            responses={responses.ecosystem}
            onUpdate={(newResponses) => updateResponses('ecosystem', newResponses)}
            onNext={goNext}
          />
        )}

        {currentStep === 'company' && (
          <CompanyStep
            responses={responses.company}
            onUpdate={(newResponses) => updateResponses('company', newResponses)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'sector' && (
          <SectorStep
            responses={responses.sector}
            onUpdate={(newResponses) => updateResponses('sector', newResponses)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'preparation' && (
          <PreparationStep
            allResponses={responses}
            companyName={companyName}
            onBack={goBack}
            onComplete={handleComplete}
          />
        )}
      </AssessmentLayout>
    </div>
  );
}

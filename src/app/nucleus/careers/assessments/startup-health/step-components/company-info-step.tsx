'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, Building2, Globe, User, Briefcase } from 'lucide-react';
import type { CompanyInfo } from '../types';

interface CompanyInfoStepProps {
  companyInfo: CompanyInfo;
  onUpdate: (updates: Partial<CompanyInfo>) => void;
  onNext: () => void;
}

const STAGE_OPTIONS = [
  { value: 'pre-seed', label: 'Pre-Seed', description: 'Idea stage, pre-revenue' },
  { value: 'seed', label: 'Seed', description: 'Early product, initial traction' },
  { value: 'series-a', label: 'Series A', description: 'Product-market fit, scaling' },
  { value: 'series-b', label: 'Series B', description: 'Proven model, growth focus' },
  { value: 'growth', label: 'Growth/Later', description: 'Mature operations, expansion' },
];

const ADVISORY_TYPE_OPTIONS = [
  { value: 'informal', label: 'Informal Advisor', description: 'No formal agreement, casual guidance' },
  { value: 'formal', label: 'Formal Advisor', description: 'Advisory agreement with defined terms' },
  { value: 'board', label: 'Board Member', description: 'Board seat with fiduciary duties' },
  { value: 'consultant', label: 'Consultant', description: 'Paid engagement, specific deliverables' },
];

const COMPENSATION_OPTIONS = [
  { value: 'equity', label: 'Equity Only', description: 'Stock options or shares' },
  { value: 'cash', label: 'Cash Only', description: 'Retainer or hourly fee' },
  { value: 'hybrid', label: 'Hybrid', description: 'Cash + equity combination' },
  { value: 'pro-bono', label: 'Pro Bono', description: 'No compensation' },
];

export function CompanyInfoStep({ companyInfo, onUpdate, onNext }: CompanyInfoStepProps) {
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(companyInfo);

  useEffect(() => {
    setLocalInfo(companyInfo);
  }, [companyInfo]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setLocalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    onUpdate(localInfo);
    onNext();
  };

  const isMinimumComplete = localInfo.name.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-cyan/10 to-transparent border-l-4 border-cyan rounded-r-lg">
        <h2 className="text-xl font-semibold text-foreground mb-1">Company Information</h2>
        <p className="text-sm text-muted-foreground">
          Capture basic details about the startup and the advisory opportunity.
          This context helps frame your due diligence assessment.
        </p>
      </div>

      {/* Basic Info Card */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <Building2 className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Basic Details</CardTitle>
              <CardDescription>Core information about the company</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={localInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter company name"
                className="bg-nex-dark border-nex-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={localInfo.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="bg-nex-dark border-nex-border pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry / Sector</Label>
            <Input
              id="industry"
              value={localInfo.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="e.g., Healthcare SaaS, Fintech, Biotech"
              className="bg-nex-dark border-nex-border"
            />
          </div>

          {/* Company Stage */}
          <div className="space-y-2">
            <Label>Company Stage</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {STAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('stage', option.value as CompanyInfo['stage'])}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    localInfo.stage === option.value
                      ? 'border-cyan bg-cyan/10'
                      : 'border-nex-border bg-nex-dark hover:border-cyan/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${localInfo.stage === option.value ? 'text-cyan' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <User className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Primary Contact</CardTitle>
              <CardDescription>Who introduced you or who you're speaking with</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={localInfo.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="Name of your primary contact"
                className="bg-nex-dark border-nex-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactRole">Their Role</Label>
              <Input
                id="contactRole"
                value={localInfo.contactRole}
                onChange={(e) => handleChange('contactRole', e.target.value)}
                placeholder="e.g., CEO, COO, Board Member"
                className="bg-nex-dark border-nex-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="howIntroduced">How Were You Introduced?</Label>
            <Input
              id="howIntroduced"
              value={localInfo.howIntroduced}
              onChange={(e) => handleChange('howIntroduced', e.target.value)}
              placeholder="e.g., Mutual connection, LinkedIn, Conference"
              className="bg-nex-dark border-nex-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advisory Structure Card */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Advisory Structure</CardTitle>
              <CardDescription>Type of engagement being discussed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advisory Type */}
          <div className="space-y-2">
            <Label>Advisory Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ADVISORY_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('advisoryType', option.value as CompanyInfo['advisoryType'])}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    localInfo.advisoryType === option.value
                      ? 'border-cyan bg-cyan/10'
                      : 'border-nex-border bg-nex-dark hover:border-cyan/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${localInfo.advisoryType === option.value ? 'text-cyan' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compensation Type */}
          <div className="space-y-2">
            <Label>Compensation Structure</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMPENSATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('compensationType', option.value as CompanyInfo['compensationType'])}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    localInfo.compensationType === option.value
                      ? 'border-gold bg-gold/10'
                      : 'border-nex-border bg-nex-dark hover:border-gold/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${localInfo.compensationType === option.value ? 'text-gold' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Card */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground">Initial Notes</CardTitle>
          <CardDescription>
            Any initial impressions, questions, or context you want to capture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={localInfo.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Initial thoughts, key questions, context about the opportunity..."
            className="bg-nex-dark border-nex-border min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!isMinimumComplete}
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          Start Due Diligence
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

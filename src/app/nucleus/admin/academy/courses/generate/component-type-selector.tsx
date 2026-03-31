'use client';

import { ArrowLeft, Grid3X3, Target, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ComponentType = 'domain' | 'epa' | 'cpa';

interface ComponentTypeSelectorProps {
  areaName: string;
  counts: {
    domains: number;
    epas: number;
    cpas: number;
  };
  onSelect: (type: ComponentType) => void;
  onBack: () => void;
}

export function ComponentTypeSelector({
  areaName,
  counts,
  onSelect,
  onBack
}: ComponentTypeSelectorProps) {
  const options = [
    {
      type: 'domain' as ComponentType,
      icon: Grid3X3,
      title: 'From Domain',
      description: 'Generate a deep dive into a specific competency domain. Covers all Knowledge, Skills, and Behaviors within the domain.',
      count: counts.domains,
      countLabel: 'Domains',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      recommended: true,
    },
    {
      type: 'epa' as ComponentType,
      icon: Target,
      title: 'From EPA',
      description: 'Generate a pathway to master an Entrustable Professional Activity. Includes required domains and proficiency progression.',
      count: counts.epas,
      countLabel: 'EPAs',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      type: 'cpa' as ComponentType,
      icon: ClipboardList,
      title: 'From CPA',
      description: 'Generate preparation for a Critical Practice Activity. Covers key EPAs and behavioral anchors needed.',
      count: counts.cpas,
      countLabel: 'CPAs',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Functional Areas
      </Button>

      {/* Header */}
      <div className="mb-8">
        <Badge variant="outline" className="mb-2">{areaName}</Badge>
        <h1 className="text-3xl font-bold font-headline mb-2">
          Choose Generation Source
        </h1>
        <p className="text-muted-foreground">
          Select what type of framework component to base your capability pathway on.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <Card
              key={option.type}
              className={`bg-nex-surface border border-nex-light rounded-lg cursor-pointer hover:border-primary/50 transition-all relative ${
                option.recommended ? 'ring-2 ring-primary/20' : ''
              }`}
              onClick={() => onSelect(option.type)}
            >
              {option.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${option.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${option.color}`} />
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-2xl font-bold ${option.color}`}>
                      {option.count}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {option.countLabel} available
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Which should I choose?</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>
            <strong>Domain</strong> - Best for comprehensive topic coverage. Generates content for all KSBs in that domain.
          </li>
          <li>
            <strong>EPA</strong> - Best for activity-focused learning. Generates content to achieve entrustment in a specific professional activity.
          </li>
          <li>
            <strong>CPA</strong> - Best for career milestone preparation. Generates content to prepare for critical practice readiness.
          </li>
        </ul>
      </div>
    </div>
  );
}

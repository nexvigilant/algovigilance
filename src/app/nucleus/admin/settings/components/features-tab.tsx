'use client';

import { Zap, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { SystemSettings } from '../actions';

interface FeaturesTabProps {
  settings: SystemSettings['features'];
  onUpdate: <K extends keyof SystemSettings['features']>(
    key: K,
    value: SystemSettings['features'][K]
  ) => void;
}

const FEATURE_FLAGS = [
  {
    key: 'communityEnabled' as const,
    label: 'Community',
    description: 'Forums, circles, messaging, and social features',
  },
  {
    key: 'academyEnabled' as const,
    label: 'Academy',
    description: 'Capability pathways, courses, and learning content',
  },
  {
    key: 'careersEnabled' as const,
    label: 'Careers',
    description: 'Job board and career pathway features',
  },
  {
    key: 'guardianEnabled' as const,
    label: 'Guardian',
    description: 'Pharmaceutical safety monitoring features',
  },
  {
    key: 'aiAssistEnabled' as const,
    label: 'AI Assistance',
    description: 'AI-powered suggestions and content generation',
  },
] as const;

export function FeaturesTab({ settings, onUpdate }: FeaturesTabProps) {
  return (
    <Card className="border-cyan/20 bg-nex-surface">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan" />
          Feature Flags
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Enable or disable platform features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {FEATURE_FLAGS.map((feature) => (
          <div
            key={feature.key}
            className="flex items-center justify-between py-3 border-b border-cyan/10 last:border-0"
          >
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base">{feature.label}</Label>
                {settings[feature.key] ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-slate-500/20 text-slate-400 border-0">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-dim">{feature.description}</p>
            </div>
            <Switch
              checked={settings[feature.key]}
              onCheckedChange={(checked) => onUpdate(feature.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

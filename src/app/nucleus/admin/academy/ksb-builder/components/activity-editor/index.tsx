'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { KSBActivity, TriageConfig, RedPenConfig, SynthesisConfig } from '@/types/pv-curriculum';
import { TriageBuilder } from './triage-builder';
import { RedPenBuilder } from './red-pen-builder';
import { SynthesisBuilder } from './synthesis-builder';

interface ActivityEditorProps {
  activity: KSBActivity;
  onChange: (activity: KSBActivity) => void;
}

export function ActivityEditor({ activity, onChange }: ActivityEditorProps) {
  const engineType = activity.engineType;

  if (engineType === 'triage' && activity.config) {
    return (
      <TriageBuilder
        config={activity.config as TriageConfig}
        onChange={(config) => onChange({ ...activity, config })}
      />
    );
  }

  if (engineType === 'red_pen' && activity.config) {
    return (
      <RedPenBuilder
        config={activity.config as RedPenConfig}
        onChange={(config) => onChange({ ...activity, config })}
      />
    );
  }

  if (engineType === 'synthesis' && activity.config) {
    return (
      <SynthesisBuilder
        config={activity.config as SynthesisConfig}
        onChange={(config) => onChange({ ...activity, config })}
      />
    );
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Select an activity engine type to configure the activity. Use the JSON editor in the
        meantime for direct configuration.
      </AlertDescription>
    </Alert>
  );
}

export default ActivityEditor;

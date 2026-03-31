'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KSBHook } from '@/types/pv-curriculum';

type ScenarioType = KSBHook['scenarioType'];

interface HookEditorProps {
  hook: KSBHook;
  onChange: (hook: KSBHook) => void;
}

export function HookEditor({ hook, onChange }: HookEditorProps) {
  return (
    <>
      <div>
        <Label>Scenario Type</Label>
        <Select
          value={hook.scenarioType}
          onValueChange={(v) =>
            onChange({ ...hook, scenarioType: v as ScenarioType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real_world">Real World</SelectItem>
            <SelectItem value="case_study">Case Study</SelectItem>
            <SelectItem value="challenge">Challenge</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Hook Content (30 seconds)</Label>
        <Textarea
          value={hook.content}
          onChange={(e) => onChange({ ...hook, content: e.target.value })}
          placeholder="Write an engaging scenario that captures attention..."
          rows={4}
        />
      </div>
    </>
  );
}

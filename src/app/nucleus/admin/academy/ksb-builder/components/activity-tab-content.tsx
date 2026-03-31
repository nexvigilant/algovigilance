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
import type { KSBActivity } from '@/types/pv-curriculum';
import { ActivityEditor } from './activity-editor';

type EngineType = KSBActivity['engineType'];

interface ActivityTabContentProps {
  activity: KSBActivity;
  onChange: (activity: KSBActivity) => void;
}

export function ActivityTabContent({
  activity,
  onChange,
}: ActivityTabContentProps) {
  return (
    <>
      <div>
        <Label>Activity Engine</Label>
        <Select
          value={activity.engineType}
          onValueChange={(v) =>
            onChange({ ...activity, engineType: v as EngineType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triage">Triage (Decision Making)</SelectItem>
            <SelectItem value="red_pen">Red Pen (Error Detection)</SelectItem>
            <SelectItem value="synthesis">Synthesis (Creation)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Instructions</Label>
        <Textarea
          value={activity.instructions}
          onChange={(e) =>
            onChange({ ...activity, instructions: e.target.value })
          }
          placeholder="Activity instructions..."
          rows={4}
        />
      </div>
      <ActivityEditor activity={activity} onChange={onChange} />
    </>
  );
}

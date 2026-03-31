'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view and discover' },
  { value: 'members-only', label: 'Members Only', description: 'Only AlgoVigilance members can view' },
  { value: 'private', label: 'Private', description: 'Hidden from discovery' },
] as const;

const JOIN_OPTIONS = [
  { value: 'open', label: 'Open', description: 'Anyone can join instantly' },
  { value: 'request', label: 'Request to Join', description: 'Approval required' },
  { value: 'invite-only', label: 'Invite Only', description: 'By invitation only' },
] as const;

export type WizardVisibility = 'public' | 'members-only' | 'private';
export type WizardJoinType = 'open' | 'request' | 'invite-only';

interface WizardAccessStepProps {
  visibility: WizardVisibility;
  joinType: WizardJoinType;
  onVisibilityChange: (value: WizardVisibility) => void;
  onJoinTypeChange: (value: WizardJoinType) => void;
}

export function WizardAccessStep({
  visibility,
  joinType,
  onVisibilityChange,
  onJoinTypeChange,
}: WizardAccessStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-cyan-soft mb-3 block">Visibility</Label>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                visibility === option.value
                  ? 'border-cyan bg-cyan/10'
                  : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={(e) => onVisibilityChange(e.target.value as WizardVisibility)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-cyan-soft/70">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-cyan-soft mb-3 block">Join Type</Label>
        <div className="space-y-2">
          {JOIN_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                joinType === option.value
                  ? 'border-cyan bg-cyan/10'
                  : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
              )}
            >
              <input
                type="radio"
                name="joinType"
                value={option.value}
                checked={joinType === option.value}
                onChange={(e) => onJoinTypeChange(e.target.value as WizardJoinType)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-cyan-soft/70">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

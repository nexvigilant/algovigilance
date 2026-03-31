'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RequestFormBuilder, type RequestFormConfig } from './request-form-builder';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view and join' },
  { value: 'members-only', label: 'Members Only', description: 'Only AlgoVigilance members can view' },
  { value: 'private', label: 'Private', description: 'Invite-only circle' },
] as const;

const JOIN_TYPE_OPTIONS = [
  { value: 'open', label: 'Open', description: 'Anyone can join instantly' },
  { value: 'request', label: 'Request to Join', description: 'Users must request to join' },
  { value: 'invite-only', label: 'Invite Only', description: 'Only invited users can join' },
] as const;

type ForumVisibility = typeof VISIBILITY_OPTIONS[number]['value'];
type ForumJoinType = typeof JOIN_TYPE_OPTIONS[number]['value'];

interface ForumAccessCardProps {
  visibility: ForumVisibility;
  joinType: ForumJoinType;
  requestFormConfig: RequestFormConfig;
  onVisibilityChange: (value: ForumVisibility) => void;
  onJoinTypeChange: (value: ForumJoinType) => void;
  onRequestFormChange: (config: RequestFormConfig) => void;
}

export function ForumAccessCard({
  visibility,
  joinType,
  requestFormConfig,
  onVisibilityChange,
  onJoinTypeChange,
  onRequestFormChange,
}: ForumAccessCardProps) {
  return (
    <Card className="bg-nex-surface border-cyan/30">
      <CardHeader>
        <CardTitle className="text-white">Access & Permissions</CardTitle>
        <CardDescription className="text-cyan-soft/70">
          Control who can see and join this circle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  onChange={(e) => onVisibilityChange(e.target.value as ForumVisibility)}
                  className="mt-1"
                />
                <div className="flex-1">
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
            {JOIN_TYPE_OPTIONS.map((option) => (
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
                  onChange={(e) => onJoinTypeChange(e.target.value as ForumJoinType)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-cyan-soft/70">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Request Form Builder - shown when joinType is 'request' */}
        {joinType === 'request' && (
          <div className="pt-4 border-t border-cyan/20">
            <RequestFormBuilder
              value={requestFormConfig}
              onChange={onRequestFormChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

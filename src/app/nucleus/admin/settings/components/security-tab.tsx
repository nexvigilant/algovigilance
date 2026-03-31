'use client';

import { Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SystemSettings } from '../actions';

interface SecurityTabProps {
  settings: SystemSettings['security'];
  onUpdate: <K extends keyof SystemSettings['security']>(
    key: K,
    value: SystemSettings['security'][K]
  ) => void;
}

export function SecurityTab({ settings, onUpdate }: SecurityTabProps) {
  return (
    <Card className="border-cyan/20 bg-nex-surface">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan" />
          Security Settings
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Authentication and security configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min={1}
              max={10}
              value={settings.maxLoginAttempts}
              onChange={(e) =>
                onUpdate('maxLoginAttempts', parseInt(e.target.value) || 5)
              }
              className="bg-nex-light border-cyan/20"
              aria-describedby="maxLoginAttempts-description"
            />
            <p id="maxLoginAttempts-description" className="text-xs text-slate-dim">
              Failed attempts before account lockout
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min={15}
              max={1440}
              value={settings.sessionTimeoutMinutes}
              onChange={(e) =>
                onUpdate('sessionTimeoutMinutes', parseInt(e.target.value) || 60)
              }
              className="bg-nex-light border-cyan/20"
              aria-describedby="sessionTimeout-description"
            />
            <p id="sessionTimeout-description" className="text-xs text-slate-dim">
              Idle time before automatic logout
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-cyan/10">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Require Email Verification</Label>
              <p className="text-sm text-slate-dim">
                Users must verify email before accessing features
              </p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) =>
                onUpdate('requireEmailVerification', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Social Login</Label>
              <p className="text-sm text-slate-dim">
                Allow login via Google, GitHub, etc.
              </p>
            </div>
            <Switch
              checked={settings.allowSocialLogin}
              onCheckedChange={(checked) => onUpdate('allowSocialLogin', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

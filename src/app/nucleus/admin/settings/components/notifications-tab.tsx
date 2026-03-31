'use client';

import { Bell } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SystemSettings } from '../actions';

interface NotificationsTabProps {
  settings: SystemSettings['notifications'];
  onUpdate: <K extends keyof SystemSettings['notifications']>(
    key: K,
    value: SystemSettings['notifications'][K]
  ) => void;
}

export function NotificationsTab({ settings, onUpdate }: NotificationsTabProps) {
  return (
    <Card className="border-cyan/20 bg-nex-surface">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Bell className="h-5 w-5 text-cyan" />
          Notification Settings
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Configure email and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between py-3 border-b border-cyan/10">
          <div>
            <Label className="text-base">Email Notifications</Label>
            <p className="text-sm text-slate-dim">
              Send email notifications to users
            </p>
          </div>
          <Switch
            checked={settings.emailEnabled}
            onCheckedChange={(checked) => onUpdate('emailEnabled', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Digest Frequency</Label>
          <Select
            value={settings.digestFrequency}
            onValueChange={(value) =>
              onUpdate('digestFrequency', value as 'daily' | 'weekly' | 'never')
            }
          >
            <SelectTrigger className="w-[200px] bg-nex-light border-cyan/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-dim">
            How often to send activity digest emails
          </p>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-cyan/10">
          <div>
            <Label className="text-base">Marketing Emails</Label>
            <p className="text-sm text-slate-dim">
              Allow marketing and promotional emails
            </p>
          </div>
          <Switch
            checked={settings.marketingEnabled}
            onCheckedChange={(checked) => onUpdate('marketingEnabled', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

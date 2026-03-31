'use client';

import { Bell, Save } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CommunitySettingsExtended } from '../actions';

interface NotificationSettingsTabProps {
  settings: CommunitySettingsExtended;
  onSettingsChange: (settings: CommunitySettingsExtended) => void;
  saving: boolean;
  onSave: () => void;
}

export function NotificationSettingsTab({
  settings,
  onSettingsChange,
  saving,
  onSave,
}: NotificationSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure system notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Send activity summary emails
              </p>
            </div>
            <Switch
              checked={settings.notifications.emailDigest}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  notifications: { ...settings.notifications, emailDigest: checked },
                })
              }
            />
          </div>

          {settings.notifications.emailDigest && (
            <div className="space-y-2">
              <Label>Digest Frequency</Label>
              <Select
                value={settings.notifications.digestFrequency}
                onValueChange={(val: 'daily' | 'weekly' | 'never') =>
                  onSettingsChange({
                    ...settings,
                    notifications: { ...settings.notifications, digestFrequency: val },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Admin Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify admins of important events
              </p>
            </div>
            <Switch
              checked={settings.notifications.adminAlerts}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  notifications: { ...settings.notifications, adminAlerts: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Moderator Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Alert moderators to flagged content
              </p>
            </div>
            <Switch
              checked={settings.notifications.moderatorNotifications}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    moderatorNotifications: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Notification Settings
        </Button>
      </div>
    </>
  );
}

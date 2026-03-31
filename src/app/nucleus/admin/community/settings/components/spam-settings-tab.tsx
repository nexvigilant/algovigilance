'use client';

import { AlertTriangle, Save } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface SpamSettingsTabProps {
  settings: CommunitySettingsExtended;
  onSettingsChange: (settings: CommunitySettingsExtended) => void;
  saving: boolean;
  onSave: () => void;
}

export function SpamSettingsTab({
  settings,
  onSettingsChange,
  saving,
  onSave,
}: SpamSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Spam Protection
          </CardTitle>
          <CardDescription>
            Configure spam detection and prevention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-Detect Spam</Label>
              <p className="text-sm text-muted-foreground">
                AI-powered spam detection
              </p>
            </div>
            <Switch
              checked={settings.spam.autoDetect}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  spam: { ...settings.spam, autoDetect: checked },
                })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report threshold</Label>
              <Input
                type="number"
                value={settings.spam.reportThreshold}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    spam: {
                      ...settings.spam,
                      reportThreshold: parseInt(e.target.value) || 1,
                    },
                  })
                }
                min={1}
                max={20}
              />
              <p className="text-xs text-muted-foreground">
                Auto-hide after this many reports
              </p>
            </div>

            <div className="space-y-2">
              <Label>New account restriction (hours)</Label>
              <Input
                type="number"
                value={settings.spam.blockNewAccountsHours}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    spam: {
                      ...settings.spam,
                      blockNewAccountsHours: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
                max={168}
              />
              <p className="text-xs text-muted-foreground">
                Limit new accounts for this period
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link Restrictions</Label>
            <Select
              value={settings.spam.linkRestrictions}
              onValueChange={(val: 'none' | 'moderate' | 'strict') =>
                onSettingsChange({
                  ...settings,
                  spam: { ...settings.spam, linkRestrictions: val },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - All links allowed</SelectItem>
                <SelectItem value="moderate">Moderate - Some restrictions</SelectItem>
                <SelectItem value="strict">Strict - Heavy restrictions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Spam Settings
        </Button>
      </div>
    </>
  );
}

'use client';

import { Globe, Settings, Save } from 'lucide-react';
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

interface GeneralSettingsTabProps {
  settings: CommunitySettingsExtended;
  onSettingsChange: (settings: CommunitySettingsExtended) => void;
  saving: boolean;
  onSave: () => void;
}

export function GeneralSettingsTab({
  settings,
  onSettingsChange,
  saving,
  onSave,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Defaults
            </CardTitle>
            <CardDescription>
              Default settings for new communities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Circle Visibility</Label>
              <Select
                value={settings.defaultVisibility}
                onValueChange={(val: 'public' | 'private' | 'semi-private') =>
                  onSettingsChange({ ...settings, defaultVisibility: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="semi-private">Semi-Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Auto-Moderation Level</Label>
              <Select
                value={settings.autoModerationLevel}
                onValueChange={(val: 'low' | 'medium' | 'high') =>
                  onSettingsChange({ ...settings, autoModerationLevel: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Features
            </CardTitle>
            <CardDescription>
              Enable or disable features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'forums', label: 'Forums & Discussions' },
              { key: 'messaging', label: 'Direct Messaging' },
              { key: 'polls', label: 'Polls & Surveys' },
              { key: 'reactions', label: 'Reactions' },
              { key: 'badges', label: 'Badges & Achievements' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={settings.features[key as keyof typeof settings.features]}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      features: { ...settings.features, [key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save General Settings
        </Button>
      </div>
    </div>
  );
}

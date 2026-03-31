'use client';

import { Clock, Save } from 'lucide-react';
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
import type { CommunitySettingsExtended } from '../actions';

interface RateLimitSettingsTabProps {
  settings: CommunitySettingsExtended;
  onSettingsChange: (settings: CommunitySettingsExtended) => void;
  saving: boolean;
  onSave: () => void;
}

export function RateLimitSettingsTab({
  settings,
  onSettingsChange,
  saving,
  onSave,
}: RateLimitSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>
            Control how often users can perform actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Apply limits to user actions
              </p>
            </div>
            <Switch
              checked={settings.rateLimits.enabled}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  rateLimits: { ...settings.rateLimits, enabled: checked },
                })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Posts per hour</Label>
              <Input
                type="number"
                value={settings.rateLimits.postsPerHour}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    rateLimits: {
                      ...settings.rateLimits,
                      postsPerHour: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={1}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Replies per hour</Label>
              <Input
                type="number"
                value={settings.rateLimits.repliesPerHour}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    rateLimits: {
                      ...settings.rateLimits,
                      repliesPerHour: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={1}
                max={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Messages per hour</Label>
              <Input
                type="number"
                value={settings.rateLimits.messagesPerHour}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    rateLimits: {
                      ...settings.rateLimits,
                      messagesPerHour: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={1}
                max={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Reactions per minute</Label>
              <Input
                type="number"
                value={settings.rateLimits.reactionsPerMinute}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    rateLimits: {
                      ...settings.rateLimits,
                      reactionsPerMinute: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={1}
                max={60}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Rate Limits
        </Button>
      </div>
    </>
  );
}

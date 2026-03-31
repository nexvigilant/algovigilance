'use client';

import { FileText, Save } from 'lucide-react';
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

interface ContentSettingsTabProps {
  settings: CommunitySettingsExtended;
  onSettingsChange: (settings: CommunitySettingsExtended) => void;
  saving: boolean;
  onSave: () => void;
}

export function ContentSettingsTab({
  settings,
  onSettingsChange,
  saving,
  onSave,
}: ContentSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Restrictions
          </CardTitle>
          <CardDescription>
            Set limits on user-generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Min post length</Label>
              <Input
                type="number"
                value={settings.content.minPostLength}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    content: {
                      ...settings.content,
                      minPostLength: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Max post length</Label>
              <Input
                type="number"
                value={settings.content.maxPostLength}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    content: {
                      ...settings.content,
                      maxPostLength: parseInt(e.target.value) || 1000,
                    },
                  })
                }
                min={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Min reply length</Label>
              <Input
                type="number"
                value={settings.content.minReplyLength}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    content: {
                      ...settings.content,
                      minReplyLength: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Max reply length</Label>
              <Input
                type="number"
                value={settings.content.maxReplyLength}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    content: {
                      ...settings.content,
                      maxReplyLength: parseInt(e.target.value) || 500,
                    },
                  })
                }
                min={100}
              />
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'allowImages', label: 'Allow Images', desc: 'Users can upload images' },
              { key: 'allowLinks', label: 'Allow Links', desc: 'Users can include URLs' },
              { key: 'allowMentions', label: 'Allow Mentions', desc: 'Users can @mention others' },
              { key: 'profanityFilter', label: 'Profanity Filter', desc: 'Block inappropriate language' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={settings.content[key as keyof typeof settings.content] as boolean}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      content: { ...settings.content, [key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Content Settings
        </Button>
      </div>
    </>
  );
}

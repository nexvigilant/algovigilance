'use client';

import { Settings } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { SystemSettings } from '../actions';

interface GeneralTabProps {
  settings: SystemSettings['general'];
  onUpdate: <K extends keyof SystemSettings['general']>(
    key: K,
    value: SystemSettings['general'][K]
  ) => void;
}

export function GeneralTab({ settings, onUpdate }: GeneralTabProps) {
  return (
    <Card className="border-cyan/20 bg-nex-surface">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan" />
          General Settings
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Basic platform configuration options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => onUpdate('siteName', e.target.value)}
              className="bg-nex-light border-cyan/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Input
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => onUpdate('siteDescription', e.target.value)}
              className="bg-nex-light border-cyan/20"
            />
          </div>
        </div>

        <div className="border-t border-cyan/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-slate-dim">
                Temporarily disable access to the platform
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => onUpdate('maintenanceMode', checked)}
            />
          </div>
          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => onUpdate('maintenanceMessage', e.target.value)}
                className="bg-nex-light border-cyan/20"
                rows={3}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

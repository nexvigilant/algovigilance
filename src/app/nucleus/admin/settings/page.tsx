'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Bell,
  Shield,
  Zap,
  Save,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { customToast } from '@/components/voice';
import { getSystemSettings, updateSystemSettings, type SystemSettings } from './actions';
import { toAppError, getUserFriendlyMessage } from '@/types/errors';

import { logger } from '@/lib/logger';
const log = logger.scope('admin/settings');

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'AlgoVigilance',
    siteDescription: 'Empowerment Through Vigilance',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
  },
  features: {
    communityEnabled: true,
    academyEnabled: true,
    careersEnabled: false,
    guardianEnabled: false,
    aiAssistEnabled: true,
  },
  notifications: {
    emailEnabled: true,
    digestFrequency: 'daily',
    marketingEnabled: false,
  },
  security: {
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    requireEmailVerification: true,
    allowSocialLogin: true,
  },
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const result = await getSystemSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (err) {
      const appError = toAppError(err);
      log.error('Error loading settings:', appError);
      customToast.error(getUserFriendlyMessage(appError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateSystemSettings(settings);
      if (result.success) {
        customToast.success('Settings saved successfully');
        setHasChanges(false);
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      const appError = toAppError(err);
      log.error('Error saving settings:', appError);
      customToast.error(getUserFriendlyMessage(appError));
    } finally {
      setSaving(false);
    }
  }

  function updateSetting<K extends keyof SystemSettings>(
    category: K,
    key: keyof SystemSettings[K],
    value: SystemSettings[K][keyof SystemSettings[K]]
  ) {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/nucleus/admin"
          className="inline-flex items-center text-sm text-cyan-soft/70 hover:text-cyan mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Admin Hub
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-cyan" />
            <div>
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
              <p className="text-cyan-soft/70 text-sm">
                Configure platform features and global settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="circuit-button"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-nex-light border border-cyan/20">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan/20">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-cyan/20">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan/20">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan/20">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
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
                    value={settings.general.siteName}
                    onChange={(e) =>
                      updateSetting('general', 'siteName', e.target.value)
                    }
                    className="bg-nex-light border-cyan/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) =>
                      updateSetting('general', 'siteDescription', e.target.value)
                    }
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
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting('general', 'maintenanceMode', checked)
                    }
                  />
                </div>
                {settings.general.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.general.maintenanceMessage}
                      onChange={(e) =>
                        updateSetting('general', 'maintenanceMessage', e.target.value)
                      }
                      className="bg-nex-light border-cyan/20"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features">
          <Card className="border-cyan/20 bg-nex-surface">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan" />
                Feature Flags
              </CardTitle>
              <CardDescription className="text-slate-dim">
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'communityEnabled' as const,
                  label: 'Community',
                  description: 'Forums, circles, messaging, and social features',
                },
                {
                  key: 'academyEnabled' as const,
                  label: 'Academy',
                  description: 'Capability pathways, courses, and learning content',
                },
                {
                  key: 'careersEnabled' as const,
                  label: 'Careers',
                  description: 'Job board and career pathway features',
                },
                {
                  key: 'guardianEnabled' as const,
                  label: 'Guardian',
                  description: 'Pharmaceutical safety monitoring features',
                },
                {
                  key: 'aiAssistEnabled' as const,
                  label: 'AI Assistance',
                  description: 'AI-powered suggestions and content generation',
                },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between py-3 border-b border-cyan/10 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="text-base">{feature.label}</Label>
                      {settings.features[feature.key] ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-0">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-dim">{feature.description}</p>
                  </div>
                  <Switch
                    checked={settings.features[feature.key]}
                    onCheckedChange={(checked) =>
                      updateSetting('features', feature.key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
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
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting('notifications', 'emailEnabled', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Digest Frequency</Label>
                <Select
                  value={settings.notifications.digestFrequency}
                  onValueChange={(value) =>
                    updateSetting('notifications', 'digestFrequency', value as 'daily' | 'weekly' | 'never')
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
                  checked={settings.notifications.marketingEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting('notifications', 'marketingEnabled', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
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
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)
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
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateSetting('security', 'sessionTimeoutMinutes', parseInt(e.target.value) || 60)
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
                    checked={settings.security.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      updateSetting('security', 'requireEmailVerification', checked)
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
                    checked={settings.security.allowSocialLogin}
                    onCheckedChange={(checked) =>
                      updateSetting('security', 'allowSocialLogin', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Settings,
  Globe,
  Clock,
  AlertTriangle,
  FileText,
  Bell,
  RotateCcw,
  Route,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { customToast } from '@/components/voice';
import {
  updateCommunitySettings,
} from '@/app/nucleus/admin/community/actions';
import {
  getExtendedSettings,
  updateRateLimitSettings,
  updateSpamSettings,
  updateContentSettings,
  updateNotificationSettings,
  resetToDefaults,
  type CommunitySettingsExtended,
} from './actions';
import { PathwayConfigurator } from './components/pathway-configurator';

import { logger } from '@/lib/logger';
const log = logger.scope('settings/page');

export default function CommunitySettingsPage() {
  const [settings, setSettings] = useState<CommunitySettingsExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getExtendedSettings();
      setSettings(data);
    } catch (error) {
      log.error('Error loading settings:', error);
      customToast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveGeneral() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await updateCommunitySettings({
        defaultVisibility: settings.defaultVisibility,
        autoModerationLevel: settings.autoModerationLevel,
        features: settings.features,
      });
      if (result.success) {
        customToast.success('General settings saved');
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      customToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRateLimits() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await updateRateLimitSettings(settings.rateLimits);
      if (result.success) {
        customToast.success('Rate limit settings saved');
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      customToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSpam() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await updateSpamSettings(settings.spam);
      if (result.success) {
        customToast.success('Spam settings saved');
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      customToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveContent() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await updateContentSettings(settings.content);
      if (result.success) {
        customToast.success('Content settings saved');
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      customToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await updateNotificationSettings(settings.notifications);
      if (result.success) {
        customToast.success('Notification settings saved');
      } else {
        customToast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      customToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      const result = await resetToDefaults();
      if (result.success) {
        customToast.success('Settings reset to defaults');
        setResetDialogOpen(false);
        await loadSettings();
      } else {
        customToast.error(result.error || 'Failed to reset settings');
      }
    } catch (error) {
      customToast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-bold">
            Community Settings
          </h1>
          <p className="text-muted-foreground">
            Configure global settings, rate limits, and content policies
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setResetDialogOpen(true)}
          className="text-red-500 hover:text-red-600"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pathways" className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            Pathways
          </TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="spam">Spam</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
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
                        setSettings({ ...settings, defaultVisibility: val })
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
                        setSettings({ ...settings, autoModerationLevel: val })
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
                          setSettings({
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
              <Button onClick={handleSaveGeneral} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save General Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Pathways Tab */}
        <TabsContent value="pathways">
          <PathwayConfigurator />
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits">
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
                    setSettings({
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
                      setSettings({
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
                      setSettings({
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
                      setSettings({
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
                      setSettings({
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
            <Button onClick={handleSaveRateLimits} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Rate Limits
            </Button>
          </div>
        </TabsContent>

        {/* Spam Tab */}
        <TabsContent value="spam">
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
                    setSettings({
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
                      setSettings({
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
                      setSettings({
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
                    setSettings({
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
            <Button onClick={handleSaveSpam} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Spam Settings
            </Button>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
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
                      setSettings({
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
                      setSettings({
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
                      setSettings({
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
                      setSettings({
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
                        setSettings({
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
            <Button onClick={handleSaveContent} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Content Settings
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
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
                    setSettings({
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
                      setSettings({
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
                    setSettings({
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
                    setSettings({
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
            <Button onClick={handleSaveNotifications} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Notification Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600"
            >
              Reset All Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

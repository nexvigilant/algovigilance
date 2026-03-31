'use client';

import { useState } from 'react';
import { SectionCard } from './section-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Palette, Bell, Mail, MessageSquare, Info, Sun, Moon, Monitor } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface PreferencesTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

export function PreferencesTab({ profile: _profile, userId: _userId, onProfileUpdate: _onProfileUpdate }: PreferencesTabProps) {
  const { toast } = useToast();

  // Placeholder states - to be implemented in schema
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [communityDigest, setCommunityDigest] = useState(true);
  const [newsAndAnnouncements, setNewsAndAnnouncements] = useState(true);

  const handleNotificationChange = (_setting: string, _value: boolean) => {
    // Placeholder - will be implemented with backend
    toast({
      title: 'Setting Updated',
      description: 'Your notification preference has been saved',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-headline font-bold text-cyan-soft">Preferences</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your experience with theme and notification settings
        </p>
      </div>

      {/* Theme Settings */}
      <SectionCard
        title="Appearance"
        description="Customize how AlgoVigilance looks"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Palette className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">Theme Preference</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-cyan/30 bg-nex-surface hover:bg-cyan/10 transition-colors"
                >
                  <Sun className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-white">Light</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-cyan bg-cyan/10"
                >
                  <Moon className="h-5 w-5 text-cyan-glow" />
                  <span className="text-sm text-white font-medium">Dark</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-cyan/30 bg-nex-surface hover:bg-cyan/10 transition-colors"
                >
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-white">System</span>
                </button>
              </div>
            </div>
          </div>

          <Alert className="bg-nex-surface border-cyan/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              <strong className="text-white">Coming Soon:</strong> Light theme and system-based theme
              switching will be available in a future update. Currently, dark theme is active.
            </AlertDescription>
          </Alert>
        </div>
      </SectionCard>

      {/* Notification Settings */}
      <SectionCard
        title="Email Notifications"
        description="Choose what updates you want to receive via email"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-md bg-cyan/10">
              <Bell className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white mb-1">Notification Preferences</p>
              <p className="text-sm text-muted-foreground">
                Manage your email notification settings
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-11">
            {/* Email Notifications Master Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-cyan/20">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="text-white cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable or disable all email notifications
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                  handleNotificationChange('email', checked);
                }}
              />
            </div>

            {/* Course Updates */}
            <div className="flex items-center justify-between py-3 border-b border-cyan/20">
              <div className="flex items-center gap-3">
                <div className="w-4" /> {/* Spacer for alignment */}
                <div>
                  <Label
                    htmlFor="course-updates"
                    className={`cursor-pointer ${emailNotifications ? 'text-white' : 'text-muted-foreground'}`}
                  >
                    Academy Updates
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    New courses, progress milestones, and certificates
                  </p>
                </div>
              </div>
              <Switch
                id="course-updates"
                checked={courseUpdates}
                disabled={!emailNotifications}
                onCheckedChange={(checked) => {
                  setCourseUpdates(checked);
                  handleNotificationChange('courseUpdates', checked);
                }}
              />
            </div>

            {/* Community Digest */}
            <div className="flex items-center justify-between py-3 border-b border-cyan/20">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label
                    htmlFor="community-digest"
                    className={`cursor-pointer ${emailNotifications ? 'text-white' : 'text-muted-foreground'}`}
                  >
                    Community Digest
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Weekly summary of forum discussions and community activity
                  </p>
                </div>
              </div>
              <Switch
                id="community-digest"
                checked={communityDigest}
                disabled={!emailNotifications}
                onCheckedChange={(checked) => {
                  setCommunityDigest(checked);
                  handleNotificationChange('communityDigest', checked);
                }}
              />
            </div>

            {/* News and Announcements */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label
                    htmlFor="news-announcements"
                    className={`cursor-pointer ${emailNotifications ? 'text-white' : 'text-muted-foreground'}`}
                  >
                    News & Announcements
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Important updates, new features, and platform news
                  </p>
                </div>
              </div>
              <Switch
                id="news-announcements"
                checked={newsAndAnnouncements}
                disabled={!emailNotifications}
                onCheckedChange={(checked) => {
                  setNewsAndAnnouncements(checked);
                  handleNotificationChange('newsAndAnnouncements', checked);
                }}
              />
            </div>
          </div>

          <Alert className="bg-nex-surface border-cyan/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              <strong className="text-white">Note:</strong> Notification preferences will be fully
              functional in an upcoming update. Changes are currently saved locally.
            </AlertDescription>
          </Alert>
        </div>
      </SectionCard>

      {/* Language & Region (Future) */}
      <SectionCard
        title="Language & Region"
        description="Set your preferred language and regional settings"
      >
        <div className="space-y-4">
          <div className="p-4 bg-nex-surface border border-cyan/20 rounded-lg">
            <p className="text-sm text-white mb-2">Current Language</p>
            <p className="text-sm text-muted-foreground mb-4">English (United States)</p>
            <Alert className="bg-nex-dark border-cyan/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs text-muted-foreground">
                <strong className="text-white">Coming Soon:</strong> Multi-language support and regional
                settings will be added in a future update.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

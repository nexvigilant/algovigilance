'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/lib/actions/users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './overview-tab';
import { BasicInfoTab } from './basic-info-tab';
import { ProfessionalTab } from './professional-tab';
import { EducationTab } from './education-tab';
import { CredentialsTab } from './credentials-tab';
import { AffiliationsTab } from './affiliations-tab';
import { AccountSecurityTab } from './account-security-tab';
import { PrivacyTab } from './privacy-tab';
import { PreferencesTab } from './preferences-tab';
import type { UserProfile } from '@/lib/schemas/firestore';
import { VoiceLoading } from '@/components/voice';

export function ProfileTabs() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const profileData = await getUserProfile(user.uid);
    setProfile(profileData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Navigate to a specific tab programmatically
  const navigateToTab = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  // Refresh profile data after updates
  const handleProfileUpdate = () => {
    loadProfile();
  };

  if (loading) {
    return <VoiceLoading context="profile" variant="spinner" />;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Tab Navigation */}
      <TabsList className="inline-flex h-auto flex-wrap gap-2 bg-nex-dark p-2 border border-cyan/30">
        <TabsTrigger value="overview" className="data-[state=active]:bg-cyan/20">
          Overview
        </TabsTrigger>
        <TabsTrigger value="basic" className="data-[state=active]:bg-cyan/20">
          Basic Info
        </TabsTrigger>
        <TabsTrigger value="professional" className="data-[state=active]:bg-cyan/20">
          Professional
        </TabsTrigger>
        <TabsTrigger value="education" className="data-[state=active]:bg-cyan/20">
          Education
        </TabsTrigger>
        <TabsTrigger value="credentials" className="data-[state=active]:bg-cyan/20">
          Credentials
        </TabsTrigger>
        <TabsTrigger value="affiliations" className="data-[state=active]:bg-cyan/20">
          Affiliations
        </TabsTrigger>
        <TabsTrigger value="account" className="data-[state=active]:bg-cyan/20">
          Account & Security
        </TabsTrigger>
        <TabsTrigger value="privacy" className="data-[state=active]:bg-cyan/20">
          Privacy
        </TabsTrigger>
        <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan/20">
          Preferences
        </TabsTrigger>
      </TabsList>

      {/* Tab Content */}
      <TabsContent value="overview" className="space-y-4">
        <OverviewTab profile={profile} onNavigateToTab={navigateToTab} />
      </TabsContent>

      <TabsContent value="basic" className="space-y-4">
        {user && (
          <BasicInfoTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="professional" className="space-y-4">
        {user && (
          <ProfessionalTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="education" className="space-y-4">
        {user && (
          <EducationTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="credentials" className="space-y-4">
        {user && (
          <CredentialsTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="affiliations" className="space-y-4">
        {user && (
          <AffiliationsTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="account" className="space-y-4">
        {user && (
          <AccountSecurityTab user={user} />
        )}
      </TabsContent>

      <TabsContent value="privacy" className="space-y-4">
        {user && (
          <PrivacyTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="preferences" className="space-y-4">
        {user && (
          <PreferencesTab
            profile={profile}
            userId={user.uid}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

// Temporary placeholder component for tabs under development
function _PlaceholderTab({ title, description, status }: { title: string; description: string; status: string }) {
  return (
    <div className="rounded-lg border border-cyan/30 bg-nex-dark p-8 text-center">
      <h3 className="text-2xl font-headline font-bold text-cyan-soft mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <p className="text-sm text-nex-gold-400 font-medium">{status}</p>
    </div>
  );
}

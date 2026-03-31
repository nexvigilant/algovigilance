'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileCompleteness } from './profile-completeness';
import { User, Lock, Award, Shield, GraduationCap, Building2 } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface OverviewTabProps {
  profile: UserProfile | null;
  onNavigateToTab: (tabValue: string) => void;
}

export function OverviewTab({ profile, onNavigateToTab }: OverviewTabProps) {
  // Calculate quick stats
  const stats = {
    profileSections: calculateProfileSections(profile),
    educationEntries: profile?.education?.length || 0,
    credentialEntries: profile?.credentials?.length || 0,
    affiliations: profile?.organizationAffiliations?.length || 0,
    specializations: profile?.specializations?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Profile Completeness */}
      <ProfileCompleteness profile={profile} />

      {/* Quick Stats */}
      <Card className="border-cyan/30 bg-nex-dark">
        <CardHeader>
          <CardTitle className="text-cyan-soft">Quick Stats</CardTitle>
          <CardDescription>
            Overview of your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={<User className="h-5 w-5 text-cyan-glow" />}
              label="Profile Sections"
              value={`${stats.profileSections.completed}/${stats.profileSections.total}`}
              subtext="completed"
            />
            <StatCard
              icon={<GraduationCap className="h-5 w-5 text-cyan-glow" />}
              label="Education"
              value={stats.educationEntries}
              subtext={stats.educationEntries === 1 ? "entry" : "entries"}
              onClick={() => onNavigateToTab('education')}
              actionText={stats.educationEntries === 0 ? "Add education" : undefined}
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-cyan-glow" />}
              label="Credentials"
              value={stats.credentialEntries}
              subtext={stats.credentialEntries === 1 ? "credential" : "credentials"}
              onClick={() => onNavigateToTab('credentials')}
              actionText={stats.credentialEntries === 0 ? "Add credentials" : undefined}
            />
            <StatCard
              icon={<Building2 className="h-5 w-5 text-cyan-glow" />}
              label="Affiliations"
              value={stats.affiliations}
              subtext={stats.affiliations === 1 ? "organization" : "organizations"}
              onClick={() => onNavigateToTab('affiliations')}
            />
            <StatCard
              icon={<User className="h-5 w-5 text-cyan-glow" />}
              label="Specializations"
              value={stats.specializations}
              subtext={stats.specializations === 1 ? "specialization" : "specializations"}
              onClick={() => onNavigateToTab('affiliations')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-cyan/30 bg-nex-dark">
        <CardHeader>
          <CardTitle className="text-cyan-soft">Quick Actions</CardTitle>
          <CardDescription>
            Common profile management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start border-cyan/30 hover:bg-cyan/10"
              onClick={() => onNavigateToTab('professional')}
            >
              <User className="h-4 w-4 mr-2" />
              Edit Professional Info
            </Button>
            <Button
              variant="outline"
              className="justify-start border-cyan/30 hover:bg-cyan/10"
              onClick={() => onNavigateToTab('account')}
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              variant="outline"
              className="justify-start border-cyan/30 hover:bg-cyan/10"
              onClick={() => onNavigateToTab('credentials')}
            >
              <Award className="h-4 w-4 mr-2" />
              Add Credentials
            </Button>
            <Button
              variant="outline"
              className="justify-start border-cyan/30 hover:bg-cyan/10"
              onClick={() => onNavigateToTab('privacy')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext: string;
  onClick?: () => void;
  actionText?: string;
}

function StatCard({ icon, label, value, subtext, onClick, actionText }: StatCardProps) {
  const content = (
    <div className={`p-4 rounded-lg border border-cyan/20 bg-nex-surface ${onClick ? 'cursor-pointer hover:bg-nex-light transition-colors' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-cyan/10">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
          {actionText && (
            <p className="text-xs text-cyan-glow mt-1">{actionText} →</p>
          )}
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
}

function calculateProfileSections(profile: UserProfile | null): { completed: number; total: number } {
  if (!profile) return { completed: 0, total: 5 };

  let completed = 0;
  const total = 5;

  // Basic Information (name, location)
  if (profile.name && profile.location) completed++;

  // Professional Profile (at least 3 of 6 fields)
  const professionalFields = [
    profile.professionalTitle,
    profile.bio,
    profile.currentEmployer,
    profile.yearsOfExperience !== undefined,
    profile.linkedInProfile,
    profile.specializations && profile.specializations.length > 0,
  ].filter(Boolean).length;
  if (professionalFields >= 3) completed++;

  // Education (at least 1 entry)
  if (profile.education && profile.education.length > 0) completed++;

  // Credentials (at least 1 entry)
  if (profile.credentials && profile.credentials.length > 0) completed++;

  // Affiliations (at least 1)
  if (profile.organizationAffiliations && profile.organizationAffiliations.length > 0) completed++;

  return { completed, total };
}

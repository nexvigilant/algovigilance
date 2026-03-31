'use client';

import { useState, useEffect } from 'react';
import { SectionCard } from './section-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCookieConsent, type CookieConsent } from '@/components/shared/banners';
import { Eye, EyeOff, Download, Trash2, Shield, AlertCircle, Info, Cookie, Mail, BarChart3 } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface PrivacyTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

const MARKETING_CONSENT_KEY = 'nexvigilant_marketing_consent';

export function PrivacyTab({ profile, userId, onProfileUpdate: _onProfileUpdate }: PrivacyTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { consent, updateConsent, isLoaded } = useCookieConsent();
  const [_error, _setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Profile visibility settings (placeholder - to be implemented in schema)
  const isProfilePublic = true; // Default until schema is updated

  // Load marketing consent from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MARKETING_CONSENT_KEY);
      setMarketingConsent(stored === 'true');
    }
  }, []);

  const handleCookiePreferenceChange = (key: keyof CookieConsent, value: boolean) => {
    if (!consent) return;

    const newConsent: CookieConsent = {
      ...consent,
      [key]: value,
      timestamp: Date.now(),
    };
    updateConsent(newConsent);

    toast({
      title: 'Preferences Updated',
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} cookies ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleMarketingConsentChange = (value: boolean) => {
    setMarketingConsent(value);
    localStorage.setItem(MARKETING_CONSENT_KEY, value.toString());

    toast({
      title: 'Marketing Preferences Updated',
      description: value
        ? 'You will receive marketing communications from AlgoVigilance.'
        : 'You have opted out of marketing communications.',
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Create a JSON file with user's profile data
      const dataToExport = {
        exportDate: new Date().toISOString(),
        userData: {
          userId: userId,
          name: profile?.name,
          email: profile?.email,
          professionalTitle: profile?.professionalTitle,
          bio: profile?.bio,
          location: profile?.location,
          currentEmployer: profile?.currentEmployer,
          yearsOfExperience: profile?.yearsOfExperience,
          linkedInProfile: profile?.linkedInProfile,
          education: profile?.education,
          credentials: profile?.credentials,
          organizationAffiliations: profile?.organizationAffiliations,
          specializations: profile?.specializations,
          emailVerified: user?.emailVerified,
          createdAt: profile?.createdAt,
          updatedAt: profile?.updatedAt,
        },
        preferences: {
          cookieConsent: consent,
          marketingConsent: marketingConsent,
        },
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexvigilant-profile-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Your profile data has been downloaded',
      });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-headline font-bold text-cyan-soft">Privacy & Visibility</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control who can see your profile and manage your personal data
        </p>
      </div>

      {/* Error Alert */}
      {_error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{_error}</AlertDescription>
        </Alert>
      )}

      {/* Cookie & Tracking Preferences */}
      <SectionCard
        title="Cookie & Tracking Preferences"
        description="Control how we use cookies and track your activity"
      >
        <div className="space-y-4">
          {/* Essential - Always On */}
          <div className="flex items-center justify-between p-3 bg-nex-surface rounded-lg border border-cyan/20">
            <div className="flex items-center gap-3">
              <Cookie className="h-5 w-5 text-cyan-glow" />
              <div>
                <Label className="text-sm font-medium text-white">Essential Cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Required for authentication and basic functionality
                </p>
              </div>
            </div>
            <span className="text-xs text-cyan bg-cyan/10 px-2 py-1 rounded">Always On</span>
          </div>

          {/* Analytics Toggle */}
          <div className="flex items-center justify-between p-3 bg-nex-surface rounded-lg border border-slate-dim/30">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-slate-dim" />
              <div>
                <Label htmlFor="analytics-toggle" className="text-sm font-medium text-white cursor-pointer">
                  Analytics
                </Label>
                <p className="text-xs text-muted-foreground">
                  Anonymous usage data to help improve the platform (privacy-friendly)
                </p>
              </div>
            </div>
            <Switch
              id="analytics-toggle"
              checked={consent?.analytics ?? true}
              onCheckedChange={(checked) => handleCookiePreferenceChange('analytics', checked)}
              disabled={!isLoaded}
            />
          </div>

          {/* Functional / Behavior Tracking Toggle */}
          <div className="flex items-center justify-between p-3 bg-nex-surface rounded-lg border border-slate-dim/30">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-slate-dim" />
              <div>
                <Label htmlFor="functional-toggle" className="text-sm font-medium text-white cursor-pointer">
                  Personalization & Behavior Tracking
                </Label>
                <p className="text-xs text-muted-foreground">
                  Track learning patterns to provide personalized recommendations
                </p>
              </div>
            </div>
            <Switch
              id="functional-toggle"
              checked={consent?.functional ?? false}
              onCheckedChange={(checked) => handleCookiePreferenceChange('functional', checked)}
              disabled={!isLoaded}
            />
          </div>
        </div>
      </SectionCard>

      {/* Communication Preferences */}
      <SectionCard
        title="Communication Preferences"
        description="Control what emails you receive from us"
      >
        <div className="space-y-4">
          {/* Service Emails - Always On */}
          <div className="flex items-center justify-between p-3 bg-nex-surface rounded-lg border border-cyan/20">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-cyan-glow" />
              <div>
                <Label className="text-sm font-medium text-white">Service Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Security alerts, account updates, and important notifications
                </p>
              </div>
            </div>
            <span className="text-xs text-cyan bg-cyan/10 px-2 py-1 rounded">Required</span>
          </div>

          {/* Marketing Emails Toggle */}
          <div className="flex items-center justify-between p-3 bg-nex-surface rounded-lg border border-slate-dim/30">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-dim" />
              <div>
                <Label htmlFor="marketing-toggle" className="text-sm font-medium text-white cursor-pointer">
                  Marketing Communications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Product updates, new features, and educational content
                </p>
              </div>
            </div>
            <Switch
              id="marketing-toggle"
              checked={marketingConsent}
              onCheckedChange={handleMarketingConsentChange}
            />
          </div>
        </div>
      </SectionCard>

      {/* Profile Visibility */}
      <SectionCard
        title="Profile Visibility"
        description="Control who can view your professional profile"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              {isProfilePublic ? (
                <Eye className="h-5 w-5 text-cyan-glow" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <p className="text-lg font-medium text-white">
                {isProfilePublic ? 'Public Profile' : 'Private Profile'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isProfilePublic
                  ? 'Your profile is visible to other members of the AlgoVigilance community'
                  : 'Your profile is only visible to you'}
              </p>
            </div>
          </div>

          <Alert className="bg-nex-surface border-cyan/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              <strong className="text-white">Coming Soon:</strong> Advanced visibility controls will allow you
              to customize which parts of your profile are visible to different audiences (public, members only,
              connections only).
            </AlertDescription>
          </Alert>
        </div>
      </SectionCard>

      {/* Data Privacy Rights */}
      <SectionCard
        title="Your Data Rights"
        description="Export or delete your personal data"
      >
        <div className="space-y-4">
          <div className="p-4 bg-nex-surface border border-cyan/20 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <Download className="h-5 w-5 text-cyan-glow mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Export Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your profile data in JSON format. This includes all information you've
                  added to your profile and your preferences.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={isExporting}
              className="border-cyan/30 text-cyan-glow hover:bg-cyan/10"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export My Data'}
            </Button>
          </div>

          <div className="p-4 bg-nex-surface border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <Trash2 className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Delete Your Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Alert className="bg-nex-dark border-red-500/20 mb-3">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs text-red-400">
                <strong>Coming Soon:</strong> Account deletion will be available in a future update. For now,
                please contact support if you wish to delete your account.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </SectionCard>

      {/* Privacy Policy Link */}
      <SectionCard
        title="Privacy Information"
        description="Learn how we protect and use your data"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Shield className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white mb-2">
                We take your privacy seriously. Your personal data is encrypted and securely stored.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • We never sell your personal information to third parties
                </p>
                <p>
                  • Your data is used only to provide and improve our services
                </p>
                <p>
                  • You have full control over your profile visibility
                </p>
                <p>
                  • You can export or delete your data at any time
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-glow hover:text-cyan-soft underline"
                >
                  Read our full Privacy Policy →
                </a>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* GDPR/CCPA Compliance Info */}
      <Alert className="bg-nex-surface border-cyan/20">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm text-muted-foreground">
          <strong className="text-white">Privacy Compliance:</strong> AlgoVigilance is committed to
          protecting your privacy rights under GDPR, CCPA, and other data protection regulations. You have
          the right to access, correct, export, and delete your personal data at any time.
        </AlertDescription>
      </Alert>
    </div>
  );
}

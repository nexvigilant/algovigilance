'use client';

import { useState } from 'react';
import { SectionCard } from './section-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { type User as FirebaseUser } from 'firebase/auth';
import { Shield, Mail, Lock, Calendar, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { logger } from '@/lib/logger';
const log = logger.scope('components/account-security-tab');

interface AccountSecurityTabProps {
  user: FirebaseUser;
}

export function AccountSecurityTab({ user }: AccountSecurityTabProps) {
  const { toast } = useToast();

  // Email change state
  const [newEmail, setNewEmail] = useState(user.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [_isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle email update
  const handleEmailSave = async () => {
    setEmailError(null);

    if (!emailPassword) {
      setEmailError('Please enter your current password to change your email');
      return;
    }

    if (newEmail === user.email) {
      setEmailError('New email is the same as current email');
      return;
    }

    setIsUpdatingEmail(true);
    const previousEmail = user.email ?? '';

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(previousEmail, emailPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);

      toast({
        title: 'Email Updated',
        description: 'Email updated successfully! Please verify your new email.',
      });

      setEmailPassword('');
    } catch (err: unknown) {
      log.error('Error updating email:', err);
      setEmailError(err instanceof Error ? err.message : 'Failed to update email');
      setNewEmail(previousEmail);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleEmailCancel = () => {
    setNewEmail(user.email || '');
    setEmailPassword('');
    setEmailError(null);
  };

  // Handle password update
  const handlePasswordSave = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email ?? '', currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully',
      });

      // Clear form and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: unknown) {
      log.error('Error updating password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordChange(false);
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <SectionCard
        title="Account Information"
        description="View your account details"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-cyan/10">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">User ID</span>
            </div>
            <span className="text-sm text-white font-mono">{user.uid.substring(0, 12)}...</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-cyan/10">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Account Created</span>
            </div>
            <span className="text-sm text-white">
              {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-cyan/10">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Sign In</span>
            </div>
            <span className="text-sm text-white">
              {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Email Verified</span>
            </div>
            {user.emailVerified ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-nex-gold-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Email Address */}
      <SectionCard
        title="Email Address"
        description="Change your account email address"
        onSave={handleEmailSave}
        onCancel={handleEmailCancel}
        editContent={
          <div className="space-y-4">
            {emailError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="pl-10 bg-nex-surface border-cyan/30 text-white"
                />
              </div>
            </div>
            {newEmail !== user.email && (
              <div className="space-y-2">
                <Label htmlFor="emailPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="emailPassword"
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Confirm your current password"
                    className="pl-10 bg-nex-surface border-cyan/30 text-white"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  For security, you must confirm your password to change your email
                </p>
              </div>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan/10">
            <Mail className="h-5 w-5 text-cyan-glow" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Current Email</p>
            <p className="text-lg font-medium text-white">{user.email}</p>
          </div>
          {user.emailVerified && (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          )}
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard
        title="Password"
        description="Change your account password"
      >
        {!showPasswordChange ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-cyan/10">
                <Lock className="h-5 w-5 text-cyan-glow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <p className="text-sm text-white">••••••••••••</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordChange(true)}
              className="border-cyan/30 hover:bg-cyan/10"
            >
              Change Password
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="pl-10 pr-10 bg-nex-surface border-cyan/30 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="pl-10 pr-10 bg-nex-surface border-cyan/30 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 bg-nex-surface border-cyan/30 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-cyan/20">
              <Button
                type="button"
                onClick={handlePasswordCancel}
                variant="outline"
                disabled={isUpdatingPassword}
                className="border-cyan/30"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePasswordSave}
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-cyan hover:bg-cyan-dark/80"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Two-Factor Authentication (Coming Soon) */}
      <SectionCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-sm text-muted-foreground italic">Coming Soon</p>
            </div>
          </div>
          <Alert className="bg-nex-surface border-cyan/20">
            <AlertDescription className="text-xs text-muted-foreground">
              Two-factor authentication will be available in a future update to provide enhanced security for your account.
            </AlertDescription>
          </Alert>
        </div>
      </SectionCard>
    </div>
  );
}

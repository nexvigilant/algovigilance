'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, User, Mail, Lock } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { logger } from '@/lib/logger';
const log = logger.scope('profile/profile-form');

export function ProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (authLoading) {
    return (
      <VoiceLoading context="profile" variant="spinner" message="Loading profile..." />
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You must be signed in to view this page.</AlertDescription>
      </Alert>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccess('');

    // Store the previous value for rollback
    const previousDisplayName = user.displayName;

    try {
      if (displayName !== user.displayName) {
        // Optimistically update the UI by triggering a success state
        // The Firebase user object will update automatically via onAuthStateChanged
        await updateProfile(user, { displayName });

        // Show success immediately (UI already reflects the change via state)
        setSuccess('Profile updated successfully!');

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      log.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');

      // Rollback on error - revert to previous display name
      setDisplayName(previousDisplayName || '');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Please enter your current password to change your email');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    // Store previous email for potential rollback
    const previousEmail = user.email ?? '';

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(previousEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, email);

      setSuccess('Email updated successfully! Please verify your new email.');
      setCurrentPassword('');

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      log.error('Error updating email:', err);
      setError(err instanceof Error ? err.message : 'Failed to update email');

      // Rollback email input on error
      setEmail(previousEmail);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email ?? '', currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);

      // Auto-dismiss success message after 4 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      log.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-500/10 border-green-500/20 text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display Name */}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              disabled={isUpdating || displayName === user.displayName}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
        </div>
      </form>

      <Separator />

      {/* Email */}
      <form onSubmit={handleUpdateEmail} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="pl-10"
            />
          </div>
        </div>

        {email !== user.email && (
          <div className="space-y-2">
            <Label htmlFor="currentPasswordEmail">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPasswordEmail"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Confirm your current password"
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isUpdating || !currentPassword}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Email
            </Button>
          </div>
        )}
      </form>

      <Separator />

      {/* Password */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Password</h3>
            <p className="text-sm text-muted-foreground">
              Change your password to keep your account secure
            </p>
          </div>
          <Button
            type="button"
            variant={showPasswordChange ? 'secondary' : 'outline'}
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPasswordChange">Current Password</Label>
              <Input
                id="currentPasswordChange"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button type="submit" disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        )}
      </div>

      <Separator />

      {/* Account Information */}
      <div className="space-y-4">
        <h3 className="font-medium">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Created:</span>
            <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Sign In:</span>
            <span>{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email Verified:</span>
            <span className={user.emailVerified ? 'text-cyan-glow' : 'text-nex-gold-400'}>
              {user.emailVerified ? 'Yes' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences (Future Implementation) */}
      <Separator />
      <div className="space-y-4 opacity-50 pointer-events-none">
        <h3 className="font-medium">Preferences</h3>
        <p className="text-sm text-muted-foreground">Coming soon in Phase 1.2</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your interface theme</p>
            </div>
            <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')} disabled>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser notifications</p>
            </div>
            <Switch
              id="pushNotifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}

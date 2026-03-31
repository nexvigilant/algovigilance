'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sendEmailVerification } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Mail, X } from 'lucide-react';
import { getErrorMessage } from '@/lib/auth-errors';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Load dismissed state from localStorage
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('emailVerificationBannerDismissed');
      return stored === 'true';
    }
    return false;
  });

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Reset dismissed state when email gets verified
  useEffect(() => {
    if (user?.emailVerified && dismissed) {
      setDismissed(false);
      localStorage.removeItem('emailVerificationBannerDismissed');
    }
  }, [user?.emailVerified, dismissed]);

  // Auto-hide success message after 5 seconds (with cleanup)
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  // Handle dismiss with localStorage persistence
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('emailVerificationBannerDismissed', 'true');
  };

  // Don't show banner if user is verified, not logged in, or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  async function handleResendEmail() {
    if (cooldown > 0 || !user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await sendEmailVerification(user);

      setSuccess(true);
      setCooldown(60); // 60 second cooldown
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="container mx-auto px-4 py-3">
        {success ? (
          <Alert className="border-cyan bg-cyan-faint text-nex-surface">
            <CheckCircle2 className="h-4 w-4 text-cyan" />
            <AlertDescription>
              Verification email sent! Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 text-white" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-nex-gold-500 bg-nex-gold-100 text-nex-surface">
            <Mail className="h-4 w-4 text-nex-gold-500" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-nex-surface hover:text-nex-dark transition-colors"
                  aria-label="Dismiss banner"
                  title="Dismiss (can be re-enabled in settings)"
                >
                  <X className="h-4 w-4" />
                </button>
                <span>
                  Your email address is not verified. Please check your inbox for the verification email.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={loading || cooldown > 0}
                className="border-nex-gold-500 text-nex-gold-500 hover:bg-nex-gold-500 hover:text-nex-dark shrink-0"
              >
                {loading
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend Email'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

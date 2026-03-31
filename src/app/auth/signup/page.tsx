'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLoading } from '@/components/auth/auth-loading';

/**
 * Signup page - Self-service account creation
 *
 * PRPaaS self-service flow:
 * 1. Sign up here (email/password or Google)
 * 2. Verify email
 * 3. First login → onboarding wizard (org creation + professional profile)
 * 4. Time-to-first-value under 15 min
 */
export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to nucleus if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace('/nucleus');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <AuthLoading />;
  }

  return <AuthForm mode="signup" />;
}

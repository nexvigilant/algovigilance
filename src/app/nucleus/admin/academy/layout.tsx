'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import { useAuth } from '@/hooks/use-auth';
import { ShieldAlert } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Admin Academy Layout
 *
 * Protects all admin academy routes (/nucleus/admin/academy/*)
 * Requires user to be authenticated AND have admin role.
 *
 * Security:
 * - Redirects unauthenticated users to signin
 * - Shows unauthorized page for non-admin users
 * - Client-side protection (server-side checks also required in actions)
 */
export default function AdminAcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  const loading = authLoading || roleLoading;

  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/nucleus/admin/academy');
    }
  }, [user, authLoading, router]);

  // Show loading state
  if (loading) {
    return (
      <VoiceLoading context="admin" variant="fullpage" message="Verifying permissions..." />
    );
  }

  // User not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // User authenticated but not admin - show unauthorized page
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                You do not have permission to access the Academy Admin dashboard.
                This area is restricted to administrators only.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                If you believe you should have access, please contact your administrator.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/nucleus">
                    Return to Nucleus
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/nucleus/academy">
                    Go to Academy
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // User is admin - render admin content
  return <>{children}</>;
}

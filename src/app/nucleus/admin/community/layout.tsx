'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { VoiceLoading } from '@/components/voice';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AdminCommunityBreadcrumbs } from './components/admin-community-breadcrumbs';
import Link from 'next/link';

/**
 * Admin Community Layout
 *
 * Protects all admin community routes (/nucleus/admin/community/*)
 * Requires user to be authenticated AND have admin role.
 */
export default function AdminCommunityLayout({
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
      router.push('/auth/signin?redirect=/nucleus/admin/community');
    }
  }, [user, authLoading, router]);

  // Show loading state while verifying permissions
  if (loading) {
    return (
      <VoiceLoading context="admin" variant="fullpage" message="Verifying admin credentials..." />
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
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-lg font-semibold text-red-200">Access Denied</AlertTitle>
            <AlertDescription className="mt-2 text-red-100/80">
              <p className="mb-4">
                You do not have permission to access the Community Admin dashboard.
                This area is restricted to administrators only.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline" size="sm" className="border-red-500/30 hover:bg-red-500/20">
                  <Link href="/nucleus">Return to Nucleus</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="bg-red-600 hover:bg-red-700">
                  <Link href="/nucleus/community">Go to Community</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // User is admin - render admin content
  return (
    <div className="min-h-screen bg-nex-dark">
      <div className="border-b border-nex-light bg-nex-surface/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gold/20 text-gold font-bold">A</div>
          <h1 className="text-xl font-bold font-headline text-white uppercase tracking-wider">Community Admin</h1>
        </div>
      </div>
      <main className="p-6">
        <AdminCommunityBreadcrumbs />
        {children}
      </main>
    </div>
  );
}
import { requireAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { AdminLayoutClient } from './components/admin-layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    // Silent redirect — no error page revealing admin exists
    redirect('/nucleus');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

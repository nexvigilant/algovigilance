import { createMetadata } from '@/lib/metadata';
import { AffiliateApplicationsClient } from './affiliate-applications-client';

export const metadata = createMetadata({
  title: 'Affiliate Applications',
  description: 'View and manage Ambassador & Advisor program applications',
  path: '/nucleus/admin/affiliate-applications',
});

export default function AffiliateApplicationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-nex-surface/95 backdrop-blur supports-[backdrop-filter]:bg-nex-surface/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <h1 className="text-lg font-semibold text-gold">Affiliate Applications</h1>
        </div>
      </div>
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <AffiliateApplicationsClient />
      </main>
    </div>
  );
}

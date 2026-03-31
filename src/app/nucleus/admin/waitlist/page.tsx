import { createMetadata } from '@/lib/metadata';
import { WaitlistClient } from './waitlist-client';

export const metadata = createMetadata({
  title: 'Waitlist',
  description: 'View and manage founding member waitlist entries',
  path: '/nucleus/admin/waitlist',
});

export default function WaitlistPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-nex-surface/95 backdrop-blur supports-[backdrop-filter]:bg-nex-surface/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <h1 className="text-lg font-semibold text-gold">Founding Member Waitlist</h1>
        </div>
      </div>
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <WaitlistClient />
      </main>
    </div>
  );
}

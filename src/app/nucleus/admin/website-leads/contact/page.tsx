import { createMetadata } from '@/lib/metadata';
import { Mail } from 'lucide-react';
import { ContactSubmissionsClient } from './contact-submissions-client';

export const metadata = createMetadata({
  title: 'Contact Submissions',
  description: 'View and manage contact form submissions',
  path: '/nucleus/admin/website-leads/contact',
});

export default function ContactSubmissionsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-nex-light bg-nex-surface/95 backdrop-blur supports-[backdrop-filter]:bg-nex-surface/60 px-4 lg:px-6 py-golden-3">
        <div className="flex items-center gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-gold/50">AlgoVigilance Admin</p>
            <h1 className="text-sm font-semibold text-white">Contact Submissions</h1>
          </div>
        </div>
      </div>
      <main className="flex-1 space-y-golden-2 p-4 pt-golden-3 md:p-8">
        <ContactSubmissionsClient />
      </main>
    </div>
  );
}

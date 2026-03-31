import { createMetadata } from '@/lib/metadata';
import { ContentFreshnessDashboard } from './content-freshness-dashboard';

export const metadata = createMetadata({
  title: 'Content Freshness',
  description: 'Monitor Intelligence content freshness and prioritize updates',
  path: '/nucleus/admin/content-freshness',
});

export default function ContentFreshnessPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl text-white mb-2">
            Content Freshness Report
          </h1>
          <p className="text-slate-dim">
            Monitor content age, validation status, and prioritize which articles need attention first.
          </p>
        </div>

        <ContentFreshnessDashboard />
      </div>
    </div>
  );
}

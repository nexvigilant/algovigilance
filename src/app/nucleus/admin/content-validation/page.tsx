import { createMetadata } from '@/lib/metadata';
import { ContentValidationDashboard } from './content-validation-dashboard';

export const metadata = createMetadata({
  title: 'Content Validation',
  description: 'Monitor research content fact-checking and validation status',
  path: '/nucleus/admin/content-validation',
});

export default function ContentValidationPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl text-white mb-2">
            Content Validation
          </h1>
          <p className="text-slate-dim">
            Monitor research content for factual accuracy, outdated information, and regulatory updates.
            Powered by Perplexity Sonar for real-time fact-checking.
          </p>
        </div>

        <ContentValidationDashboard />
      </div>
    </div>
  );
}

import { createMetadata } from '@/lib/metadata';
import { ContentPipelineClient } from './pipeline-client';

export const metadata = createMetadata({
  title: 'Content Pipeline',
  description: 'AI-powered content generation pipeline for automated course creation',
  path: '/nucleus/admin/academy/content-pipeline',
});

export default function ContentPipelinePage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 md:px-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-gold mb-2">
          AI Content Pipeline
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Automate content generation at scale. Select domains and KSBs, configure the AI engine,
          and let Claude create comprehensive learning content automatically.
        </p>
      </header>

      {/* Pipeline Dashboard */}
      <ContentPipelineClient />
    </div>
  );
}

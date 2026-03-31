'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/navigation';
import { VoiceLoading } from '@/components/voice';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { IntelligenceForm } from '../components/intelligence-form';
import { getIntelligenceById } from '@/lib/actions/intelligence';
import type { IntelligenceDocument } from '@/types/intelligence';

export default function EditIntelligencePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [content, setContent] = useState<IntelligenceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      const result = await getIntelligenceById(id);

      if (result.success && result.content) {
        setContent(result.content);
      } else {
        setError(result.error || 'Content not found');
      }

      setLoading(false);
    }

    loadContent();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <VoiceLoading
          context="admin"
          variant="spinner"
          message="Loading content..."
        />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/nucleus/admin' },
            { label: 'Intelligence', href: '/nucleus/admin/intelligence' },
            { label: 'Error' },
          ]}
          className="mb-8"
        />

        <Alert variant="destructive" className="max-w-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Content not found'}</AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={() => router.push('/nucleus/admin/intelligence')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Intelligence
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/nucleus/admin' },
          { label: 'Intelligence', href: '/nucleus/admin/intelligence' },
          { label: content.title.substring(0, 30) + (content.title.length > 30 ? '...' : '') },
        ]}
        className="mb-8"
      />

      <div className="mb-6">
        <h1 className="text-3xl font-headline text-gold">Edit Content</h1>
        <p className="text-slate-dim mt-1">
          Update &quot;{content.title}&quot;
        </p>
      </div>

      <IntelligenceForm mode="edit" initialData={content} />
    </div>
  );
}

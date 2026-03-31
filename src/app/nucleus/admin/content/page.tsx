'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Image as ImageIcon, Check, AlertCircle, Loader2 } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  slug: string;
  title: string;
  type: string;
  image: string | null;
  imageAlt: string | null;
  publishedAt: string;
}

type ImageStyle = 'professional' | 'abstract' | 'conceptual' | 'editorial';

export default function ContentAdminPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('professional');
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchContent() {
    try {
      const response = await fetch('/api/admin/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      setContent(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function regenerateImage(slug: string) {
    setRegenerating(slug);
    try {
      const response = await fetch('/api/admin/content/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, style: selectedStyle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate image');
      }

      const result = await response.json();

      // Update local state
      setContent(prev => prev.map(item =>
        item.slug === slug
          ? { ...item, image: result.imagePath, imageAlt: result.alt }
          : item
      ));

      toast({
        title: 'Image Regenerated',
        description: `New image generated for "${result.title}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to regenerate image',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(null);
    }
  }

  const contentWithImages = content.filter(c => c.image);
  const contentWithoutImages = content.filter(c => !c.image);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline text-white">Content Management</h1>
          <p className="text-slate-dim mt-2">Manage Intelligence hub content and images</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as ImageStyle)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
              <SelectItem value="conceptual">Conceptual</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchContent} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{content.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{contentWithImages.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">Missing Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{contentWithoutImages.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Images Section */}
      {contentWithoutImages.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Missing Images ({contentWithoutImages.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contentWithoutImages.map((item) => (
              <Card key={item.slug} className="bg-nex-surface border-nex-light border-amber-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{item.type}</Badge>
                  </div>
                  <CardTitle className="text-lg text-white line-clamp-2">{item.title}</CardTitle>
                  <CardDescription>{item.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-nex-dark rounded-lg flex items-center justify-center mb-4">
                    <ImageIcon className="h-12 w-12 text-slate-dim/50" />
                  </div>
                  <Button
                    onClick={() => regenerateImage(item.slug)}
                    disabled={regenerating === item.slug}
                    className="w-full"
                  >
                    {regenerating === item.slug ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Content with Images */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-400" />
          Articles with Images ({contentWithImages.length})
        </h2>

        {loading ? (
          <VoiceLoading context="admin" variant="spinner" message="Loading content..." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contentWithImages.map((item) => (
              <Card key={item.slug} className="bg-nex-surface border-nex-light">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{item.type}</Badge>
                  </div>
                  <CardTitle className="text-lg text-white line-clamp-2">{item.title}</CardTitle>
                  <CardDescription>{item.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video bg-nex-dark rounded-lg overflow-hidden mb-4">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.imageAlt || item.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <Button
                    onClick={() => regenerateImage(item.slug)}
                    disabled={regenerating === item.slug}
                    variant="outline"
                    className="w-full"
                  >
                    {regenerating === item.slug ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eye,
  ArrowLeft,
  Loader2,
  Sparkles,
  X,
  Plus,
  FileUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import type {
  ContentType,
  ContentStatus,
  IntelligenceFormData,
  IntelligenceDocument,
} from '@/types/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';
import {
  createIntelligence,
  updateIntelligence,
  generateSlug,
} from '@/lib/actions/intelligence';
import {
  DocumentImportModal,
  type ExtractionData,
} from '@/components/intelligence/document-import-modal';
import { ExtractionPreviewModal } from '@/components/intelligence/extraction-preview-modal';
import { toDateFromSerialized } from '@/types/academy';

interface IntelligenceFormProps {
  mode: 'create' | 'edit';
  initialData?: IntelligenceDocument;
}

const DEFAULT_FORM_DATA: IntelligenceFormData = {
  slug: '',
  title: '',
  description: '',
  type: 'perspective',
  status: 'draft',
  author: 'AlgoVigilance Intelligence',
  tags: [],
  featured: false,
  body: '',
};

export function IntelligenceForm({ mode, initialData }: IntelligenceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<IntelligenceFormData>(() => {
    if (initialData) {
      return {
        slug: initialData.slug,
        title: initialData.title,
        description: initialData.description,
        type: initialData.type,
        status: initialData.status,
        publishedAt: toDateFromSerialized(initialData.publishedAt)?.toISOString().split('T')[0],
        author: initialData.author,
        image: initialData.image,
        imageAlt: initialData.imageAlt,
        tags: initialData.tags,
        readingTime: initialData.readingTime,
        featured: initialData.featured,
        series: initialData.series,
        seriesOrder: initialData.seriesOrder,
        relatedSlugs: initialData.relatedSlugs,
        body: initialData.body,
        // Type-specific
        audioUrl: initialData.audioUrl,
        duration: initialData.duration,
        episodeNumber: initialData.episodeNumber,
        seasonNumber: initialData.seasonNumber,
        spotifyEpisodeId: initialData.spotifyEpisodeId,
        spotifyUrl: initialData.spotifyUrl,
        applePodcastsUrl: initialData.applePodcastsUrl,
        youtubeUrl: initialData.youtubeUrl,
        guests: initialData.guests,
        hasTranscript: initialData.hasTranscript,
        pdfUrl: initialData.pdfUrl,
        pageCount: initialData.pageCount,
        publicationType: initialData.publicationType,
        executiveSummary: initialData.executiveSummary,
        citation: initialData.citation,
        doi: initialData.doi,
        pullQuote: initialData.pullQuote,
        isOpinion: initialData.isOpinion,
        originalPlatform: initialData.originalPlatform,
        originalUrl: initialData.originalUrl,
        signalStrength: initialData.signalStrength,
        validationStatus: initialData.validationStatus,
        impactAreas: initialData.impactAreas,
        signalSource: initialData.signalSource,
        platform: initialData.platform,
        keyDataPoint: initialData.keyDataPoint,
        detectedAt: toDateFromSerialized(initialData.detectedAt)?.toISOString().split('T')[0],
      };
    }
    return DEFAULT_FORM_DATA;
  });

  const [saving, setSaving] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Document import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionData | null>(null);

  const updateField = useCallback(<K extends keyof IntelligenceFormData>(
    field: K,
    value: IntelligenceFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateSlug = async () => {
    if (!formData.title) {
      toast({
        title: 'Error',
        description: 'Please enter a title first',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingSlug(true);
    const result = await generateSlug(formData.title);

    if (result.success && result.slug) {
      updateField('slug', result.slug);
      toast({ title: 'Success', description: 'Slug generated' });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to generate slug',
        variant: 'destructive',
      });
    }

    setGeneratingSlug(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slug || !formData.title || !formData.type) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields: slug, title, type',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    if (mode !== 'create' && !initialData?.id) {
      toast({ title: 'Error', description: 'Missing content ID for update', variant: 'destructive' });
      setSaving(false);
      return;
    }
    const result = mode === 'create'
      ? await createIntelligence(formData)
      : await updateIntelligence(initialData?.id ?? '', formData);

    if (result.success) {
      toast({
        title: 'Success',
        description: mode === 'create' ? 'Content created' : 'Content updated',
      });
      router.push('/nucleus/admin/intelligence');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save content',
        variant: 'destructive',
      });
    }

    setSaving(false);
  };

  // Handle document extraction completion
  const handleExtracted = (data: ExtractionData) => {
    setExtractedData(data);
    setPreviewModalOpen(true);
  };

  // Apply selected fields from extraction
  const handleApplyExtraction = (selectedFields: Partial<ExtractionData>) => {
    if (selectedFields.title) updateField('title', selectedFields.title);
    if (selectedFields.description) updateField('description', selectedFields.description);
    if (selectedFields.type) updateField('type', selectedFields.type);
    if (selectedFields.tags) updateField('tags', selectedFields.tags);
    if (selectedFields.body) updateField('body', selectedFields.body);
    if (selectedFields.author) updateField('author', selectedFields.author);

    toast({
      title: 'Content Applied',
      description: 'Extracted content has been added to the form',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/nucleus/admin/intelligence')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="border-cyan/30 text-cyan hover:bg-cyan/10"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/intelligence/${formData.slug}`, '_blank')}
              className="border-nex-light"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan text-nex-deep hover:bg-cyan-glow"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-dim">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter title..."
                  className="bg-nex-dark border-nex-light mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-slate-dim">Slug *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    placeholder="url-friendly-slug"
                    className="bg-nex-dark border-nex-light flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSlug}
                    disabled={generatingSlug}
                    className="border-nex-light"
                  >
                    {generatingSlug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-dim">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description for SEO and previews..."
                  className="bg-nex-dark border-nex-light mt-1 h-20"
                  maxLength={160}
                />
                <p className="text-xs text-slate-dim mt-1">
                  {formData.description.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Body Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Content Body</CardTitle>
              <CardDescription>Write your content in Markdown format</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.body}
                onChange={(e) => updateField('body', e.target.value)}
                placeholder="Write your content here using Markdown..."
                className="bg-nex-dark border-nex-light min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Type-Specific Fields */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">
                {CONTENT_TYPE_CONFIG[formData.type]?.label || 'Type'} Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TypeSpecificFields
                type={formData.type}
                formData={formData}
                updateField={updateField}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-dim">Content Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => updateField('type', v as ContentType)}
                >
                  <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-dim">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField('status', v as ContentStatus)}
                >
                  <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publishedAt" className="text-slate-dim">Publish Date</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt || ''}
                  onChange={(e) => updateField('publishedAt', e.target.value)}
                  className="bg-nex-dark border-nex-light mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="text-slate-dim">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(v) => updateField('featured', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Author & Meta Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Author & Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author" className="text-slate-dim">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  placeholder="Author name"
                  className="bg-nex-dark border-nex-light mt-1"
                />
              </div>

              <div>
                <Label htmlFor="readingTime" className="text-slate-dim">Reading Time (min)</Label>
                <Input
                  id="readingTime"
                  type="number"
                  value={formData.readingTime || ''}
                  onChange={(e) => updateField('readingTime', parseInt(e.target.value) || undefined)}
                  placeholder="5"
                  className="bg-nex-dark border-nex-light mt-1"
                  min={1}
                />
              </div>

              <div>
                <Label className="text-slate-dim">Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="bg-nex-dark border-nex-light flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    className="border-nex-light"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-nex-dark"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image" className="text-slate-dim">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image || ''}
                  onChange={(e) => updateField('image', e.target.value)}
                  placeholder="/images/intelligence/..."
                  className="bg-nex-dark border-nex-light mt-1"
                />
              </div>

              <div>
                <Label htmlFor="imageAlt" className="text-slate-dim">Alt Text</Label>
                <Input
                  id="imageAlt"
                  value={formData.imageAlt || ''}
                  onChange={(e) => updateField('imageAlt', e.target.value)}
                  placeholder="Describe the image..."
                  className="bg-nex-dark border-nex-light mt-1"
                />
              </div>

              {formData.image && (
                <div className="relative aspect-video bg-nex-dark rounded-lg overflow-hidden">
                  <img
                    src={formData.image}
                    alt={formData.imageAlt || 'Preview'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Series Card */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Series</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="series" className="text-slate-dim">Series Slug</Label>
                <Input
                  id="series"
                  value={formData.series || ''}
                  onChange={(e) => updateField('series', e.target.value)}
                  placeholder="series-name"
                  className="bg-nex-dark border-nex-light mt-1"
                />
              </div>

              <div>
                <Label htmlFor="seriesOrder" className="text-slate-dim">Order in Series</Label>
                <Input
                  id="seriesOrder"
                  type="number"
                  value={formData.seriesOrder || ''}
                  onChange={(e) => updateField('seriesOrder', parseInt(e.target.value) || undefined)}
                  placeholder="1"
                  className="bg-nex-dark border-nex-light mt-1"
                  min={1}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Import Modals */}
      <DocumentImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onExtracted={handleExtracted}
      />

      <ExtractionPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        extractedData={extractedData}
        currentFormData={{
          title: formData.title,
          description: formData.description,
          type: formData.type,
          tags: formData.tags,
          body: formData.body,
          author: formData.author,
        }}
        onApply={handleApplyExtraction}
      />
    </form>
  );
}

// Type-specific form fields component
function TypeSpecificFields({
  type,
  formData,
  updateField,
}: {
  type: ContentType;
  formData: IntelligenceFormData;
  updateField: <K extends keyof IntelligenceFormData>(
    field: K,
    value: IntelligenceFormData[K]
  ) => void;
}) {
  switch (type) {
    case 'podcast':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-dim">Episode Number</Label>
              <Input
                type="number"
                value={formData.episodeNumber || ''}
                onChange={(e) => updateField('episodeNumber', parseInt(e.target.value) || undefined)}
                className="bg-nex-dark border-nex-light mt-1"
                min={1}
              />
            </div>
            <div>
              <Label className="text-slate-dim">Season Number</Label>
              <Input
                type="number"
                value={formData.seasonNumber || ''}
                onChange={(e) => updateField('seasonNumber', parseInt(e.target.value) || undefined)}
                className="bg-nex-dark border-nex-light mt-1"
                min={1}
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-dim">Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.duration || ''}
              onChange={(e) => updateField('duration', parseInt(e.target.value) || undefined)}
              className="bg-nex-dark border-nex-light mt-1"
              min={1}
            />
          </div>
          <div>
            <Label className="text-slate-dim">Spotify Episode ID</Label>
            <Input
              value={formData.spotifyEpisodeId || ''}
              onChange={(e) => updateField('spotifyEpisodeId', e.target.value)}
              placeholder="4rOoJ6Egrf8K2IrywzwOMk"
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Spotify URL</Label>
            <Input
              value={formData.spotifyUrl || ''}
              onChange={(e) => updateField('spotifyUrl', e.target.value)}
              placeholder="https://open.spotify.com/episode/..."
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Apple Podcasts URL</Label>
            <Input
              value={formData.applePodcastsUrl || ''}
              onChange={(e) => updateField('applePodcastsUrl', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">YouTube URL</Label>
            <Input
              value={formData.youtubeUrl || ''}
              onChange={(e) => updateField('youtubeUrl', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Audio URL (fallback)</Label>
            <Input
              value={formData.audioUrl || ''}
              onChange={(e) => updateField('audioUrl', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-slate-dim">Has Transcript</Label>
            <Switch
              checked={formData.hasTranscript || false}
              onCheckedChange={(v) => updateField('hasTranscript', v)}
            />
          </div>
        </div>
      );

    case 'publication':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-slate-dim">Publication Type</Label>
            <Select
              value={formData.publicationType || ''}
              onValueChange={(v) => updateField('publicationType', v as 'whitepaper' | 'research' | 'report' | 'guide')}
            >
              <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whitepaper">Whitepaper</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-dim">PDF URL</Label>
            <Input
              value={formData.pdfUrl || ''}
              onChange={(e) => updateField('pdfUrl', e.target.value)}
              placeholder="https://..."
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Page Count</Label>
            <Input
              type="number"
              value={formData.pageCount || ''}
              onChange={(e) => updateField('pageCount', parseInt(e.target.value) || undefined)}
              className="bg-nex-dark border-nex-light mt-1"
              min={1}
            />
          </div>
          <div>
            <Label className="text-slate-dim">Executive Summary</Label>
            <Textarea
              value={formData.executiveSummary || ''}
              onChange={(e) => updateField('executiveSummary', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1 h-24"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Citation</Label>
            <Input
              value={formData.citation || ''}
              onChange={(e) => updateField('citation', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">DOI</Label>
            <Input
              value={formData.doi || ''}
              onChange={(e) => updateField('doi', e.target.value)}
              placeholder="10.1000/xyz123"
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
        </div>
      );

    case 'perspective':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-slate-dim">Pull Quote</Label>
            <Textarea
              value={formData.pullQuote || ''}
              onChange={(e) => updateField('pullQuote', e.target.value)}
              placeholder="A memorable quote from the article..."
              className="bg-nex-dark border-nex-light mt-1 h-24"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-slate-dim">Opinion/Editorial</Label>
            <Switch
              checked={formData.isOpinion || false}
              onCheckedChange={(v) => updateField('isOpinion', v)}
            />
          </div>
        </div>
      );

    case 'field-note':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-slate-dim">Original Platform</Label>
            <Select
              value={formData.originalPlatform || ''}
              onValueChange={(v) => updateField('originalPlatform', v as 'linkedin' | 'newsletter' | 'medium')}
            >
              <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-dim">Original URL</Label>
            <Input
              value={formData.originalUrl || ''}
              onChange={(e) => updateField('originalUrl', e.target.value)}
              placeholder="https://..."
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
        </div>
      );

    case 'signal':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-dim">Signal Strength</Label>
              <Select
                value={formData.signalStrength || ''}
                onValueChange={(v) => updateField('signalStrength', v as 'emerging' | 'developing' | 'confirmed')}
              >
                <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emerging">Emerging</SelectItem>
                  <SelectItem value="developing">Developing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-dim">Validation Status</Label>
              <Select
                value={formData.validationStatus || ''}
                onValueChange={(v) => updateField('validationStatus', v as 'detected' | 'under_review' | 'validated')}
              >
                <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detected">Detected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-dim">Signal Source</Label>
            <Select
              value={formData.signalSource || ''}
              onValueChange={(v) => updateField('signalSource', v as 'regulatory' | 'industry' | 'research' | 'market' | 'technology')}
            >
              <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-dim">Key Data Point</Label>
            <Input
              value={formData.keyDataPoint || ''}
              onChange={(e) => updateField('keyDataPoint', e.target.value)}
              placeholder="The key metric or data driving this signal..."
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Detection Date</Label>
            <Input
              type="date"
              value={formData.detectedAt || ''}
              onChange={(e) => updateField('detectedAt', e.target.value)}
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-dim">Platform (if cross-posted)</Label>
            <Select
              value={formData.platform || ''}
              onValueChange={(v) => updateField('platform', v as 'linkedin' | 'twitter' | 'threads')}
            >
              <SelectTrigger className="bg-nex-dark border-nex-light mt-1">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-dim">Original URL</Label>
            <Input
              value={formData.originalUrl || ''}
              onChange={(e) => updateField('originalUrl', e.target.value)}
              placeholder="https://..."
              className="bg-nex-dark border-nex-light mt-1"
            />
          </div>
        </div>
      );

    default:
      return (
        <p className="text-slate-dim text-sm">
          No additional settings for this content type.
        </p>
      );
  }
}

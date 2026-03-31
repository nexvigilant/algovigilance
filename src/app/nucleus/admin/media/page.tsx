'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  BookOpen,
  Sparkles,
  Play,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import { MediaCard } from './components/media-card';

import { logger } from '@/lib/logger';
const log = logger.scope('media/page');

// Intelligence Content Types
interface IntelligenceItem {
  slug: string;
  title: string;
  type: string;
  image: string | null;
  imageAlt: string | null;
  publishedAt: string;
}

// Academy Course Types
interface CourseItem {
  id: string;
  title: string;
  topic: string;
  status: string;
  thumbnailUrl: string | null;
}

type ImageStyle = 'professional' | 'abstract' | 'conceptual' | 'editorial';

interface BulkProgress {
  current: number;
  total: number;
  currentItem: string;
  succeeded: number;
  failed: number;
}

export default function MediaManagementPage() {
  const [intelligenceContent, setIntelligenceContent] = useState<IntelligenceItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingIntelligence, setLoadingIntelligence] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('professional');
  const [bulkGenerating, setBulkGenerating] = useState<'intelligence' | 'academy' | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);
  const [runningCronJob, setRunningCronJob] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntelligenceContent();
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchIntelligenceContent() {
    try {
      const response = await fetch('/api/admin/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      setIntelligenceContent(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load Intelligence content.',
        variant: 'destructive',
      });
    } finally {
      setLoadingIntelligence(false);
    }
  }

  async function fetchCourses() {
    try {
      const response = await fetch('/api/admin/academy/generate-thumbnails-bulk');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const _data = await response.json();

      // Fetch full course data
      const { getAllCoursesAdmin } = await import('@/app/nucleus/admin/academy/admin-actions');
      const coursesData = await getAllCoursesAdmin();

      setCourses(
        coursesData.map((c) => ({
          id: c.id,
          title: c.title,
          topic: c.topic,
          status: c.status,
          thumbnailUrl: c.metadata?.thumbnailUrl || null,
        }))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load Academy courses.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }

  async function regenerateIntelligenceImage(slug: string) {
    setRegenerating(`intelligence-${slug}`);
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
      setIntelligenceContent((prev) =>
        prev.map((item) =>
          item.slug === slug ? { ...item, image: result.imagePath, imageAlt: result.alt } : item
        )
      );

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

  async function regenerateCourseThumbnail(courseId: string) {
    setRegenerating(`course-${courseId}`);
    try {
      const response = await fetch('/api/admin/academy/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, style: selectedStyle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate thumbnail');
      }

      const result = await response.json();
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, thumbnailUrl: result.thumbnailUrl } : c))
      );

      toast({
        title: 'Thumbnail Generated',
        description: `New thumbnail generated for "${result.title}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate thumbnail',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(null);
    }
  }

  async function bulkGenerateIntelligence() {
    const missing = intelligenceContent.filter((c) => !c.image);
    if (missing.length === 0) {
      toast({ title: 'All Done', description: 'All Intelligence articles have images!' });
      return;
    }

    setBulkGenerating('intelligence');
    setBulkProgress({ current: 0, total: missing.length, currentItem: '', succeeded: 0, failed: 0 });

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      setBulkProgress({
        current: i + 1,
        total: missing.length,
        currentItem: item.title,
        succeeded,
        failed,
      });

      try {
        const response = await fetch('/api/admin/content/regenerate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: item.slug, style: selectedStyle }),
        });

        if (response.ok) {
          succeeded++;
          // Update the UI immediately with the new image
          const result = await response.json();
          setIntelligenceContent((prev) =>
            prev.map((c) =>
              c.slug === item.slug ? { ...c, image: result.imagePath, imageAlt: result.alt } : c
            )
          );
        } else {
          log.error(`[media] Failed to generate image for "${item.slug}": API returned error`);
          failed++;
        }
      } catch (error) {
        log.error(`[media] Failed to generate image for "${item.slug}":`, error);
        failed++;
      }

      // Update progress after each item
      setBulkProgress({
        current: i + 1,
        total: missing.length,
        currentItem: item.title,
        succeeded,
        failed,
      });
    }

    setBulkGenerating(null);
    setBulkProgress(null);
    toast({
      title: 'Bulk Generation Complete',
      description: `Generated ${succeeded} images, ${failed} failed`,
    });
  }

  async function bulkGenerateAcademy() {
    const missing = courses.filter((c) => !c.thumbnailUrl);
    if (missing.length === 0) {
      toast({ title: 'All Done', description: 'All courses have thumbnails!' });
      return;
    }

    setBulkGenerating('academy');
    setBulkProgress({ current: 0, total: missing.length, currentItem: '', succeeded: 0, failed: 0 });

    let succeeded = 0;
    let failed = 0;

    // Generate thumbnails one by one for real-time progress
    for (let i = 0; i < missing.length; i++) {
      const course = missing[i];
      setBulkProgress({
        current: i + 1,
        total: missing.length,
        currentItem: course.title,
        succeeded,
        failed,
      });

      try {
        const response = await fetch('/api/admin/academy/generate-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id, style: selectedStyle }),
        });

        if (response.ok) {
          succeeded++;
          const result = await response.json();
          // Update the UI immediately with the new thumbnail
          setCourses((prev) =>
            prev.map((c) => (c.id === course.id ? { ...c, thumbnailUrl: result.thumbnailUrl } : c))
          );
        } else {
          log.error(`[media] Failed to generate thumbnail for course "${course.id}": API returned error`);
          failed++;
        }
      } catch (error) {
        log.error(`[media] Failed to generate thumbnail for course "${course.id}":`, error);
        failed++;
      }

      // Update progress after each item
      setBulkProgress({
        current: i + 1,
        total: missing.length,
        currentItem: course.title,
        succeeded,
        failed,
      });
    }

    setBulkGenerating(null);
    setBulkProgress(null);
    toast({
      title: 'Bulk Generation Complete',
      description: `Generated ${succeeded} thumbnails, ${failed} failed`,
    });
  }

  async function triggerCronJob() {
    setRunningCronJob(true);
    try {
      const response = await fetch('/api/cron/generate-missing-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to run cron job');
      }

      const result = await response.json();

      // Refresh data
      await Promise.all([fetchIntelligenceContent(), fetchCourses()]);

      toast({
        title: 'Overnight Job Complete',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run cron job',
        variant: 'destructive',
      });
    } finally {
      setRunningCronJob(false);
    }
  }

  const intelligenceWithImages = intelligenceContent.filter((c) => c.image);
  const intelligenceWithoutImages = intelligenceContent.filter((c) => !c.image);
  const coursesWithThumbnails = courses.filter((c) => c.thumbnailUrl);
  const coursesWithoutThumbnails = courses.filter((c) => !c.thumbnailUrl);

  const totalAssets = intelligenceContent.length + courses.length;
  const totalWithImages = intelligenceWithImages.length + coursesWithThumbnails.length;
  const totalMissing = intelligenceWithoutImages.length + coursesWithoutThumbnails.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline text-white">Media Management</h1>
          <p className="text-slate-dim mt-2">
            Unified management for all platform images and thumbnails
          </p>
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

          <Button
            onClick={triggerCronJob}
            disabled={runningCronJob || totalMissing === 0}
            variant="default"
            size="sm"
            className="bg-cyan hover:bg-cyan/90"
            title="Run the overnight image generation job now"
          >
            {runningCronJob ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Overnight Job
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              fetchIntelligenceContent();
              fetchCourses();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAssets}</div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{totalWithImages}</div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">Missing Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{totalMissing}</div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan">
              {totalAssets > 0 ? Math.round((totalWithImages / totalAssets) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Generation Progress */}
      {bulkProgress && (
        <Card className="bg-nex-surface border-cyan/50 mb-8 animate-pulse">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan" />
              Generating Images ({bulkGenerating === 'intelligence' ? 'Intelligence' : 'Academy'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-dim">
                Processing {bulkProgress.current} of {bulkProgress.total}
              </span>
              <span className="text-white font-medium">
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
              </span>
            </div>
            <Progress
              value={(bulkProgress.current / bulkProgress.total) * 100}
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-dim truncate max-w-md" title={bulkProgress.currentItem}>
                Current: {bulkProgress.currentItem}
              </span>
              <div className="flex gap-4">
                <span className="text-green-400">{bulkProgress.succeeded} succeeded</span>
                {bulkProgress.failed > 0 && (
                  <span className="text-red-400">{bulkProgress.failed} failed</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-nex-surface border border-nex-light">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan/20">
            All ({totalAssets})
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="data-[state=active]:bg-cyan/20">
            <FileText className="h-4 w-4 mr-2" />
            Intelligence ({intelligenceContent.length})
          </TabsTrigger>
          <TabsTrigger value="academy" className="data-[state=active]:bg-cyan/20">
            <BookOpen className="h-4 w-4 mr-2" />
            Academy ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="missing" className="data-[state=active]:bg-amber-500/20">
            <AlertCircle className="h-4 w-4 mr-2" />
            Missing ({totalMissing})
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Intelligence Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan" />
                Intelligence Hub ({intelligenceContent.length})
              </h2>
              {intelligenceWithoutImages.length > 0 && (
                <Button
                  onClick={bulkGenerateIntelligence}
                  disabled={bulkGenerating === 'intelligence'}
                  size="sm"
                >
                  {bulkGenerating === 'intelligence' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate All Missing ({intelligenceWithoutImages.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            {loadingIntelligence ? (
              <VoiceLoading context="admin" variant="spinner" message="Loading Intelligence content..." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {intelligenceContent.slice(0, 8).map((item) => (
                  <MediaCard
                    key={item.slug}
                    id={item.slug}
                    title={item.title}
                    type={item.type}
                    image={item.image}
                    imageAlt={item.imageAlt}
                    isRegenerating={regenerating === `intelligence-${item.slug}`}
                    onRegenerate={() => regenerateIntelligenceImage(item.slug)}
                  />
                ))}
              </div>
            )}
            {intelligenceContent.length > 8 && (
              <div className="mt-4 text-center">
                <Link href="/nucleus/admin/content">
                  <Button variant="outline">View All Intelligence Content</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Academy Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan" />
                Academy Courses ({courses.length})
              </h2>
              {coursesWithoutThumbnails.length > 0 && (
                <Button
                  onClick={bulkGenerateAcademy}
                  disabled={bulkGenerating === 'academy'}
                  size="sm"
                >
                  {bulkGenerating === 'academy' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate All Missing ({coursesWithoutThumbnails.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            {loadingCourses ? (
              <VoiceLoading context="admin" variant="spinner" message="Loading Academy courses..." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {courses.slice(0, 8).map((course) => (
                  <MediaCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    type={course.topic}
                    image={course.thumbnailUrl}
                    isRegenerating={regenerating === `course-${course.id}`}
                    onRegenerate={() => regenerateCourseThumbnail(course.id)}
                  />
                ))}
              </div>
            )}
            {courses.length > 8 && (
              <div className="mt-4 text-center">
                <Link href="/nucleus/admin/academy/courses">
                  <Button variant="outline">View All Academy Courses</Button>
                </Link>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Intelligence Hub Content</h2>
            {intelligenceWithoutImages.length > 0 && (
              <Button
                onClick={bulkGenerateIntelligence}
                disabled={bulkGenerating === 'intelligence'}
              >
                {bulkGenerating === 'intelligence' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate All Missing ({intelligenceWithoutImages.length})
                  </>
                )}
              </Button>
            )}
          </div>
          {loadingIntelligence ? (
            <VoiceLoading context="admin" variant="spinner" message="Loading Intelligence content..." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {intelligenceContent.map((item) => (
                <MediaCard
                  key={item.slug}
                  id={item.slug}
                  title={item.title}
                  type={item.type}
                  image={item.image}
                  imageAlt={item.imageAlt}
                  isRegenerating={regenerating === `intelligence-${item.slug}`}
                  onRegenerate={() => regenerateIntelligenceImage(item.slug)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Academy Tab */}
        <TabsContent value="academy">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Academy Course Thumbnails</h2>
            {coursesWithoutThumbnails.length > 0 && (
              <Button onClick={bulkGenerateAcademy} disabled={bulkGenerating === 'academy'}>
                {bulkGenerating === 'academy' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate All Missing ({coursesWithoutThumbnails.length})
                  </>
                )}
              </Button>
            )}
          </div>
          {loadingCourses ? (
            <VoiceLoading context="admin" variant="spinner" message="Loading Academy courses..." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <MediaCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  type={course.topic}
                  image={course.thumbnailUrl}
                  isRegenerating={regenerating === `course-${course.id}`}
                  onRegenerate={() => regenerateCourseThumbnail(course.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Missing Tab */}
        <TabsContent value="missing">
          <div className="space-y-6">
            {intelligenceWithoutImages.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-400" />
                    Intelligence - Missing Images ({intelligenceWithoutImages.length})
                  </h2>
                  <Button
                    onClick={bulkGenerateIntelligence}
                    disabled={bulkGenerating === 'intelligence'}
                  >
                    {bulkGenerating === 'intelligence' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate All
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {intelligenceWithoutImages.map((item) => (
                    <MediaCard
                      key={item.slug}
                      id={item.slug}
                      title={item.title}
                      type={item.type}
                      image={null}
                      isRegenerating={regenerating === `intelligence-${item.slug}`}
                      onRegenerate={() => regenerateIntelligenceImage(item.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {coursesWithoutThumbnails.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-400" />
                    Academy - Missing Thumbnails ({coursesWithoutThumbnails.length})
                  </h2>
                  <Button onClick={bulkGenerateAcademy} disabled={bulkGenerating === 'academy'}>
                    {bulkGenerating === 'academy' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate All
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {coursesWithoutThumbnails.map((course) => (
                    <MediaCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      type={course.topic}
                      image={null}
                      isRegenerating={regenerating === `course-${course.id}`}
                      onRegenerate={() => regenerateCourseThumbnail(course.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {totalMissing === 0 && (
              <div className="text-center py-12">
                <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Images Present!</h3>
                <p className="text-slate-dim">All content has associated images.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


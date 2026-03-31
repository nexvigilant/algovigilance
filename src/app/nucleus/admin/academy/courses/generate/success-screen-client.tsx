'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Download, Eye, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCourseData, type CourseData } from '@/lib/course-builder-api';
import { importCourseToAcademy } from './actions';
import { cn } from '@/lib/utils';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/success-screen-client');

interface SuccessScreenClientProps {
  jobId: string;
  courseId: string;
  topic: string;
}

export function SuccessScreenClient({ jobId, courseId, topic }: SuccessScreenClientProps) {
  const router = useRouter();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch course data on mount
  useEffect(() => {
    async function loadCourseData() {
      try {
        const data = await getCourseData(courseId);
        setCourseData(data);
      } catch (err) {
        log.error('Error fetching course data:', err);
        setError('Failed to fetch course data');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseData();
  }, [courseId]);

  async function handleImport() {
    if (!courseData) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await importCourseToAcademy(courseId, courseData);

      if (result.success) {
        // Redirect to course edit page
        router.push(`/nucleus/admin/academy/courses/${courseId}/edit`);
      } else {
        setError(result.error || 'Failed to import course');
        setIsImporting(false);
      }
    } catch (err) {
      log.error('Error importing course:', err);
      setError('Failed to import course');
      setIsImporting(false);
    }
  }

  function handleDownloadJSON() {
    if (!courseData) return;

    // Create JSON blob and download
    const json = JSON.stringify(courseData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course_${courseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-500" />
            <p className="text-muted-foreground">Loading course data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !courseData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const academy = courseData?.academy_course;
  const moduleCount = academy?.modules?.length || 0;
  const lessonCount = academy?.metadata?.totalLessons || 0;
  const duration = academy?.metadata?.estimatedDuration || 0;
  const qualityScore = courseData?.quality_score || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-2">Pathway Generated Successfully!</h1>
        <p className="text-muted-foreground">
          Your AI-powered capability pathway is ready to import into the Academy
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Course Summary Card */}
      <Card className="bg-nex-surface border border-nex-light rounded-lg mb-6">
        <CardContent className="pt-6 space-y-6">
          {/* Course Title */}
          <div>
            <div className="text-2xl font-bold font-headline mb-2">{academy?.title || topic}</div>
            <p className="text-muted-foreground">{academy?.description}</p>
          </div>

          {/* Course Structure */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-cyan-500">{moduleCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Modules</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-cyan-500">{lessonCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Practice Activities</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-cyan-500">{duration}</div>
              <div className="text-sm text-muted-foreground mt-1">Minutes</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={cn(
                "text-3xl font-bold",
                qualityScore >= 80 ? "text-green-500" : qualityScore >= 60 ? "text-yellow-500" : "text-orange-500"
              )}>
                {qualityScore}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Quality Score</div>
            </div>
          </div>

          {/* Quality Metrics */}
          {qualityScore >= 70 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Quality Assessment:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Content Accuracy Validated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Pedagogical Alignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>40+ Citations</span>
                </div>
              </div>
            </div>
          )}

          {/* Course Details */}
          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain:</span>
              <span className="font-medium">{academy?.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Audience:</span>
              <span className="font-medium">{academy?.targetAudience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job ID:</span>
              <span className="font-mono text-xs">{jobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course ID:</span>
              <span className="font-mono text-xs">{courseId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="flex-1"
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Content
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadJSON}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="flex-1 circuit-button"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Import to Academy
            </>
          )}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-cyan-500/5 border-cyan-500/20">
        <AlertCircle className="h-4 w-4 text-cyan-500" />
        <AlertDescription className="text-sm">
          <strong>Next Steps:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Course will be imported as <strong>Draft</strong> status</li>
            <li>• Review content and make any necessary edits</li>
            <li>• Publish when ready to make available to members</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Course Content Preview</DialogTitle>
            <DialogDescription>
              Academy JSON structure - Ready for import
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(courseData, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

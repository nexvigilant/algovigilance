'use client';

import { useState } from 'react';
import { Download, FileText, File, FileSpreadsheet, FileArchive, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LessonResource } from '@/types/academy';
import { incrementResourceDownloadCount } from './lesson-resources-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('components/lesson-resources');

interface LessonResourcesProps {
  resources: LessonResource[];
  lessonId: string;
  courseId: string;
}

export function LessonResources({ resources, lessonId, courseId }: LessonResourcesProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  // Track download counts in local state for immediate UI feedback
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>(
    resources.reduce((acc, r) => ({ ...acc, [r.id]: r.downloadCount || 0 }), {})
  );

  if (!resources || resources.length === 0) {
    return null;
  }

  function getFileIcon(fileType: string) {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'pptx':
        return <File className="h-5 w-5 text-orange-500" />;
      case 'zip':
        return <FileArchive className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function handleDownload(resource: LessonResource) {
    setDownloading(resource.id);

    try {
      // Open in new tab to download
      window.open(resource.fileUrl, '_blank');

      // Increment download count in Firestore
      const newCount = await incrementResourceDownloadCount(courseId, lessonId, resource.id);

      // Update local state for immediate UI feedback
      if (newCount !== null) {
        setDownloadCounts(prev => ({
          ...prev,
          [resource.id]: newCount
        }));
      }

    } catch (error) {
      log.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Downloadable Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {getFileIcon(resource.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {resource.fileType.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(resource.fileSize)}
                    </span>
                    {downloadCounts[resource.id] > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {downloadCounts[resource.id]} downloads
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(resource)}
                disabled={downloading === resource.id}
              >
                {downloading === resource.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Resources will open in a new tab. Save them to your device for offline access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

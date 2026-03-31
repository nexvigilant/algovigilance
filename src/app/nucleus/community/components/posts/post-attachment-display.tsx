'use client';

import { FileText, Image as ImageIcon, FileSpreadsheet, File, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PostAttachment } from '@/types/community';

interface PostAttachmentDisplayProps {
  attachments: PostAttachment[];
}

// Get icon for file type
function getFileIcon(fileType: PostAttachment['fileType']) {
  switch (fileType) {
    case 'image':
      return <ImageIcon className="h-5 w-5" />;
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-400" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
    case 'document':
      return <FileText className="h-5 w-5 text-blue-400" />;
    default:
      return <File className="h-5 w-5" />;
  }
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PostAttachmentDisplay({ attachments }: PostAttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Separate images from other files
  const images = attachments.filter((a) => a.fileType === 'image');
  const files = attachments.filter((a) => a.fileType !== 'image');

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted hover:border-cyan/50 transition-all"
              >
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white truncate">{attachment.fileName}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Attachments</h4>
          <div className="grid gap-2">
            {files.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-cyan/30 transition-colors"
              >
                {/* File Icon */}
                <div className="h-10 w-10 flex items-center justify-center bg-background rounded-lg border border-border shrink-0">
                  {getFileIcon(attachment.fileType)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>

                {/* Download Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="shrink-0 text-muted-foreground hover:text-cyan"
                >
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

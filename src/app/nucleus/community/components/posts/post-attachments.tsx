'use client';

import { useState, useCallback } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/compositions';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { PostAttachment } from '@/types/community';
import type { AttachmentId } from '@/types/community/branded-ids';
import { Timestamp } from 'firebase/firestore';

interface PostAttachmentsProps {
  attachments: PostAttachment[];
  onAttachmentsChange: (attachments: PostAttachment[]) => void;
  userId: string;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
}

// Determine file type category from MIME type
function getFileType(mimeType: string): PostAttachment['fileType'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return 'spreadsheet';
  }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType === 'text/plain'
  ) {
    return 'document';
  }
  return 'other';
}

// Get icon for file type
function getFileIcon(fileType: PostAttachment['fileType']) {
  switch (fileType) {
    case 'image':
      return <ImageIcon className="h-4 w-4" />;
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    case 'document':
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <File className="h-4 w-4" />;
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

export function PostAttachments({
  attachments,
  onAttachmentsChange,
  userId,
  disabled = false,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}: PostAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File): Promise<string> => {
      // Create unique filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `post-attachments/${userId}/${timestamp}_${safeName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Get download URL
      return await getDownloadURL(storageRef);
    },
    [userId]
  );

  const handleSuccess = useCallback(
    (url: string, file: File) => {
      const newAttachment: PostAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` as AttachmentId,
        fileName: file.name,
        fileUrl: url,
        fileSize: file.size,
        fileType: getFileType(file.type),
        mimeType: file.type,
        uploadedAt: Timestamp.now(),
      };

      onAttachmentsChange([...attachments, newAttachment]);
      setUploadError(null);
    },
    [attachments, onAttachmentsChange]
  );

  const handleError = useCallback((error: Error, _file: File) => {
    setUploadError(error.message);
  }, []);

  const handleRemove = useCallback(
    (attachmentId: string) => {
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
    },
    [attachments, onAttachmentsChange]
  );

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setIsUploading(true);
      setUploadError(null);
    }
  }, []);

  // Reset uploading state when all uploads complete
  const wrappedOnSuccess = useCallback(
    (url: string, file: File) => {
      handleSuccess(url, file);
      setIsUploading(false);
    },
    [handleSuccess]
  );

  const wrappedOnError = useCallback(
    (error: Error, file: File) => {
      handleError(error, file);
      setIsUploading(false);
    },
    [handleError]
  );

  const canAddMore = attachments.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>
              {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
              >
                {/* Preview or Icon */}
                {attachment.fileType === 'image' ? (
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-background rounded border border-border">
                    {getFileIcon(attachment.fileType)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(attachment.id)}
                  disabled={disabled}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div className="relative">
          <FileUpload
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            maxSize={maxFileSize}
            multiple
            showPreview={false}
            onFilesSelected={handleFilesSelected}
            onUpload={handleUpload}
            onSuccess={wrappedOnSuccess}
            onError={wrappedOnError}
            disabled={disabled || isUploading}
            dragDropText={`Drag files here or click to upload (${attachments.length}/${maxFiles})`}
            className="border-dashed"
          />

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Max Files Message */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Maximum {maxFiles} attachments allowed
        </p>
      )}

      {/* Error Message */}
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Supported: Images, PDF, Word, Excel, CSV, Text. Max {formatFileSize(maxFileSize)} per file.
      </p>
    </div>
  );
}

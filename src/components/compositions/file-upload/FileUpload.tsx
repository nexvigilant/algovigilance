'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

export interface FileUploadProps {
  /** Accepted file types (e.g., "image/*", ".pdf", "image/png,image/jpeg") */
  accept?: string;

  /** Maximum file size in bytes */
  maxSize?: number;

  /** Allow multiple files */
  multiple?: boolean;

  /** Show file preview */
  showPreview?: boolean;

  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void;

  /** Callback to upload file (receives file, returns URL or error) */
  onUpload?: (file: File) => Promise<string>;

  /** Callback when upload succeeds */
  onSuccess?: (url: string, file: File) => void;

  /** Callback when upload fails */
  onError?: (error: Error, file: File) => void;

  /** Custom class name */
  className?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Custom upload button text */
  uploadButtonText?: string;

  /** Custom drag-drop area text */
  dragDropText?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

/**
 * File upload component with drag-drop and preview
 *
 * @example
 * ```tsx
 * <FileUpload
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   onUpload={async (file) => {
 *     const storageRef = ref(storage, `images/${file.name}`);
 *     await uploadBytes(storageRef, file);
 *     return await getDownloadURL(storageRef);
 *   }}
 *   onSuccess={(url) => setImageUrl(url)}
 *   showPreview
 *   multiple={false}
 * />
 * ```
 */
export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  showPreview = true,
  onFilesSelected,
  onUpload,
  onSuccess,
  onError,
  className = '',
  disabled = false,
  uploadButtonText = 'Upload File',
  dragDropText = 'Drag and drop files here, or click to select',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size must be less than ${sizeMB}MB`;
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileType = file.type;
      const fileName = file.name;

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          // Extension-based check
          return fileName.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.endsWith('/*')) {
          // Wildcard MIME type (e.g., "image/*")
          const prefix = type.slice(0, -2);
          return fileType.startsWith(prefix);
        } else {
          // Exact MIME type
          return fileType === type;
        }
      });

      if (!isAccepted) {
        return `File type not accepted. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  // Create preview URL for images
  const createPreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  // Handle file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Validate all files
    const validatedFiles: UploadedFile[] = [];

    for (const file of filesArray) {
      const error = validateFile(file);

      if (error) {
        validatedFiles.push({
          file,
          preview: undefined,
          uploading: false,
          error,
        });
      } else {
        validatedFiles.push({
          file,
          preview: showPreview ? createPreview(file) : undefined,
          uploading: false,
        });
      }
    }

    // Add to uploaded files
    setUploadedFiles((prev) => (multiple ? [...prev, ...validatedFiles] : validatedFiles));

    // Call onFilesSelected callback
    if (onFilesSelected) {
      onFilesSelected(validatedFiles.filter((f) => !f.error).map((f) => f.file));
    }

    // Auto-upload if onUpload is provided
    if (onUpload) {
      for (let i = 0; i < validatedFiles.length; i++) {
        const uploadedFile = validatedFiles[i];

        if (uploadedFile.error) continue;

        // Mark as uploading
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file ? { ...f, uploading: true } : f
          )
        );

        try {
          const url = await onUpload(uploadedFile.file);

          // Mark as uploaded
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === uploadedFile.file
                ? { ...f, uploading: false, url }
                : f
            )
          );

          // Call success callback
          if (onSuccess) {
            onSuccess(url, uploadedFile.file);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Upload failed');

          // Mark as error
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === uploadedFile.file
                ? { ...f, uploading: false, error: error.message }
                : f
            )
          );

          // Call error callback
          if (onError) {
            onError(error, uploadedFile.file);
          }
        }
      }
    }
  };

  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Handle click on drop zone
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove file
  const handleRemove = (file: File) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.file === file);

      // Revoke preview URL to prevent memory leaks
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      return prev.filter((f) => f.file !== file);
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="File upload"
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={dragDropText}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="mt-2 text-sm text-gray-600">
          {dragDropText}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {accept && `Accepted types: ${accept}`}
          {accept && maxSize && ' • '}
          {maxSize && `Max size: ${formatFileSize(maxSize)}`}
        </p>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Preview */}
              {uploadedFile.preview && (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.file.name}
                  className="h-12 w-12 object-cover rounded"
                />
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                </p>

                {/* Status */}
                {uploadedFile.uploading && (
                  <p className="text-xs text-blue-600">Uploading...</p>
                )}
                {uploadedFile.url && (
                  <p className="text-xs text-green-600">Uploaded</p>
                )}
                {uploadedFile.error && (
                  <p className="text-xs text-red-600">{uploadedFile.error}</p>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(uploadedFile.file)}
                className="text-gray-400 hover:text-red-600 focus:outline-none"
                aria-label={`Remove ${uploadedFile.file.name}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


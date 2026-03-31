'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { logger } from '@/lib/logger';
const log = logger.scope('components/avatar-uploader');
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropper } from '@/components/compositions';

interface AvatarUploaderProps {
  currentAvatar?: string;
  userId: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function AvatarUploader({
  currentAvatar,
  userId,
  onUploadComplete,
  disabled = false,
}: AvatarUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setIsOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const storagePath = `avatars/${userId}/${timestamp}_avatar.png`;
      const storageRef = ref(storage, storagePath);

      // Upload cropped image
      await uploadBytes(storageRef, croppedBlob, {
        contentType: 'image/png',
      });

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Notify parent
      onUploadComplete(downloadUrl);

      // Close dialog
      setIsOpen(false);
      setSelectedImage(null);
    } catch (err) {
      log.error('Avatar upload error:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [userId, onUploadComplete]);

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      setSelectedImage(null);
      setError(null);
    }
  };

  return (
    <>
      {/* Avatar Display with Upload Button */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden border-2 border-border">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium">Profile Picture</p>
          <p className="text-xs text-muted-foreground">
            Click to upload a new avatar. Max 5MB, PNG/JPG/GIF.
          </p>
          {error && !isOpen && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Crop Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Your Avatar</DialogTitle>
            <DialogDescription>
              Drag to position and use the slider to zoom. Click "Save Avatar" when ready.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {selectedImage && (
            <div className="space-y-4">
              <ImageCropper
                image={selectedImage}
                aspectRatio={1}
                onCropComplete={handleCropComplete}
              />

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

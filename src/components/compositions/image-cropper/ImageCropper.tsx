'use client';

/**
 * ImageCropper starter composition.
 * Requires `react-easy-crop` to be installed for full functionality.
 *
 * If missing, install:
 *   npm install react-easy-crop
 */

import { useState, useCallback } from 'react';

import { logger } from '@/lib/logger';
const log = logger.scope('components/ImageCropper');

let Cropper: any = null;
try {
  Cropper = require('react-easy-crop').default;
} catch {
  log.warn('[ImageCropper] react-easy-crop not installed. Install with `npm install react-easy-crop`.');
}

export interface ImageCropperProps {
  image: string;
  aspectRatio?: number;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropper({
  image,
  aspectRatio = 1,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropAreaComplete = useCallback((_area: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  if (!Cropper) {
    return (
      <div className="border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 rounded">
        react-easy-crop is not installed. Run: npm install react-easy-crop
      </div>
    );
  }

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImage(image, croppedAreaPixels);
    onCropComplete(blob);
  };

  return (
    <div>
      <div className="relative h-96">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropAreaComplete}
          onZoomChange={setZoom}
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label>Zoom:</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <button
          type="button"
          onClick={handleCrop}
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Crop Image
        </button>
      </div>
    </div>
  );
}

// Minimal helper to crop image using canvas
async function getCroppedImage(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

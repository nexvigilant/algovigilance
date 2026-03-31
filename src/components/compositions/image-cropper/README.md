# ImageCropper Composition

**Status**: Starter Implementation - Recommended Library Integration

Interactive image cropping component with aspect ratio control.

## Recommended Library

**react-easy-crop** - Excellent image cropping library with touch support

```bash
npm install react-easy-crop
```

## Implementation Pattern

```tsx
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export function ImageCropper({
  image,
  aspectRatio = 1,
  onCropComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    onCropComplete(croppedImage);
  };

  return (
    <div>
      <div className="relative h-96">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
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
        <button onClick={handleCrop}>Crop Image</button>
      </div>
    </div>
  );
}

// Helper function to get cropped image
async function getCroppedImg(imageSrc, pixelCrop) {
  // Implementation using canvas
  // See react-easy-crop documentation
}
```

## Features

- Interactive crop area
- Zoom control
- Aspect ratio presets (1:1, 16:9, 4:3, free)
- Touch support
- Keyboard shortcuts
- Preview
- Export to blob/file

## Aspect Ratio Presets

```tsx
const ASPECT_RATIOS = {
  square: 1,
  landscape: 16 / 9,
  portrait: 9 / 16,
  photo: 4 / 3,
  free: undefined,
};
```

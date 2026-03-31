# FileUpload Composition

Drag-and-drop file upload component with preview, validation, and automatic upload support.

## Features

- ✅ Drag-and-drop file selection
- ✅ Click to select files
- ✅ File validation (type, size)
- ✅ Image preview
- ✅ Progress tracking
- ✅ Error handling
- ✅ Multiple file support
- ✅ Automatic upload with callback
- ✅ Fully accessible

## Usage

### Basic Example

```tsx
import { FileUpload } from '@/components/compositions/file-upload/FileUpload';

function ProfilePicture() {
  return (
    <FileUpload
      accept="image/*"
      maxSize={5 * 1024 * 1024} // 5MB
      onFilesSelected={(files) => console.log('Selected:', files)}
      showPreview
      multiple={false}
    />
  );
}
```

### With Firebase Storage Upload

```tsx
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

<FileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUpload={async (file) => {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  }}
  onSuccess={(url) => {
    console.log('Uploaded to:', url);
    setImageUrl(url);
  }}
  onError={(error) => {
    console.error('Upload failed:', error);
  }}
  showPreview
/>
```

### Multiple Files

```tsx
<FileUpload
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  multiple
  onFilesSelected={(files) => {
    console.log(`Selected ${files.length} files`);
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | `undefined` | Accepted file types |
| `maxSize` | `number` | `10485760` (10MB) | Max file size in bytes |
| `multiple` | `boolean` | `false` | Allow multiple files |
| `showPreview` | `boolean` | `true` | Show image preview |
| `onFilesSelected` | `(files: File[]) => void` | `undefined` | Callback when files selected |
| `onUpload` | `(file: File) => Promise<string>` | `undefined` | Upload function |
| `onSuccess` | `(url: string, file: File) => void` | `undefined` | Upload success callback |
| `onError` | `(error: Error, file: File) => void` | `undefined` | Upload error callback |
| `className` | `string` | `''` | Custom class name |
| `disabled` | `boolean` | `false` | Disabled state |
| `uploadButtonText` | `string` | `'Upload File'` | Button text |
| `dragDropText` | `string` | `'Drag and drop...'` | Drop zone text |

## File Validation

### Accepted Types

```tsx
// Images only
<FileUpload accept="image/*" />

// Specific image types
<FileUpload accept="image/png,image/jpeg" />

// Documents by extension
<FileUpload accept=".pdf,.doc,.docx" />

// Mixed types
<FileUpload accept="image/*,.pdf,.doc" />
```

### Size Validation

```tsx
// 1MB limit
<FileUpload maxSize={1 * 1024 * 1024} />

// 5MB limit
<FileUpload maxSize={5 * 1024 * 1024} />

// 10MB limit (default)
<FileUpload maxSize={10 * 1024 * 1024} />
```

## Upload Integration

### Firebase Storage

```tsx
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

<FileUpload
  onUpload={async (file) => {
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }}
  onSuccess={(url) => saveToFirestore(url)}
/>
```

### Custom API Endpoint

```tsx
<FileUpload
  onUpload={async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const { url } = await response.json();
    return url;
  }}
  onSuccess={(url) => console.log('Uploaded:', url)}
/>
```

### With Progress Tracking

```tsx
const [uploadProgress, setUploadProgress] = useState(0);

<FileUpload
  onUpload={async (file) => {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        const { url } = JSON.parse(xhr.responseText);
        resolve(url);
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('POST', '/api/upload');
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }}
/>
```

## Accessibility

- Drag-and-drop with keyboard alternative
- ARIA labels for screen readers
- Focus management
- Error announcements

## Performance

- Automatic cleanup of preview URLs
- Efficient file validation
- Lazy preview generation
- Memory-conscious image handling

## Common Patterns

### Profile Picture Upload

```tsx
<FileUpload
  accept="image/jpeg,image/png"
  maxSize={2 * 1024 * 1024}
  multiple={false}
  showPreview
  onUpload={uploadToStorage}
  onSuccess={(url) => updateUserProfile({ photoURL: url })}
/>
```

### Document Upload

```tsx
<FileUpload
  accept=".pdf,.doc,.docx,.txt"
  maxSize={10 * 1024 * 1024}
  multiple
  showPreview={false}
  onFilesSelected={(files) => {
    console.log(`Selected ${files.length} documents`);
  }}
/>
```

### Avatar with Cropping

```tsx
const [selectedFile, setSelectedFile] = useState(null);
const [showCropper, setShowCropper] = useState(false);

<FileUpload
  accept="image/*"
  multiple={false}
  onFilesSelected={(files) => {
    setSelectedFile(files[0]);
    setShowCropper(true);
  }}
/>

{showCropper && (
  <ImageCropper
    file={selectedFile}
    aspectRatio={1}
    onCrop={(croppedBlob) => uploadCroppedImage(croppedBlob)}
  />
)}
```

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from './FileUpload';

test('accepts file drop', () => {
  const mockOnFilesSelected = jest.fn();

  render(
    <FileUpload
      onFilesSelected={mockOnFilesSelected}
      accept="image/*"
    />
  );

  const dropZone = screen.getByRole('button');
  const file = new File(['test'], 'test.png', { type: 'image/png' });

  fireEvent.drop(dropZone, {
    dataTransfer: { files: [file] },
  });

  expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
});
```

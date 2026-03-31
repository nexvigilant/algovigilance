'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileUp,
  FileText,
  Link2,
  Upload,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.md,.mdx,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface DocumentImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted: (data: ExtractionData) => void;
}

export interface ExtractionData {
  title: string;
  description: string;
  type: 'podcast' | 'publication' | 'perspective' | 'field-note' | 'signal';
  tags: string[];
  body: string;
  author?: string;
  typeSpecificFields?: Record<string, unknown>;
  confidence: {
    title: number;
    type: number;
    tags: number;
    overall: number;
  };
  notes?: string;
}

export function DocumentImportModal({
  open,
  onOpenChange,
  onExtracted,
}: DocumentImportModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [googleDocsUrl, setGoogleDocsUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPasteText('');
    setGoogleDocsUrl('');
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['pdf', 'docx', 'doc', 'md', 'mdx', 'txt'];
    if (!ext || !validExtensions.includes(ext)) {
      return `Invalid file type. Supported: ${validExtensions.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleExtract = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let response: Response;

      if (activeTab === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        response = await fetch('/api/intelligence/extract', {
          method: 'POST',
          body: formData,
        });
      } else if (activeTab === 'paste' && pasteText.trim()) {
        response = await fetch('/api/intelligence/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: pasteText,
            filename: 'pasted-content.txt',
          }),
        });
      } else if (activeTab === 'url' && googleDocsUrl.trim()) {
        if (!googleDocsUrl.includes('docs.google.com/document')) {
          throw new Error('Please enter a valid Google Docs URL');
        }

        response = await fetch('/api/intelligence/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: googleDocsUrl,
          }),
        });
      } else {
        throw new Error('Please provide content to extract');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Extraction failed');
      }

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      onExtracted(result.data);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const canExtract = () => {
    if (isLoading) return false;
    if (activeTab === 'file') return !!selectedFile;
    if (activeTab === 'paste') return pasteText.trim().length >= 10;
    if (activeTab === 'url') return googleDocsUrl.includes('docs.google.com/document');
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-nex-surface border-cyan/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-cyan" />
            Import Document
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload or paste content to auto-fill the form using AI extraction.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 bg-nex-dark">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Google Docs
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file" className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-cyan bg-cyan/10'
                  : 'border-cyan/30 hover:border-cyan/50',
                selectedFile && 'border-green-500/50 bg-green-500/10'
              )}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <FileText className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-cyan/50 mb-4" />
                  <p className="text-sm text-slate-300">
                    Drag and drop a file, or click to select
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Supported: PDF, Word (.docx), Markdown, Text
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          {/* Paste Text Tab */}
          <TabsContent value="paste" className="mt-4 space-y-3">
            <Label htmlFor="paste-text">Paste your content</Label>
            <Textarea
              id="paste-text"
              placeholder="Paste markdown, text, or article content here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={10}
              className="bg-nex-dark border-cyan/30 text-white placeholder:text-slate-500 resize-none"
            />
            <p className="text-xs text-slate-500">
              {pasteText.length} characters ({pasteText.length >= 10 ? 'ready' : 'minimum 10'})
            </p>
          </TabsContent>

          {/* Google Docs URL Tab */}
          <TabsContent value="url" className="mt-4 space-y-3">
            <Label htmlFor="gdocs-url">Google Docs URL</Label>
            <Input
              id="gdocs-url"
              type="url"
              placeholder="https://docs.google.com/document/d/..."
              value={googleDocsUrl}
              onChange={(e) => setGoogleDocsUrl(e.target.value)}
              className="bg-nex-dark border-cyan/30 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              The document must be shared as &quot;Anyone with the link can view&quot;
            </p>
          </TabsContent>
        </Tabs>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleExtract}
            disabled={!canExtract()}
            className="bg-cyan text-nex-deep hover:bg-cyan-glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                Extract Content
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

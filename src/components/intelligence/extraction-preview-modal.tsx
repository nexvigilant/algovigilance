'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  X,
  Edit2,
  Eye,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractionData } from './document-import-modal';

type ContentType = 'podcast' | 'publication' | 'perspective' | 'field-note' | 'signal';

interface ExtractionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractionData | null;
  currentFormData?: Partial<{
    title: string;
    description: string;
    type: ContentType;
    tags: string[];
    body: string;
    author: string;
  }>;
  onApply: (selectedFields: Partial<ExtractionData>) => void;
}

interface FieldSelection {
  title: boolean;
  description: boolean;
  type: boolean;
  tags: boolean;
  body: boolean;
  author: boolean;
}

interface EditableFields {
  title: string;
  description: string;
  type: ContentType;
  tags: string[];
  body: string;
  author: string;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  podcast: 'Podcast',
  publication: 'Publication',
  perspective: 'Perspective',
  'field-note': 'Field Note',
  signal: 'Signal',
};

function ConfidenceIndicator({ score }: { score: number }) {
  const level = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low';
  const colors = {
    high: 'text-green-400 bg-green-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    low: 'text-red-400 bg-red-500/20',
  };
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <Badge className={cn('text-xs', colors[level])}>
      {labels[level]} ({Math.round(score * 100)}%)
    </Badge>
  );
}

export function ExtractionPreviewModal({
  open,
  onOpenChange,
  extractedData,
  currentFormData,
  onApply,
}: ExtractionPreviewModalProps) {
  const [selected, setSelected] = useState<FieldSelection>({
    title: true,
    description: true,
    type: true,
    tags: true,
    body: true,
    author: true,
  });

  const [editingField, setEditingField] = useState<keyof FieldSelection | null>(null);
  const [editableData, setEditableData] = useState<EditableFields>({
    title: '',
    description: '',
    type: 'perspective',
    tags: [],
    body: '',
    author: '',
  });

  // Initialize editable data when extractedData changes
  useEffect(() => {
    if (extractedData) {
      setEditableData({
        title: extractedData.title || '',
        description: extractedData.description || '',
        type: extractedData.type || 'perspective',
        tags: extractedData.tags || [],
        body: extractedData.body || '',
        author: extractedData.author || '',
      });
    }
  }, [extractedData]);

  const handleClose = () => {
    setEditingField(null);
    onOpenChange(false);
  };

  const handleApply = () => {
    const selectedData: Partial<ExtractionData> = {};

    if (selected.title) selectedData.title = editableData.title;
    if (selected.description) selectedData.description = editableData.description;
    if (selected.type) selectedData.type = editableData.type;
    if (selected.tags) selectedData.tags = editableData.tags;
    if (selected.body) selectedData.body = editableData.body;
    if (selected.author) selectedData.author = editableData.author;

    onApply(selectedData);
    handleClose();
  };

  const toggleField = (field: keyof FieldSelection) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAll = (value: boolean) => {
    setSelected({
      title: value,
      description: value,
      type: value,
      tags: value,
      body: value,
      author: value,
    });
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  if (!extractedData) return null;

  const renderFieldRow = (
    fieldKey: keyof FieldSelection,
    label: string,
    _extractedValue: string | string[] | undefined,
    currentValue: string | string[] | undefined,
    confidenceScore?: number
  ) => {
    const isEditing = editingField === fieldKey;
    const currentDisplay = Array.isArray(currentValue)
      ? currentValue.join(', ')
      : currentValue || '(empty)';

    const hasCurrentValue = currentValue && (Array.isArray(currentValue) ? currentValue.length > 0 : currentValue.trim() !== '');

    return (
      <div
        key={fieldKey}
        className={cn(
          'p-3 rounded-lg border transition-colors',
          selected[fieldKey]
            ? 'border-cyan/30 bg-cyan/5'
            : 'border-slate-700 bg-nex-dark/50 opacity-60'
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id={fieldKey}
            checked={selected[fieldKey]}
            onCheckedChange={() => toggleField(fieldKey)}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor={fieldKey} className="font-medium cursor-pointer">
                {label}
              </Label>
              {confidenceScore !== undefined && (
                <ConfidenceIndicator score={confidenceScore} />
              )}
              {hasCurrentValue && (
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                  Will overwrite
                </Badge>
              )}
            </div>

            {/* Extracted value / Edit mode */}
            {isEditing ? (
              <div className="space-y-2">
                {fieldKey === 'body' ? (
                  <Textarea
                    value={editableData.body}
                    onChange={(e) => setEditableData(prev => ({ ...prev, body: e.target.value }))}
                    rows={6}
                    className="bg-nex-dark border-cyan/30 text-sm"
                  />
                ) : fieldKey === 'type' ? (
                  <Select
                    value={editableData.type}
                    onValueChange={(v) => setEditableData(prev => ({ ...prev, type: v as ContentType }))}
                  >
                    <SelectTrigger className="bg-nex-dark border-cyan/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nex-surface border-cyan/30">
                      {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldKey === 'tags' ? (
                  <Input
                    value={editableData.tags.join(', ')}
                    onChange={(e) => setEditableData(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                    placeholder="tag1, tag2, tag3"
                    className="bg-nex-dark border-cyan/30 text-sm"
                  />
                ) : (
                  <Input
                    value={editableData[fieldKey as keyof EditableFields] as string}
                    onChange={(e) => setEditableData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                    className="bg-nex-dark border-cyan/30 text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingField(null)}
                    className="text-slate-400"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingField(null)}
                    className="bg-cyan/20 text-cyan hover:bg-cyan/30"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className={cn(
                  'text-sm flex-1',
                  fieldKey === 'body' ? 'line-clamp-3' : 'line-clamp-2',
                  selected[fieldKey] ? 'text-slate-300' : 'text-slate-500'
                )}>
                  {fieldKey === 'type' ? CONTENT_TYPE_LABELS[editableData.type] :
                   fieldKey === 'tags' ? editableData.tags.join(', ') || '(empty)' :
                   (editableData[fieldKey as keyof EditableFields] as string) || '(empty)'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingField(fieldKey)}
                  className="text-slate-500 hover:text-cyan shrink-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Current form value comparison */}
            {hasCurrentValue && !isEditing && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Current: <span className="text-slate-400 truncate">{currentDisplay}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-nex-surface border-cyan/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan" />
            Review Extracted Content
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Select which fields to apply to the form. You can edit values before applying.
          </DialogDescription>
        </DialogHeader>

        {/* Overall confidence */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-nex-dark border border-cyan/20">
          <div className="flex items-center gap-2">
            {extractedData.confidence.overall >= 0.7 ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            )}
            <span className="text-sm text-slate-300">
              Overall extraction confidence
            </span>
          </div>
          <ConfidenceIndicator score={extractedData.confidence.overall} />
        </div>

        {/* Extraction notes */}
        {extractedData.notes && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            <p className="font-medium mb-1">AI Notes:</p>
            <p className="text-amber-300/80">{extractedData.notes}</p>
          </div>
        )}

        {/* Select all / none */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {selectedCount} of 6 fields selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(true)}
              className="text-slate-400 hover:text-cyan"
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Clear all
            </Button>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {renderFieldRow(
            'title',
            'Title',
            extractedData.title,
            currentFormData?.title,
            extractedData.confidence.title
          )}
          {renderFieldRow(
            'description',
            'Description',
            extractedData.description,
            currentFormData?.description
          )}
          {renderFieldRow(
            'type',
            'Content Type',
            extractedData.type,
            currentFormData?.type,
            extractedData.confidence.type
          )}
          {renderFieldRow(
            'tags',
            'Tags',
            extractedData.tags,
            currentFormData?.tags,
            extractedData.confidence.tags
          )}
          {renderFieldRow(
            'author',
            'Author',
            extractedData.author,
            currentFormData?.author
          )}
          {renderFieldRow(
            'body',
            'Body Content',
            extractedData.body,
            currentFormData?.body
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-cyan/10">
          <Button variant="ghost" onClick={handleClose} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedCount === 0}
            className="bg-cyan text-nex-deep hover:bg-cyan-glow"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply {selectedCount} Field{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

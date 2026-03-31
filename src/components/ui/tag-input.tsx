'use client';

import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  addButtonLabel?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = 'Enter a value',
  maxTags,
  className,
  addButtonLabel = 'Add',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // Check if tag already exists
    if (tags.includes(trimmedValue)) {
      return;
    }

    // Check max tags limit
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    onTagsChange([...tags, trimmedValue]);
    setInputValue('');
    setShowInput(false);
  };

  const handleRemove = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue('');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Display Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-nex-surface border border-cyan/30 rounded-md text-white text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-cyan-glow hover:text-red-400 transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-nex-surface rounded-sm"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      {showInput ? (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="bg-nex-surface border-cyan/30 text-white"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            {addButtonLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowInput(false);
              setInputValue('');
            }}
            className="border-cyan/30"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          disabled={maxTags ? tags.length >= maxTags : false}
          className="border-cyan/30 text-cyan-soft"
        >
          <Plus className="h-4 w-4 mr-1" />
          {addButtonLabel}
        </Button>
      )}

      {/* Max Tags Info */}
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {tags.length} / {maxTags} {tags.length === 1 ? 'item' : 'items'}
        </p>
      )}
    </div>
  );
}

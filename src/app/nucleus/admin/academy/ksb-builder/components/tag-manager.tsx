'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Tag } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  label?: string;
}

// Common PV-related tag suggestions
const defaultSuggestions = [
  'signal-detection',
  'case-processing',
  'regulatory',
  'meddra',
  'icsr',
  'causality',
  'risk-management',
  'literature-review',
  'aggregate-reporting',
  'safety-database',
  'expedited-reporting',
  'periodic-reporting',
  'benefit-risk',
  'pharmacoepidemiology',
  'clinical-trials',
];

export function TagManager({
  tags,
  onChange,
  suggestions = defaultSuggestions,
  label = 'Tags',
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(suggestion)
    )
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {label} ({tags.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input with suggestions */}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type to add tags..."
              className="flex-1"
            />
            <Button
              onClick={() => inputValue && addTag(inputValue)}
              size="sm"
              disabled={!inputValue}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Press Enter to add a tag. Tags help categorize content for search and filtering.
        </p>
      </CardContent>
    </Card>
  );
}

export default TagManager;

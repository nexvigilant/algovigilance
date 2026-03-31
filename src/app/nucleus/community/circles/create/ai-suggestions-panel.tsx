'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, AlertCircle, X } from 'lucide-react';

export interface AiSuggestions {
  suggestedCategory: string;
  suggestedTags: string[];
  targetAudience: string[];
  keyThemes: string[];
  improvementSuggestions?: string;
  similarForumWarning?: string;
}

interface AiSuggestionsPanelProps {
  suggestions: AiSuggestions;
  onApply: () => void;
  onDismiss: () => void;
}

export function AiSuggestionsPanel({
  suggestions,
  onApply,
  onDismiss,
}: AiSuggestionsPanelProps) {
  return (
    <Card className="bg-gradient-to-br from-cyan/10 to-cyan-muted/10 border-cyan/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-glow" />
            <CardTitle className="text-white">AI Suggestions</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-cyan-soft hover:bg-cyan/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Similar Forum Warning */}
        {suggestions.similarForumWarning && (
          <div className="flex items-start gap-2 p-3 bg-nex-gold-500/10 border border-nex-gold-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-nex-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-nex-gold-300 font-medium mb-1">
                Similar Circle May Exist
              </p>
              <p className="text-sm text-nex-gold-300/80">
                {suggestions.similarForumWarning}
              </p>
            </div>
          </div>
        )}

        {/* Suggested Category */}
        <div>
          <Label className="text-cyan-soft font-semibold mb-2 block">
            Suggested Category
          </Label>
          <div className="px-3 py-2 bg-nex-light border border-cyan/30 rounded-lg text-white">
            {suggestions.suggestedCategory}
          </div>
        </div>

        {/* Suggested Tags */}
        <div>
          <Label className="text-cyan-soft font-semibold mb-2 block">
            Suggested Tags
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestions.suggestedTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-nex-light border border-cyan/30 rounded-full text-white text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <Label className="text-cyan-soft font-semibold mb-2 block">
            Target Audience
          </Label>
          <ul className="list-disc list-inside space-y-1 text-cyan-soft/80 text-sm">
            {suggestions.targetAudience.map((audience, idx) => (
              <li key={idx}>{audience}</li>
            ))}
          </ul>
        </div>

        {/* Key Themes */}
        <div>
          <Label className="text-cyan-soft font-semibold mb-2 block">
            Key Themes
          </Label>
          <ul className="list-disc list-inside space-y-1 text-cyan-soft/80 text-sm">
            {suggestions.keyThemes.map((theme, idx) => (
              <li key={idx}>{theme}</li>
            ))}
          </ul>
        </div>

        {/* Improvement Suggestions */}
        {suggestions.improvementSuggestions && (
          <div>
            <Label className="text-cyan-soft font-semibold mb-2 block">
              Improvement Suggestions
            </Label>
            <p className="text-sm text-cyan-soft/80">
              {suggestions.improvementSuggestions}
            </p>
          </div>
        )}

        {/* Apply Button */}
        <Button
          type="button"
          onClick={onApply}
          className="w-full bg-cyan-dark hover:bg-cyan-dark/80 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}

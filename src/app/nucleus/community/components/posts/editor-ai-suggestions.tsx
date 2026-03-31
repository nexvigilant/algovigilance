'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, AlertCircle, Info, X } from 'lucide-react';
import type { SuggestPostMetadataOutput } from '@/lib/ai/flows/suggest-post-metadata';

const CATEGORIES = [
  { id: 'general', name: 'General Discussion', icon: '📢' },
  { id: 'academy', name: 'Academy', icon: '🎓' },
  { id: 'careers', name: 'Careers', icon: '💼' },
  { id: 'guardian', name: 'Guardian', icon: '🛡️' },
  { id: 'projects', name: 'Projects & Collaboration', icon: '🚀' },
] as const;

interface EditorAiSuggestionsProps {
  suggestions: SuggestPostMetadataOutput;
  onApply: () => void;
  onDismiss: () => void;
}

export function EditorAiSuggestions({ suggestions, onApply, onDismiss }: EditorAiSuggestionsProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl">AI Suggestions</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-muted-foreground hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Similar Post Warning */}
        {suggestions.similarPostWarning && (
          <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong className="font-semibold">Similar Post May Exist</strong>
              <p className="mt-1 text-sm">{suggestions.similarPostWarning}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Post Type & Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold block">Post Type</Label>
            <Badge variant="secondary" className="text-sm py-1.5 px-3 capitalize w-full justify-center md:w-auto">
              <Info className="h-3 w-3 mr-1.5" />
              {suggestions.postType}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold block">Urgency Level</Label>
            <Badge
              variant={
                suggestions.urgency === 'high'
                  ? 'destructive'
                  : suggestions.urgency === 'medium'
                  ? 'default'
                  : 'secondary'
              }
              className="text-sm py-1.5 px-3 capitalize w-full justify-center md:w-auto"
            >
              {suggestions.urgency === 'high' && '🔴'}
              {suggestions.urgency === 'medium' && '🟡'}
              {suggestions.urgency === 'low' && '🟢'}
              <span className="ml-1.5">{suggestions.urgency}</span>
            </Badge>
          </div>
        </div>

        {/* Suggested Category */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Suggested Category</Label>
          <div className="px-3 py-2 bg-muted border border-primary/30 rounded-md">
            {CATEGORIES.find((cat) => cat.name === suggestions.suggestedCategory)?.icon}{' '}
            {suggestions.suggestedCategory}
          </div>
        </div>

        {/* Suggested Tags */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Suggested Tags</Label>
          <div className="flex flex-wrap gap-2">
            {suggestions.suggestedTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm py-1 px-3">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Improvement Suggestions */}
        {suggestions.improvementSuggestions && (
          <div>
            <Label className="text-sm font-semibold mb-2 block">Improvement Suggestions</Label>
            <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm text-muted-foreground">
                {suggestions.improvementSuggestions}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Apply Button */}
        <Button type="button" onClick={onApply} className="w-full circuit-button">
          <Check className="h-4 w-4 mr-2" />
          Apply Category & Tags
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Check, AlertCircle, X, Plus } from 'lucide-react';
import { createForum, type CreateForumInput } from '../../actions/forums';
import { getForumAnalysis } from '../../actions/ai-suggestions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RequestFormBuilder, type RequestFormConfig } from './request-form-builder';

import { logger } from '@/lib/logger';
const log = logger.scope('create/create-forum-form');

const CATEGORIES = [
  'Regulatory Affairs',
  'Clinical Development',
  'Drug Safety',
  'Medical Communications',
  'Quality & Compliance',
  'Market Access & Economics',
  'Career Development',
  'General Discussion',
  'Data Science & Biostatistics',
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view and join' },
  { value: 'members-only', label: 'Members Only', description: 'Only AlgoVigilance members can view' },
  { value: 'private', label: 'Private', description: 'Invite-only forum' },
] as const;

const JOIN_TYPE_OPTIONS = [
  { value: 'open', label: 'Open', description: 'Anyone can join instantly' },
  { value: 'request', label: 'Request to Join', description: 'Users must request to join' },
  { value: 'invite-only', label: 'Invite Only', description: 'Only invited users can join' },
] as const;

type ForumVisibility = typeof VISIBILITY_OPTIONS[number]['value'];
type ForumJoinType = typeof JOIN_TYPE_OPTIONS[number]['value'];

export function CreateForumForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'members-only' | 'private'>('public');
  const [joinType, setJoinType] = useState<'open' | 'request' | 'invite-only'>('open');
  const [requestFormConfig, setRequestFormConfig] = useState<RequestFormConfig>({
    enabled: false,
    questions: [],
    introMessage: '',
  });

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState<{
    name: boolean;
    description: boolean;
    category: boolean;
    tags: boolean;
  }>({
    name: false,
    description: false,
    category: false,
    tags: false,
  });

  // Validation errors
  const errors = {
    name: touched.name && !name.trim() ? 'Circle name is required' : null,
    description: touched.description && !description.trim() ? 'Description is required' : null,
    category: touched.category && !category ? 'Please select a category' : null,
    tags: touched.tags && tags.length === 0 ? 'Please add at least one tag' : null,
  };

  // Mark all fields as touched when attempting to submit
  function markAllTouched() {
    setTouched({ name: true, description: true, category: true, tags: true });
  }

  // AI suggestions
  const [suggestions, setSuggestions] = useState<{
    suggestedCategory: string;
    suggestedTags: string[];
    targetAudience: string[];
    keyThemes: string[];
    improvementSuggestions?: string;
    similarForumWarning?: string;
  } | null>(null);

  async function handleGetSuggestions() {
    if (!name.trim() || !description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a forum name and description first',
        variant: 'destructive',
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await getForumAnalysis(name, description);
      if (result.success && result.data) {
        setSuggestions(result.data);
      }
    } catch (error) {
      log.error('Error getting suggestions:', error);
      toast({
        title: 'AI suggestions failed',
        description: 'Failed to get suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleApplySuggestions() {
    if (!suggestions) return;
    setCategory(suggestions.suggestedCategory);
    setTags(suggestions.suggestedTags);
    setShowSuggestions(false);
  }

  function handleAddTag() {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields touched to show validation errors
    markAllTouched();

    if (!name.trim() || !description.trim() || !category || tags.length === 0) {
      toast({
        title: 'Missing required fields',
        description: 'Please check the highlighted fields below',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateForumInput = {
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
        visibility,
        joinType,
        // Include request form config only if join type is 'request' and form is enabled
        ...(joinType === 'request' && requestFormConfig.enabled && {
          requestForm: {
            enabled: true,
            questions: requestFormConfig.questions,
            introMessage: requestFormConfig.introMessage,
          },
        }),
      };

      const result = await createForum(input);

      if (result.success && result.forumId) {
        router.push(`/nucleus/community/circles/${result.forumId}`);
      } else {
        toast({
          title: 'Failed to create circle',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      log.error('Error creating forum:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-white mb-2">Create a New Circle</h1>
        <p className="text-cyan-soft/70">
          Build a community around a specific topic with AI-powered suggestions to help you succeed
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
            <CardDescription className="text-cyan-soft/70">
              Tell us about your forum idea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-cyan-soft">
                Circle Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder="e.g., Clinical Trial Design Best Practices"
                maxLength={100}
                className={cn('mt-1', errors.name && 'border-red-500 focus:ring-red-500')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                required
              />
              <div className="flex justify-between mt-1">
                {errors.name ? (
                  <p id="name-error" className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-cyan-soft/60">{name.length}/100 characters</p>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-cyan-soft">
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                placeholder="Describe what this forum is about, who it's for, and what topics will be discussed..."
                rows={4}
                maxLength={500}
                className={cn('mt-1', errors.description && 'border-red-500 focus:ring-red-500')}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
                required
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p id="description-error" className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-cyan-soft/60">{description.length}/500 characters</p>
              </div>
            </div>

            {/* AI Suggestion Button */}
            <Button
              type="button"
              onClick={handleGetSuggestions}
              disabled={isSuggesting || !name.trim() || !description.trim()}
              className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
            >
              {isSuggesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting AI Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions && (
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
                  onClick={() => setShowSuggestions(false)}
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
                      Similar Forum May Exist
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
                onClick={handleApplySuggestions}
                className="w-full bg-cyan-dark hover:bg-cyan-dark/80 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Suggestions
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Organization */}
        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader>
            <CardTitle className="text-white">Organization</CardTitle>
            <CardDescription className="text-cyan-soft/70">
              Help users discover your forum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category" className="text-cyan-soft">
                Category <span className="text-red-400">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setTouched((prev) => ({ ...prev, category: true }));
                }}
                required
              >
                <SelectTrigger
                  className={cn('mt-1', errors.category && 'border-red-500 focus:ring-red-500')}
                  onBlur={() => setTouched((prev) => ({ ...prev, category: true }))}
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'category-error' : undefined}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p id="category-error" className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <Label className="text-cyan-soft">
                Tags <span className="text-red-400">*</span> (at least 1, max 10)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  onBlur={() => setTouched((prev) => ({ ...prev, tags: true }))}
                  placeholder="Add a tag..."
                  maxLength={30}
                  className={cn(errors.tags && 'border-red-500 focus:ring-red-500')}
                  aria-invalid={!!errors.tags}
                  aria-describedby={errors.tags ? 'tags-error' : undefined}
                />
                <Button
                  type="button"
                  onClick={() => {
                    handleAddTag();
                    setTouched((prev) => ({ ...prev, tags: true }));
                  }}
                  disabled={!newTag.trim() || tags.length >= 10}
                  className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-nex-light border border-cyan/30 rounded-full text-white text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-1">
                {errors.tags ? (
                  <p id="tags-error" className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tags}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-cyan-soft/60">{tags.length}/10 tags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access & Permissions */}
        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader>
            <CardTitle className="text-white">Access & Permissions</CardTitle>
            <CardDescription className="text-cyan-soft/70">
              Control who can see and join this forum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-cyan-soft mb-3 block">Visibility</Label>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      visibility === option.value
                        ? 'border-cyan bg-cyan/10'
                        : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={(e) => setVisibility(e.target.value as ForumVisibility)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-cyan-soft/70">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-cyan-soft mb-3 block">Join Type</Label>
              <div className="space-y-2">
                {JOIN_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      joinType === option.value
                        ? 'border-cyan bg-cyan/10'
                        : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="joinType"
                      value={option.value}
                      checked={joinType === option.value}
                      onChange={(e) => setJoinType(e.target.value as ForumJoinType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-cyan-soft/70">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Request Form Builder - shown when joinType is 'request' */}
            {joinType === 'request' && (
              <div className="pt-4 border-t border-cyan/20">
                <RequestFormBuilder
                  value={requestFormConfig}
                  onChange={setRequestFormConfig}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !description.trim() || !category || tags.length === 0}
            className="flex-1 bg-cyan-dark hover:bg-cyan-dark/80 text-white font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Circle...
              </>
            ) : (
              'Create Circle'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

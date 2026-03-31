"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Info,
  Paperclip,
  Shield,
  Lightbulb,
} from "lucide-react";
import { RichTextEditor } from "@/components/compositions";
import { createPost } from "../../actions";
import { getPostAnalysis } from "../../actions/ai-suggestions";
import type { SuggestPostMetadataOutput } from "@/lib/ai/flows/suggest-post-metadata";
import { PostAttachments } from "./post-attachments";
import { InlineTemplateSelector } from "./post-template-selector";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";
import type { PostAttachment } from "@/types/community";
import { useActivityOrchestration } from "../../hooks";
import {
  type PostTemplate,
  type PostTemplateId,
  POST_TEMPLATES,
} from "@/types/post-templates";

import { logger } from "@/lib/logger";
const log = logger.scope("components/post-editor");

const CATEGORIES = [
  { id: "general", name: "General Discussion", icon: "📢" },
  { id: "academy", name: "Academy", icon: "🎓" },
  { id: "careers", name: "Careers", icon: "💼" },
  { id: "guardian", name: "Guardian", icon: "🛡️" },
  { id: "projects", name: "Projects & Collaboration", icon: "🚀" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/**
 * Guardian Feedback Guidance Messages
 *
 * Non-punitive guidance to help users align with community standards.
 * These messages teach the Guardian Protocol values without blocking.
 */
const GUARDIAN_GUIDANCE: Record<string, { title: string; tips: string[] }> = {
  default: {
    title: "Content Review Suggestion",
    tips: [
      "Consider adding more context or specific examples to strengthen your post",
      "Professional tone helps build credibility with the community",
      "Check that external links point to reputable sources",
    ],
  },
  spam_pattern: {
    title: "Posting Frequency Notice",
    tips: [
      "Quality over quantity - take time to craft thoughtful posts",
      "Consider consolidating related topics into a single comprehensive post",
      "Engage with existing discussions before creating new ones",
    ],
  },
  promotional: {
    title: "Community-First Reminder",
    tips: [
      "Focus on providing value to the community first",
      "Share insights and learnings alongside any mentions of products or services",
      "Consider asking questions to invite discussion rather than just sharing links",
    ],
  },
};

export function PostEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { trackActivity, isOrchestrating: _isOrchestrating } =
    useActivityOrchestration();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("general");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardian Feedback state
  const [guardianFeedback, setGuardianFeedback] = useState<{
    show: boolean;
    level: "low" | "moderate" | "high";
    guidance: { title: string; tips: string[] };
  } | null>(null);

  // AI suggestions state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] =
    useState<SuggestPostMetadataOutput | null>(null);

  // Check if form has unsaved changes (is "dirty")
  const hasUnsavedChanges = useCallback(() => {
    return (
      title.trim().length > 0 ||
      content.trim().length > 0 ||
      tags.length > 0 ||
      attachments.length > 0
    );
  }, [title, content, tags, attachments]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() && !isSubmitting) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we still need to set returnValue
        e.returnValue = "";
        return "";
      }
      return undefined;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSubmitting]);

  // Auto-apply template from URL parameter (for nudge links)
  useEffect(() => {
    const templateParam = searchParams.get("template") as PostTemplateId | null;
    if (templateParam && POST_TEMPLATES[templateParam] && !activeTemplate) {
      const template = POST_TEMPLATES[templateParam];
      handleApplyTemplate(template);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  function handleAddTag() {
    const trimmedTag = tagInput.trim().toLowerCase();

    if (!trimmedTag) return;

    if (tags.length >= 5) {
      setError("Maximum 5 tags allowed");
      return;
    }

    if (tags.includes(trimmedTag)) {
      setError("Tag already added");
      return;
    }

    if (trimmedTag.length > 20) {
      setError("Tags must be 20 characters or less");
      return;
    }

    setTags([...tags, trimmedTag]);
    setTagInput("");
    setError(null);
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  async function handleGetSuggestions() {
    if (!title.trim() || !content.trim()) {
      setError(
        "Please enter a title and content before getting AI suggestions",
      );
      return;
    }

    setIsSuggesting(true);
    setError(null);

    try {
      const result = await getPostAnalysis(title, content);
      if (result.success && result.data) {
        setSuggestions(result.data);
      }
    } catch (error) {
      log.error("Error getting AI suggestions:", error);
      setError("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleApplySuggestions() {
    if (!suggestions) return;

    // Find category ID from suggested category name
    const suggestedCat = CATEGORIES.find(
      (cat) => cat.name === suggestions.suggestedCategory,
    );
    if (suggestedCat) {
      setCategory(suggestedCat.id);
    }

    // Apply suggested tags
    setTags(suggestions.suggestedTags);
    setShowSuggestions(false);
  }

  // Template state
  const [activeTemplate, setActiveTemplate] = useState<PostTemplateId | null>(
    null,
  );

  /**
   * Apply a post template - prefills title placeholder, content, category, and tags
   * This removes the "blank page" friction that stops many users from posting
   */
  function handleApplyTemplate(template: PostTemplate) {
    // Set title with prefix if provided, otherwise use placeholder as hint
    if (template.titlePrefix) {
      setTitle(template.titlePrefix);
    }
    setContent(template.contentTemplate);
    setCategory(template.suggestedCategory as CategoryId);
    setTags(template.suggestedTags.slice(0, 5)); // Max 5 tags
    setActiveTemplate(template.id as PostTemplateId);
    setError(null);
    // Clear any previous suggestions since we're starting fresh
    setSuggestions(null);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardianFeedback(null);

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (title.length < 10) {
      setError("Title must be at least 10 characters long");
      return;
    }

    if (title.length > 200) {
      setError("Title must be 200 characters or less");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    if (content.length < 20) {
      setError("Content must be at least 20 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      // Unified Activity Orchestration (Initial Draft)
      const orchestrationResult = await trackActivity({
        type: "post_created",
        metadata: {
          contentType: "post",
          category,
          titleLength: title.length,
          contentLength: content.length,
          tagCount: tags.length,
          hasAttachments: attachments.length > 0,
        },
      });

      // Show guidance for moderate risk (non-blocking, educational)
      if (orchestrationResult.riskLevel === "moderate") {
        setGuardianFeedback({
          show: true,
          level: "moderate",
          guidance: GUARDIAN_GUIDANCE.default,
        });
        // Don't block - let user proceed but show feedback
      }

      // Block submission for high risk
      if (orchestrationResult.riskLevel === "high") {
        setError(
          orchestrationResult.riskFeedback ||
            "This post was flagged by our safety guidelines. Please review and try again.",
        );
        setIsSubmitting(false);
        return;
      }

      const result = await createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.success && result.postId) {
        trackEvent("post_created", { category, postId: result.postId });
        router.push(`/nucleus/community/circles/post/${result.postId}`);
      } else {
        setError(result.error || "Failed to create post");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      log.error("Post creation error:", err);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Guardian Feedback - Non-punitive guidance for moderate risk */}
      {guardianFeedback?.show && guardianFeedback.level === "moderate" && (
        <Alert className="border-gold/50 bg-gold/5">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-gold/20 mt-0.5">
              <Shield className="h-4 w-4 text-gold" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-gold font-semibold flex items-center gap-2">
                {guardianFeedback.guidance.title}
                <Badge
                  variant="outline"
                  className="text-[10px] border-gold/30 text-gold"
                >
                  Guardian Protocol
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm text-slate-light/80">
                  Your post is ready to publish. Here are some suggestions to
                  make it even better:
                </p>
                <ul className="space-y-1.5">
                  {guardianFeedback.guidance.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-dim"
                    >
                      <Lightbulb className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-dim/70 mt-3 italic">
                  These are suggestions to help you succeed in the community.
                  Your post will still be published.
                </p>
              </AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setGuardianFeedback(null)}
                className="mt-2 text-gold/70 hover:text-gold hover:bg-gold/10"
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Template Selector - Reduces blank page friction */}
      <Card className="holographic-card border-dashed border-cyan/30 bg-gradient-to-br from-cyan/5 to-transparent">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-cyan">📝</span>
            Quick Start Templates
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose a template to kickstart your post with a proven structure
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <InlineTemplateSelector
            currentTemplate={activeTemplate}
            onTemplateChange={handleApplyTemplate}
          />
        </CardContent>
      </Card>

      {/* Title */}
      <Card className="holographic-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Post Title</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose a clear, descriptive title for your post
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Input
            placeholder="What's your post about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={200}
            className="text-base sm:text-lg"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {title.length}/200 characters
          </p>
        </CardContent>
      </Card>

      {/* Category */}
      <Card className="holographic-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Category</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose the most relevant category for your post
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as CategoryId)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="holographic-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Tags (Optional)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Add up to 5 tags to help others find your post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              disabled={isSubmitting || tags.length >= 5}
              maxLength={20}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              disabled={isSubmitting || !tagInput.trim() || tags.length >= 5}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-sm py-1 px-3"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSubmitting}
                    className="ml-2 hover:text-destructive"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {tags.length}/5 tags added
          </p>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="holographic-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Content</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Write your post content using Markdown formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content here..."
            disabled={isSubmitting}
            minHeight={300}
          />

          {/* AI Suggestion Button */}
          <Button
            type="button"
            onClick={handleGetSuggestions}
            disabled={isSuggesting || !title.trim() || !content.trim()}
            variant="outline"
            className="w-full sm:w-auto border-primary/50 hover:bg-primary/10"
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

      {/* Attachments */}
      <Card className="holographic-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments (Optional)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Add files to your post - images, documents, spreadsheets, or PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {user?.uid ? (
            <PostAttachments
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              userId={user.uid}
              disabled={isSubmitting}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Please sign in to add attachments
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg sm:text-xl">
                  AI Suggestions
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="text-muted-foreground hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {/* Similar Post Warning */}
            {suggestions.similarPostWarning && (
              <Alert
                variant="default"
                className="border-yellow-500/50 bg-yellow-500/10"
              >
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  <strong className="font-semibold">
                    Similar Post May Exist
                  </strong>
                  <p className="mt-1 text-sm">
                    {suggestions.similarPostWarning}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Post Type & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold block">Post Type</Label>
                <Badge
                  variant="secondary"
                  className="text-sm py-1.5 px-3 capitalize w-full justify-center md:w-auto"
                >
                  <Info className="h-3 w-3 mr-1.5" />
                  {suggestions.postType}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold block">
                  Urgency Level
                </Label>
                <Badge
                  variant={
                    suggestions.urgency === "high"
                      ? "destructive"
                      : suggestions.urgency === "medium"
                        ? "default"
                        : "secondary"
                  }
                  className="text-sm py-1.5 px-3 capitalize w-full justify-center md:w-auto"
                >
                  {suggestions.urgency === "high" && "🔴"}
                  {suggestions.urgency === "medium" && "🟡"}
                  {suggestions.urgency === "low" && "🟢"}
                  <span className="ml-1.5">{suggestions.urgency}</span>
                </Badge>
              </div>
            </div>

            {/* Suggested Category */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Suggested Category
              </Label>
              <div className="px-3 py-2 bg-muted border border-primary/30 rounded-md">
                {
                  CATEGORIES.find(
                    (cat) => cat.name === suggestions.suggestedCategory,
                  )?.icon
                }{" "}
                {suggestions.suggestedCategory}
              </div>
            </div>

            {/* Suggested Tags */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Suggested Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-sm py-1 px-3"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            {suggestions.improvementSuggestions && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Improvement Suggestions
                </Label>
                <Alert
                  variant="default"
                  className="border-blue-500/50 bg-blue-500/10"
                >
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm text-muted-foreground">
                    {suggestions.improvementSuggestions}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Apply Button */}
            <Button
              type="button"
              onClick={handleApplySuggestions}
              className="w-full circuit-button"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Category & Tags
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (hasUnsavedChanges()) {
              if (
                window.confirm(
                  "You have unsaved changes. Are you sure you want to leave?",
                )
              ) {
                router.back();
              }
            } else {
              router.back();
            }
          }}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="circuit-button w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Post...
            </>
          ) : (
            "Create Post"
          )}
        </Button>
      </div>
    </form>
  );
}

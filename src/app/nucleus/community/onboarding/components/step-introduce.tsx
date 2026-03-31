'use client';

/**
 * Step 4: Introduce Yourself
 *
 * Prompts the user to create their first post introducing themselves
 * to the community. This is an optional but recommended step.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOnboarding } from '../onboarding-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  ArrowRight,
  Loader2,
  SkipForward,
  Lightbulb,
} from 'lucide-react';
import { createPost } from '../../actions/posts/crud';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('onboarding/step-introduce');

const introSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be under 200 characters'),
  content: z
    .string()
    .min(50, 'Share a bit more about yourself (at least 50 characters)')
    .max(2000, 'Content must be under 2000 characters'),
});

type IntroFormData = z.infer<typeof introSchema>;

// Intro prompts to help users get started
const INTRO_PROMPTS = [
  "What's your background and what brings you to the AlgoVigilance network?",
  "What aspects of drug safety are you most interested in?",
  "What do you hope to learn or contribute here?",
];

export function StepIntroduce() {
  const { completeStep, skipStep, startStep, journey } = useOnboarding();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const form = useForm<IntroFormData>({
    resolver: zodResolver(introSchema),
    defaultValues: {
      title: 'Hello! Introducing myself to the community',
      content: '',
    },
  });

  useEffect(() => {
    startStep('introduce');
  }, [startStep]);

  // Get the Circle name the user joined for personalization
  const circleName = journey?.capturedData?.firstCircleName;

  async function onSubmit(data: IntroFormData) {
    setIsSubmitting(true);
    try {
      // Create introduction post in the general category
      const result = await createPost({
        title: data.title,
        content: data.content,
        category: 'general',
        tags: ['introduction', 'new-member'],
      });

      if (result.success && result.postId) {
        // Complete the journey step
        await completeStep('introduce', {
          postId: result.postId,
          postTitle: data.title,
        });

        toast({
          title: '🎉 Introduction Posted!',
          description: 'The community can now see your introduction.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error ?? 'Failed to create post',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Introduction submission error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setIsSkipping(true);
    try {
      await skipStep('introduce');
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-4">
          <MessageSquare className="h-8 w-8 text-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Introduce Yourself
        </h2>
        <p className="text-cyan-soft/70 max-w-md mx-auto">
          Let the community know who you are. First impressions matter!
          {circleName && (
            <span className="block mt-1 text-cyan-soft">
              Your intro will be visible to members of {circleName}.
            </span>
          )}
        </p>
      </div>

      {/* Writing prompts */}
      <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gold mb-2">
              Not sure what to write? Try answering:
            </p>
            <ul className="text-sm text-cyan-soft/80 space-y-1">
              {INTRO_PROMPTS.map((prompt, i) => (
                <li key={i}>• {prompt}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-cyan-soft">Post Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Hello! Introducing myself..."
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-slate-dim/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-cyan-soft">Your Introduction</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share a bit about yourself, your background, and what you hope to get from this community..."
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-slate-dim/50 min-h-[150px] resize-none"
                    maxLength={2000}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-slate-dim/70 flex justify-between">
                  <span>Minimum 50 characters</span>
                  <span>{field.value?.length ?? 0}/2000</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSkipping || isSubmitting}
              className="text-slate-dim hover:text-cyan-soft"
            >
              {isSkipping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SkipForward className="mr-2 h-4 w-4" />
              )}
              Skip for now
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="bg-cyan hover:bg-cyan-dark text-nex-deep font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post Introduction
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

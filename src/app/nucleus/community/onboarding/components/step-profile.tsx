'use client';

/**
 * Step 1: Profile Completion
 *
 * Collects essential professional information:
 * - Display name
 * - Professional title
 * - Brief bio
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { updateUserProfile } from '@/lib/actions/users';
import { logger } from '@/lib/logger';

const log = logger.scope('onboarding/step-profile');

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  professionalTitle: z.string().max(100).optional(),
  bio: z.string().max(300).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function StepProfile() {
  const { user } = useAuth();
  const { completeStep, startStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName ?? '',
      professionalTitle: '',
      bio: '',
    },
  });

  // Mark step as started on mount
  useEffect(() => {
    startStep('profile');
  }, [startStep]);

  // Pre-fill from user data if available
  useEffect(() => {
    if (user?.displayName) {
      form.setValue('name', user.displayName);
    }
  }, [user?.displayName, form]);

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Update user profile (callerId first, then data object)
      const result = await updateUserProfile(user.uid, {
        name: data.name,
        professionalTitle: data.professionalTitle || undefined,
        bio: data.bio || undefined,
      });

      if (result.success) {
        // Complete the step
        await completeStep('profile', {
          name: data.name,
          hasTitle: !!data.professionalTitle,
          hasBio: !!data.bio,
        });
      } else {
        log.error('Failed to update profile:', result.message);
      }
    } catch (error) {
      log.error('Profile submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const initials = (form.watch('name') || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-4">
          <User className="h-8 w-8 text-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Let's Set Up Your Profile
        </h2>
        <p className="text-cyan-soft/70 max-w-md mx-auto">
          Help the community get to know you. This information will be visible
          on your public profile.
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <Avatar className="h-20 w-20 border-2 border-cyan/30">
          <AvatarImage src={user?.photoURL ?? undefined} alt="Profile" />
          <AvatarFallback className="bg-nex-light text-cyan text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-cyan-soft">
                  Display Name <span className="text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dr. Jane Smith"
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-slate-dim/50"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-slate-dim/70">
                  How you want to be known in the community
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="professionalTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-cyan-soft">
                  Professional Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Senior Vigilance Specialist"
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-slate-dim/50"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-slate-dim/70">
                  Your current role or area of expertise
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-cyan-soft">Short Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit about yourself and what you're looking for..."
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-slate-dim/50 min-h-[100px] resize-none"
                    maxLength={300}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-slate-dim/70 flex justify-between">
                  <span>A brief introduction (optional)</span>
                  <span>{field.value?.length ?? 0}/300</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="w-full bg-cyan hover:bg-cyan-dark text-nex-deep font-semibold h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

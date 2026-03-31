'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WaitlistSchema, type WaitlistFormData } from '@/lib/schemas/waitlist';
import { joinWaitlist } from '@/app/actions/waitlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function WaitlistForm() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(WaitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setFormState('loading');
    setErrorMessage('');

    try {
      const result = await joinWaitlist(data, 'membership_page', {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      });

      if (result.success) {
        setFormState('success');
        reset();
      } else {
        setFormState('error');
        setErrorMessage(result.message);
      }
    } catch (error) {
      setFormState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    }
  };

  if (formState === 'success') {
    return (
      <div role="status" className="flex flex-col items-center gap-3 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
        <p className="text-center text-emerald-300 font-medium">
          You&apos;re on the list!
        </p>
        <p className="text-center text-sm text-slate-dim">
          We&apos;ll notify you when we launch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            id="waitlist-email"
            type="email"
            placeholder="your@email.com"
            className="h-12 bg-nex-surface border-nex-light text-white placeholder:text-slate-dim/50"
            disabled={formState === 'loading'}
            required
            autoComplete="email"
            aria-label="Email address to join the founding member waitlist"
            aria-required="true"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'waitlist-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="waitlist-email-error" role="alert" className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={formState === 'loading'}
          aria-busy={formState === 'loading'}
          aria-disabled={formState === 'loading'}
          className="h-12 px-6 bg-gold hover:bg-gold-bright text-nex-deep font-semibold touch-target"
        >
          {formState === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Joining...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>

      {formState === 'error' && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-red-300">{errorMessage}</p>
        </div>
      )}
    </form>
  );
}

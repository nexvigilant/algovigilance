'use client';

import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Honeypot } from '@/components/security/honeypot';
import { useNewsletterForm } from '@/hooks/use-newsletter-form';

interface Props {
  /** Variant for different display contexts */
  variant?: 'inline' | 'card';
  /** Additional class names */
  className?: string;
}

/**
 * Newsletter signup form for Signal in the Static
 */
export function NewsletterSignup({ variant = 'card', className }: Props) {
  const {
    email,
    setEmail,
    status,
    message,
    handleSubmit,
    onBotDetected,
  } = useNewsletterForm({ source: 'intelligence_hub' });

  if (variant === 'inline') {
    const isLoading = status === 'loading';
    const isDisabled = isLoading || status === 'success' || !email;

    return (
      <form onSubmit={handleSubmit} method="POST" className={cn('flex gap-2', className)}>
        <Honeypot fieldName="newsletter_url" onBotDetected={onBotDetected} />
        <label htmlFor="newsletter-inline-email" className="sr-only">
          Email address for weekly briefing
        </label>
        <Input
          id="newsletter-inline-email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          required
          aria-required="true"
          autoComplete="email"
          aria-label="Email address for newsletter"
          className="flex-1 bg-nex-background border-nex-light"
        />
        <Button
          type="submit"
          disabled={isDisabled}
          aria-busy={isLoading}
          aria-disabled={isDisabled}
          className="bg-cyan hover:bg-cyan/90 text-nex-background touch-target"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : status === 'success' ? (
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
          ) : (
            'Intel Signals'
          )}
        </Button>
      </form>
    );
  }

  return (
    <div
      className={cn(
        'relative p-8 rounded-xl bg-gradient-to-br from-nex-surface to-nex-background',
        'border border-cyan/20',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,206,209,0.05),transparent_50%)]" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-cyan/10 text-cyan">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-headline text-xl text-white">Signal in the Static</h3>
            <p className="text-sm text-cyan-soft">The Weekly Update</p>
          </div>
        </div>

        <p className="text-slate-light mb-6">
          Safety intelligence, regulatory updates, and signal detection alerts — delivered weekly.
        </p>

        {status === 'success' ? (
          <div role="status" className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} method="POST" className="space-y-3">
            <Honeypot fieldName="newsletter_card_url" onBotDetected={onBotDetected} />
            <label htmlFor="newsletter-card-email" className="sr-only">
              Email address for weekly briefing
            </label>
            <Input
              id="newsletter-card-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
              aria-required="true"
              autoComplete="email"
              aria-label="Email address for newsletter"
              aria-invalid={status === 'error' ? 'true' : undefined}
              aria-describedby={status === 'error' ? 'newsletter-card-error' : undefined}
              className="bg-nex-background border-nex-light"
            />
            <Button
              type="submit"
              disabled={status === 'loading' || !email}
              aria-busy={status === 'loading'}
              aria-disabled={status === 'loading' || !email}
              className="w-full bg-cyan hover:bg-cyan/90 text-nex-background font-semibold touch-target"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Activating...
                </>
              ) : (
                'Intel Signals'
              )}
            </Button>
            {status === 'error' && (
              <p id="newsletter-card-error" role="alert" className="text-sm text-red-400">{message}</p>
            )}
            <p className="text-xs text-slate-dim text-center">
              No spam. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

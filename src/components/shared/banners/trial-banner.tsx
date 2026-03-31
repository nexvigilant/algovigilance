'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTrialData } from '@/hooks/use-trial-data';

export function TrialBanner() {
  const { trialData, daysRemaining, hoursRemaining, isExpiringSoon, loading } = useTrialData();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('trial_banner_dismissed') === 'true';
    }
    return false;
  });

  if (loading || !trialData?.isInTrial || isDismissed) {
    return null;
  }

  return (
    <Alert
      className={cn(
        'mb-6',
        isExpiringSoon
          ? 'bg-orange-500/10 border-orange-500/50'
          : 'bg-gradient-to-r from-cyan/10 to-nex-gold-400/10 border-cyan/50'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {isExpiringSoon ? (
            <Clock className="h-5 w-5 text-orange-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-cyan" />
          )}
        </div>

        <div className="flex-1">
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong className="text-base">
                  {isExpiringSoon ? 'Trial Ending Soon!' : 'Free Trial Active'}
                </strong>
                <p className="mt-1">
                  {daysRemaining > 0 ? (
                    <>
                      You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> and{' '}
                      <strong>{hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''}</strong> remaining in your free trial.
                    </>
                  ) : hoursRemaining > 0 ? (
                    <>
                      You have <strong>{hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''}</strong> remaining in your free trial.
                    </>
                  ) : (
                    <>Your trial is ending soon. Subscribe now to keep your access!</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <Button asChild size="sm" variant={isExpiringSoon ? 'default' : 'outline'}>
                  <Link href="/auth/signup">Subscribe Now</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/auth/signup">View Plans</Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </div>

        <button
          onClick={() => {
            setIsDismissed(true);
            localStorage.setItem('trial_banner_dismissed', 'true');
          }}
          className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss trial banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </Alert>
  );
}

'use client';

import { useEffect } from 'react';
import { EXTERNAL_LINKS } from '@/data/consulting';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScheduleRedirect() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = EXTERNAL_LINKS.calendar;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan/10">
          <CalendarDays className="h-8 w-8 text-cyan" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-headline font-bold text-white mb-3">
          Opening Calendar
        </h1>
        <p className="text-slate-dim mb-6">
          You&apos;re being redirected to our booking calendar to schedule your discovery session.
        </p>
        <div className="mb-6">
          <div className="h-1 w-48 mx-auto rounded-full bg-cyan/30 animate-pulse" />
        </div>
        <Button
          asChild
          variant="outline"
          className="border-cyan/30 text-cyan hover:bg-cyan/10"
        >
          <a href={EXTERNAL_LINKS.calendar} rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Open Calendar Now
          </a>
        </Button>
      </div>
    </div>
  );
}

'use client';

/**
 * Service Discovery Wizard - Booking Screen
 *
 * Final step that recaps the user's situation and provides booking link.
 * Links to external Google Calendar booking page.
 */

import { ArrowLeft, Calendar, ExternalLink, RotateCcw, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WizardRecommendations } from '@/types/service-wizard';
import { serviceInfo } from '@/data/service-outcomes';
import { getBookingMessage } from '@/data/service-outcomes';
import { getBookingProtocol } from '@/data/booking-config';

interface WizardBookingProps {
  recommendations: WizardRecommendations;
  maturityScore: number;
  onBack: () => void;
  onStartOver: () => void;
}

export function WizardBooking({
  recommendations,
  maturityScore,
  onBack,
  onStartOver,
}: WizardBookingProps) {
  const bookingProtocol = getBookingProtocol(maturityScore);
  const { primary, situationSummary } = recommendations;
  const primaryService = serviceInfo[primary.category];

  // Get personalized booking message based on user's tags
  const bookingMessage = getBookingMessage(
    recommendations.situationSummary.includes('challenge')
      ? ['challenge-focused']
      : recommendations.situationSummary.includes('opportunity')
      ? ['opportunity-focused']
      : ['exploration-focused']
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 text-slate-dim hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recommendations
      </Button>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/30 mb-6">
          <Calendar className="h-8 w-8 text-cyan" />
        </div>

        <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-4">
          {bookingMessage}
        </h2>

        <p className="text-slate-dim text-lg">{situationSummary}</p>
      </div>

      {/* Booking Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-nex-surface border border-nex-light mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">
          Complimentary Discovery Call
        </h3>

        <p className="text-slate-dim mb-6">
          A 30-minute conversation to understand your situation and explore how
          we can help. No obligation—you'll walk away with actionable insights
          regardless of whether we work together.
        </p>

        {/* What to Expect */}
        <div className="space-y-3 mb-6">
          <ExpectationItem
            icon={Clock}
            text="30 minutes, no longer"
          />
          <ExpectationItem
            icon={Video}
            text="Video call (Google Meet or Zoom)"
          />
        </div>

        {/* Booking Button */}
        <a
          href={bookingProtocol.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-xl bg-cyan hover:bg-cyan-glow text-nex-deep font-semibold text-lg transition-colors"
        >
          <Calendar className="h-5 w-5" />
          Schedule on Google Calendar
          <ExternalLink className="h-4 w-4 ml-1" />
        </a>

        <p className="text-center text-sm text-slate-dim mt-4">
          Opens Google Calendar in a new tab
        </p>
      </div>

      {/* Recap */}
      <div className="p-5 rounded-xl bg-nex-surface/30 border border-nex-light mb-8">
        <h4 className="text-sm font-semibold text-slate-dim uppercase tracking-wider mb-3">
          Based on Your Responses
        </h4>
        <p className="text-white">
          We'll focus on <span className="text-cyan font-medium">{primaryService.title}</span>:{' '}
          <span className="text-slate-dim">{primaryService.tagline}</span>
        </p>
      </div>

      {/* Alternative Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <Button
          variant="ghost"
          onClick={onStartOver}
          className="text-slate-dim hover:text-white"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>

      {/* Trust Footer */}
      <div className="mt-10 pt-6 border-t border-nex-light text-center">
        <p className="text-sm text-slate-dim">
          Your information stays confidential. We never share your data with third parties.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ExpectationItemProps {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

function ExpectationItem({ icon: Icon, text }: ExpectationItemProps) {
  return (
    <div className="flex items-center gap-3 text-slate-dim">
      <Icon className="h-5 w-5 text-cyan" />
      <span>{text}</span>
    </div>
  );
}

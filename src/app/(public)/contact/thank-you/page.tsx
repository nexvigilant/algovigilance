import Link from 'next/link';
import { CheckCircle2, ArrowRight, Users, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createMetadata } from '@/lib/metadata';
import { CONTACT_ROUTES } from '@/data/contact-forms';
import { THANK_YOU_HERO, NEXT_STEP_CARDS } from '@/data/thank-you-content';

export const metadata = createMetadata({
  title: 'Message Received',
  description:
    'Thank you for contacting AlgoVigilance. Our team will review your message and respond within 24-48 hours.',
  path: '/contact/thank-you',
});

/**
 * Thank You Page
 *
 * Displayed after successful form submission.
 * Provides stronger closure signal and conversion opportunities.
 */
export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-400" aria-hidden="true" />
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6">
              {THANK_YOU_HERO.title} <span className="text-cyan">{THANK_YOU_HERO.titleHighlight}</span>
            </h1>

            <p className="text-xl text-slate-light mb-4">
              {THANK_YOU_HERO.subtitle}
            </p>

            <p className="text-lg text-slate-dim mb-12">
              Expect a response within{' '}
              <span className="text-cyan font-semibold">{THANK_YOU_HERO.responseTime}</span>.
              {THANK_YOU_HERO.responseDescription}
            </p>

            {/* Next Steps Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {NEXT_STEP_CARDS.map((card) => {
                const iconMap = { calendar: Calendar, users: Users, book: BookOpen };
                const Icon = iconMap[card.icon];
                const href = card.ctaHref === '__SCHEDULE__' ? CONTACT_ROUTES.schedule : card.ctaHref;

                return (
                  <Card key={card.title} className={card.cardClass}>
                    <CardContent className="pt-6 text-center">
                      <Icon className={card.iconClass} aria-hidden="true" />
                      <h3 className="font-semibold text-white text-sm mb-2">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-dim mb-4">
                        {card.description}
                      </p>
                      <Button asChild size="sm" variant="outline" className={card.buttonClass}>
                        <Link href={href}>
                          {card.ctaText}
                          <ArrowRight className="ml-2 h-3 w-3" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Return Link */}
            <Button asChild variant="ghost" className="text-slate-dim hover:text-white">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ArrowRight } from 'lucide-react';
import type { ReleaseStatus } from '@/data/launch-timeline';

interface ComingSoonProps {
  title: string;
  description: string;
  /** Use RELEASE_STATUS constants from @/data/launch-timeline for consistency */
  launchTimeline: ReleaseStatus | string;
  features: string[];
  learnMoreLink?: string;
  waitlistTitle?: string;
  waitlistBody?: string;
}

export function ComingSoon({
  title,
  description,
  launchTimeline,
  features,
  learnMoreLink = '/about',
  waitlistTitle = 'Be First to Know',
  waitlistBody,
}: ComingSoonProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto holographic-card border-nex-light bg-nex-surface">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-nex-dark text-cyan border border-cyan/30">
              <CalendarClock className="mr-2 h-4 w-4" aria-hidden="true" />
              {launchTimeline}
            </Badge>
          </div>
          {/* Using H2 for proper heading hierarchy (H1 is page title) */}
          <h2 className="text-3xl md:text-4xl font-headline text-gold font-semibold leading-none tracking-tight">
            {title}
          </h2>
          <CardDescription className="text-lg mt-4 text-slate-dim">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div>
            <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-2">Capability Roadmap</p>
            <h3 className="text-xl font-semibold mb-4 text-slate-light uppercase tracking-wide">Planned Features</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-cyan flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-slate-dim">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-nex-light">
            <p className="text-lg font-mono uppercase tracking-widest text-gold/60 mb-2">Access Protocol</p>
            <h3 className="text-lg font-semibold mb-4 text-slate-light uppercase tracking-wide">{waitlistTitle}</h3>
            {waitlistBody ? (
              <p className="text-slate-dim mb-6">{waitlistBody}</p>
            ) : (
              <p className="text-slate-dim mb-6">
                This service is part of our phased roadmap. Our current focus is building{' '}
                <Link href="/auth/signup" className="text-cyan hover:underline font-semibold">
                  AlgoVigilance Community™
                </Link>
                , which provides the foundation and funding for all platform services.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-cyan text-nex-deep hover:bg-cyan-glow touch-target">
                <Link href="/auth/signup">Join the Community</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-nex-light text-slate-dim hover:text-slate-light hover:border-gold/50 touch-target">
                <Link href={learnMoreLink}>
                  Learn More About Our Mission
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

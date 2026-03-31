import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ArrowRight } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  launchTimeline: string;
  features: string[];
  learnMoreLink?: string;
}

export function ComingSoon({
  title,
  description,
  launchTimeline,
  features,
  learnMoreLink = '/doctrine',
}: ComingSoonProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto bg-card/60 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <CalendarClock className="mr-2 h-4 w-4" />
              Launching {launchTimeline}
            </Badge>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-headline">
            {title}
          </CardTitle>
          <CardDescription className="text-lg mt-4">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Planned Features</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Be First to Know</h3>
            <p className="text-muted-foreground mb-6">
              This service is part of our phased roadmap. Our current focus is building{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
                AlgoVigilance Community™
              </Link>
              , which provides the foundation and funding for all ecosystem services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/auth/signup">Join the Community</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={learnMoreLink}>
                  Learn More About Our Mission
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Want to stay updated? Follow our progress by joining the Community or checking our{' '}
              <Link href="/doctrine" className="text-primary hover:underline">
                Doctrine
              </Link>{' '}
              for detailed roadmap timelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

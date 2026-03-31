import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { NewsletterSignup } from '@/components/intelligence';
import { SERIES_CONFIG } from '@/lib/config/series';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Content Series',
  description:
    'Curated content series exploring critical topics in pharmaceutical safety, regulatory affairs, and professional development.',
  path: '/intelligence/series',
});

export default function SeriesIndexPage() {
  const allSeries = Object.values(SERIES_CONFIG);

  // Calculate total pieces for each series
  const seriesWithCounts = allSeries.map((series) => {
    const totalPieces = series.sections.reduce(
      (acc, section) => acc + section.slugs.length,
      0
    );
    return { ...series, totalPieces };
  });

  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Back link */}
        <Link
          href="/intelligence"
          className="inline-flex items-center text-slate-dim hover:text-cyan transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Intelligence
        </Link>

        {/* Header */}
        <header className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan/20">
              <BookOpen className="h-6 w-6 text-cyan" />
            </div>
            <Badge variant="outline" className="text-cyan border-cyan/30">
              {allSeries.length} {allSeries.length === 1 ? 'Series' : 'Series'} Available
            </Badge>
          </div>

          <h1 className="font-headline text-4xl md:text-5xl text-white mb-4">
            Content Series
          </h1>

          <p className="text-xl text-slate-light">
            Deep dives into critical topics, organized for comprehensive understanding.
            Each series brings together signals, field notes, perspectives, and
            publications into a cohesive narrative.
          </p>
        </header>

        {/* Series Grid */}
        <div className="space-y-8 mb-16">
          {seriesWithCounts.map((series) => (
            <Link
              key={series.slug}
              href={`/intelligence/series/${series.slug}`}
              className="group block rounded-xl overflow-hidden border border-nex-light hover:border-cyan/40 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative w-full md:w-80 h-48 md:h-auto flex-shrink-0">
                  <Image
                    src={series.heroImage}
                    alt={series.heroImageAlt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-nex-surface/80 md:block hidden" />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 bg-nex-surface">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className="text-cyan border-cyan/30 bg-cyan/10"
                    >
                      {series.totalPieces} pieces
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-slate-dim border-slate-600"
                    >
                      {series.sections.length} sections
                    </Badge>
                  </div>

                  <h2 className="font-headline text-2xl text-white mb-2 group-hover:text-cyan transition-colors">
                    {series.title}
                  </h2>

                  <p className="text-gold font-medium mb-3">{series.subtitle}</p>

                  <p className="text-slate-light text-sm line-clamp-2 mb-4">
                    {series.description}
                  </p>

                  {/* Section previews */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {series.sections.map((section) => (
                      <span
                        key={section.title}
                        className="text-xs px-2 py-1 rounded bg-nex-dark text-slate-dim"
                      >
                        {section.title}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-cyan group-hover:text-cyan-glow transition-colors">
                    <span className="text-sm font-medium">Explore series</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state for when no series exist */}
        {allSeries.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-cyan/30 mx-auto mb-6" />
            <h2 className="font-headline text-2xl text-white mb-4">
              Series Coming Soon
            </h2>
            <p className="text-slate-light max-w-md mx-auto">
              We're preparing comprehensive content series on critical topics in
              pharmaceutical safety and professional development.
            </p>
          </div>
        )}

        {/* CTA for suggesting series */}
        <section className="max-w-2xl mx-auto mb-16 p-6 rounded-xl bg-nex-surface border border-nex-light text-center">
          <h3 className="font-headline text-xl text-white mb-2">
            Have a topic you'd like us to cover?
          </h3>
          <p className="text-slate-dim mb-4">
            We're always looking for important topics to explore in depth.
          </p>
          <Link
            href="/contact?ref=series-suggestion"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors"
          >
            Suggest a series topic
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* Newsletter */}
        <section className="max-w-2xl mx-auto">
          <NewsletterSignup />
        </section>
      </div>
    </div>
  );
}

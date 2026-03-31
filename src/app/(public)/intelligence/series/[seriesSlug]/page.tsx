import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, FileText, Lightbulb, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ContentCard, NewsletterSignup, SeriesProgress } from '@/components/intelligence';
import { getContentBySlugHybrid, toCardProps } from '@/lib/intelligence';
import type { ContentItem } from '@/types/intelligence';
import { SERIES_CONFIG, getAllSeriesKeys, type SeriesConfig } from '@/lib/config/series';

const SECTION_ICONS = {
  signal: AlertTriangle,
  'field-note': FileText,
  perspective: Lightbulb,
  publication: BookOpen,
};

interface PageProps {
  params: Promise<{ seriesSlug: string }>;
}

/** Generate static paths for all series */
export async function generateStaticParams() {
  return getAllSeriesKeys().map((slug) => ({ seriesSlug: slug }));
}

/** Generate metadata for SEO */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { seriesSlug } = await params;
  const series = SERIES_CONFIG[seriesSlug];

  if (!series) {
    return {
      title: 'Series Not Found — Intelligence',
    };
  }

  return {
    title: `${series.title} — Intelligence`,
    description: series.description,
    openGraph: {
      title: `${series.title} - ${series.subtitle}`,
      description: series.description,
      url: `https://algovigilance.com/intelligence/series/${series.slug}`,
      siteName: 'AlgoVigilance',
      type: 'website',
      images: [series.heroImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: series.title,
      description: series.description,
      images: [series.heroImage],
    },
  };
}

export default async function SeriesPage({ params }: PageProps) {
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- seriesSlug from params required before config lookup
  const { seriesSlug } = await params;
  const series = SERIES_CONFIG[seriesSlug];

  if (!series) {
    notFound();
  }

  // Fetch all content for this series (using hybrid function)
  const sectionContent: { section: SeriesConfig['sections'][0]; items: ContentItem[] }[] =
    await Promise.all(
      series.sections.map(async (section) => {
        const items = await Promise.all(
          section.slugs.map((slug) => getContentBySlugHybrid(slug))
        );
        return {
          section,
          items: items.filter((item): item is ContentItem => item !== null),
        };
      })
    );

  const totalPieces = sectionContent.reduce((acc, { items }) => acc + items.length, 0);

  return (
    <div className="min-h-screen bg-nex-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={series.heroImage}
            alt={series.heroImageAlt}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-nex-background/50 via-nex-background/80 to-nex-background" />
        </div>

        <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20">
          {/* Back link */}
          <Link
            href="/intelligence"
            className="inline-flex items-center text-slate-dim hover:text-cyan transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Intelligence
          </Link>

          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-cyan border-cyan/30">
              Content Series • {totalPieces} pieces
            </Badge>

            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white mb-4" style={{ lineHeight: 1.15 }}>
              {series.title}
            </h1>

            <p className="text-xl md:text-2xl text-gold font-medium mb-6">{series.subtitle}</p>

            <p className="text-lg text-slate-light leading-relaxed">{series.description}</p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12 md:px-6">
        {/* Progress Tracker (for authenticated users) */}
        <SeriesProgress
          seriesSlug={seriesSlug}
          totalArticles={totalPieces}
          className="mb-8"
        />

        <div className="space-y-16">
          {sectionContent.map(({ section, items }, index) => {
            const Icon = SECTION_ICONS[section.icon];
            const isPublication = section.icon === 'publication';

            return (
              <section key={section.title}>
                {/* Section Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-cyan/10 text-cyan">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl text-white">{section.title}</h2>
                    <p className="text-slate-dim mt-1">{section.description}</p>
                  </div>
                </div>

                {/* Content Grid */}
                {items.length > 0 ? (
                  <div
                    className={
                      isPublication
                        ? 'space-y-4'
                        : section.icon === 'perspective'
                          ? 'grid gap-6 md:grid-cols-2'
                          : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
                    }
                  >
                    {items.map((item) => (
                      <ContentCard
                        key={item.meta.slug}
                        {...toCardProps(item)}
                        variant={isPublication ? 'featured' : 'default'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-lg border border-nex-light bg-nex-surface/50 text-center">
                    <p className="text-slate-dim">Content coming soon</p>
                  </div>
                )}

                {/* Divider (except for last section) */}
                {index < sectionContent.length - 1 && (
                  <div className="mt-12 border-t border-nex-light" />
                )}
              </section>
            );
          })}
        </div>

        {/* Sources Section */}
        <section className="mt-16 pt-12 border-t border-nex-light">
          <h2 className="font-headline text-2xl text-white mb-6">Primary Sources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {series.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-lg border border-nex-light bg-nex-surface/50 hover:border-cyan/30 transition-colors"
              >
                <p className="font-medium text-white group-hover:text-cyan transition-colors">
                  {source.title}
                </p>
                <p className="text-sm text-slate-dim mt-1 truncate">{source.url}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 p-8 rounded-xl bg-gradient-to-br from-cyan/10 to-nex-surface border border-cyan/20">
          <div className="max-w-2xl">
            <h2 className="font-headline text-2xl text-white mb-3">{series.cta.title}</h2>
            <p className="text-slate-light mb-6">{series.cta.description}</p>
            <Link
              href={series.cta.href}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-cyan text-nex-background font-semibold hover:bg-cyan/90 transition-colors"
            >
              {series.cta.label}
            </Link>
          </div>
        </section>

        {/* Newsletter */}
        <section className="mt-16 max-w-2xl mx-auto">
          <NewsletterSignup />
        </section>
      </div>
    </div>
  );
}

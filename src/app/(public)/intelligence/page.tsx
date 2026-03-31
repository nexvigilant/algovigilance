import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Radio, Check, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing';
import {
  ContentCard,
  PodcastPlayer,
  ContentFilter,
} from '@/components/intelligence';
import {
  getAllContentHybrid,
  getFeaturedContentHybrid,
  getContentByTypeHybrid,
  toCardProps,
} from '@/lib/intelligence';
import type { PodcastMeta } from '@/types/intelligence';
import type { ContentType } from '@/types/intelligence';
import { SERIES_CONFIG } from '@/lib/config/series';
import { createMetadata } from '@/lib/metadata';
import {
  INTELLIGENCE_SECTIONS,
  PODCAST_BRANDING,
  TRENDING_SECTION,
  INTELLIGENCE_EMPTY_STATE,
} from '@/data/intelligence-sections';

export const metadata = createMetadata({
  title: 'Central Intelligence',
  description:
    'Uncompromised Vigilance. The independent nervous system for pharmaceutical oversight, signal detection, and strategic preemption.',
  path: '/intelligence',
  image: '/og-intelligence.png',
});

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function IntelligencePage({ searchParams }: PageProps) {
  // searchParams must be awaited first to determine the filter for content fetching
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits
  const params = await searchParams;
  const typeFilter = params.type as ContentType | undefined;
  const isFiltered = !!typeFilter;

  // ⚡ PERFORMANCE: Fetch ALL content in parallel using Promise.all
  // This reduces page load time from sequential (~1s) to parallel (~200ms)
  const [
    allContentRaw,
    featuredContent,
    podcasts,
    fieldNotesRaw,
    perspectivesRaw,
    signalsRaw,
    publicationsRaw,
  ] = await Promise.all([
    // Main content: either filtered or all
    typeFilter ? getContentByTypeHybrid(typeFilter) : getAllContentHybrid(),
    // Featured content for hero
    getFeaturedContentHybrid(),
    // Latest podcast
    getContentByTypeHybrid<PodcastMeta>('podcast'),
    // Magazine sections (only used when not filtered, but cheap to fetch)
    getContentByTypeHybrid('field-note'),
    getContentByTypeHybrid('perspective'),
    getContentByTypeHybrid('signal'),
    getContentByTypeHybrid('publication'),
  ]);

  // Process fetched content
  const allContent = allContentRaw;
  const latestPodcast = podcasts[0] ?? null;

  // Trending content (reuse allContent instead of fetching again)
  const trendingContent = allContentRaw
    .filter((item) => item.meta.type !== 'signal')
    .slice(0, 5);

  // Slice for magazine sections
  const fieldNotes = fieldNotesRaw.slice(0, 4);
  const perspectives = perspectivesRaw.slice(0, 4);
  const signals = signalsRaw.slice(0, 4);

  // Filter out featured content from publications to avoid duplication
  const featuredSlug = featuredContent?.meta.slug;
  const publications = publicationsRaw
    .filter((item) => item.meta.slug !== featuredSlug)
    .slice(0, 3);

  return (
    <div className="bg-nex-background min-h-screen" data-testid="intelligence-page">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <PageHero
          title="NEXVIGILANT INTELLIGENCE"
        />

        {/* Heading hierarchy bridge for accessibility */}
        <h2 className="sr-only">Browse Intelligence Content</h2>

        {/* Filter bar */}
        <Suspense
          fallback={
            <div className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />
          }
        >
          <ContentFilter activeFilter={typeFilter ?? 'all'} className="mb-8" />
        </Suspense>

        {isFiltered ? (
          /* Filtered View - Simple grid */
          <section id="intelligence-content" role="tabpanel" className="mb-16">
            {allContent.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allContent.map((item) => (
                  <ContentCard key={item.meta.slug} {...toCardProps(item)} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-slate-light">
                  No content found for this filter.
                </p>
                <Button asChild variant="outline" className="mt-4 touch-target">
                  <Link href="/intelligence">View all content</Link>
                </Button>
              </div>
            )}
          </section>
        ) : (
          /* Magazine Layout - Editorial sections */
          <div id="intelligence-content" role="tabpanel">
            {/* Hero Section - Featured + Podcast + Trending */}
            <section className="mb-16">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Featured Story - 2 columns */}
                <div className="lg:col-span-2">
                  {featuredContent ? (
                    <ContentCard
                      {...toCardProps(featuredContent)}
                      variant="featured"
                    />
                  ) : (
                    <div className="flex h-80 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06]">
                      <p className="text-slate-dim">
                        Featured content coming soon
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar - Podcast + Trending */}
                <div className="space-y-6">
                  {/* Latest Podcast Episode */}
                  {latestPodcast ? (
                    <PodcastPlayer episode={latestPodcast.meta} compact />
                  ) : (
                    <div className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-4">
                      <p className={`mb-2 text-sm font-medium ${PODCAST_BRANDING.accentColor}`}>
                        {PODCAST_BRANDING.name}
                      </p>
                      <p className="text-sm text-slate-dim">
                        {PODCAST_BRANDING.launchingMessage}
                      </p>
                    </div>
                  )}

                  {/* Trending */}
                  <div className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-4">
                    <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${TRENDING_SECTION.accentColor}`}>
                      {TRENDING_SECTION.title}
                    </h3>
                    <div className="space-y-1">
                      {trendingContent.length > 0 ? (
                        trendingContent.map((item) => (
                          <ContentCard
                            key={item.meta.slug}
                            {...toCardProps(item)}
                            variant="compact"
                          />
                        ))
                      ) : (
                        <p className="py-4 text-sm text-slate-dim">
                          Coming soon
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Featured Series */}
                  {Object.values(SERIES_CONFIG).length > 0 && (
                    <Link
                      href={`/intelligence/series/${Object.values(SERIES_CONFIG)[0].slug}`}
                      className="block rounded-lg border border-cyan/20 bg-gradient-to-br from-cyan/10 via-white/[0.04] to-white/[0.04] p-4 hover:border-cyan/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-cyan" aria-hidden="true" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan">
                          Featured Series
                        </h3>
                      </div>
                      <p className="font-semibold text-white mb-1">
                        {Object.values(SERIES_CONFIG)[0].title}
                      </p>
                      <p className="text-xs text-slate-dim line-clamp-2">
                        {Object.values(SERIES_CONFIG)[0].subtitle}
                      </p>
                      <div className="mt-3 flex items-center text-xs text-cyan group-hover:text-cyan-glow transition-colors">
                        <span>Explore series</span>
                        <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Field Intelligence - Osteology theme (slate/bone) */}
            {fieldNotes.length >= 2 && (
              <section className={`mb-16 rounded-xl border ${INTELLIGENCE_SECTIONS.fieldNotes.borderColor} ${INTELLIGENCE_SECTIONS.fieldNotes.bgGradient} p-6 -mx-2`}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-1 rounded-full ${INTELLIGENCE_SECTIONS.fieldNotes.accentBarColor}`} />
                    <h2 className="font-headline text-2xl text-white">
                      {INTELLIGENCE_SECTIONS.fieldNotes.title}
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className={`${INTELLIGENCE_SECTIONS.fieldNotes.textColor} ${INTELLIGENCE_SECTIONS.fieldNotes.hoverTextColor} touch-target`}
                  >
                    <Link href={`/intelligence?type=${INTELLIGENCE_SECTIONS.fieldNotes.filterParam}`}>
                      View all <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {fieldNotes.map((item) => (
                    <ContentCard key={item.meta.slug} {...toCardProps(item)} />
                  ))}
                </div>
              </section>
            )}

            {/* Strategic Dossiers - Neurology theme (navy/electric blue) */}
            {perspectives.length >= 2 && (
              <section className={`mb-16 rounded-xl border ${INTELLIGENCE_SECTIONS.perspectives.borderColor} ${INTELLIGENCE_SECTIONS.perspectives.bgGradient} p-6 -mx-2`}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-1 rounded-full ${INTELLIGENCE_SECTIONS.perspectives.accentBarColor}`} />
                    <h2 className="font-headline text-2xl text-white">
                      {INTELLIGENCE_SECTIONS.perspectives.title}
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className={`${INTELLIGENCE_SECTIONS.perspectives.textColor} ${INTELLIGENCE_SECTIONS.perspectives.hoverTextColor} touch-target`}
                  >
                    <Link href={`/intelligence?type=${INTELLIGENCE_SECTIONS.perspectives.filterParam}`}>
                      View all <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {perspectives.slice(0, 2).map((item) => (
                    <ContentCard key={item.meta.slug} {...toCardProps(item)} />
                  ))}
                </div>
              </section>
            )}

            {/* Intel Signals - Sensory theme (amber/gold) */}
            {signals.length >= 2 && (
              <section className={`mb-16 rounded-xl border ${INTELLIGENCE_SECTIONS.signals.borderColor} ${INTELLIGENCE_SECTIONS.signals.bgGradient} p-6 -mx-2`}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-1 rounded-full ${INTELLIGENCE_SECTIONS.signals.accentBarColor}`} />
                    <h2 className="font-headline text-2xl text-white">
                      {INTELLIGENCE_SECTIONS.signals.title}
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className={`${INTELLIGENCE_SECTIONS.signals.textColor} ${INTELLIGENCE_SECTIONS.signals.hoverTextColor} touch-target`}
                  >
                    <Link href={`/intelligence?type=${INTELLIGENCE_SECTIONS.signals.filterParam}`}>
                      View all <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {signals.map((item) => (
                    <ContentCard key={item.meta.slug} {...toCardProps(item)} />
                  ))}
                </div>
              </section>
            )}

            {/* Strategic Doctrine - Neurology theme (navy/electric blue) */}
            {publications.length > 0 && (
              <section className={`mb-16 rounded-xl border ${INTELLIGENCE_SECTIONS.publications.borderColor} ${INTELLIGENCE_SECTIONS.publications.bgGradient} p-6 -mx-2`}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-1 rounded-full ${INTELLIGENCE_SECTIONS.publications.accentBarColor}`} />
                    <h2 className="font-headline text-2xl text-white">
                      {INTELLIGENCE_SECTIONS.publications.title}
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className={`${INTELLIGENCE_SECTIONS.publications.textColor} ${INTELLIGENCE_SECTIONS.publications.hoverTextColor} touch-target`}
                  >
                    <Link href={`/intelligence?type=${INTELLIGENCE_SECTIONS.publications.filterParam}`}>
                      View all <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  {publications.map((item) => (
                    <ContentCard
                      key={item.meta.slug}
                      {...toCardProps(item)}
                      variant="featured"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State - When no content yet */}
            {allContent.length === 0 && (
              <section className="py-20 text-center">
                <div className="mx-auto max-w-md">
                  <Radio className="mx-auto mb-6 h-16 w-16 text-cyan/30" aria-hidden="true" />
                  <h2 className="mb-4 font-headline text-2xl text-white">
                    {INTELLIGENCE_EMPTY_STATE.title}
                  </h2>
                  <p className="mb-6 text-slate-light">
                    {INTELLIGENCE_EMPTY_STATE.description}
                  </p>
                  <div className="mb-8 rounded-xl border border-white/[0.12] bg-white/[0.06] p-6 text-left">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-light">
                      What to Expect
                    </h3>
                    <ul className="space-y-3">
                      {INTELLIGENCE_EMPTY_STATE.expectations.map((expectation, index) => (
                        <li key={index} className="flex items-start gap-3 text-slate-dim">
                          <div className="mt-1 rounded-full bg-cyan/10 p-1" aria-hidden="true">
                            <Check className="h-3 w-3 text-cyan" />
                          </div>
                          <span>{expectation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

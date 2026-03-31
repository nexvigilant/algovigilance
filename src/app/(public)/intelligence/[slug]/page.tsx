import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, User, Tag, FileDown, ExternalLink, BookOpen, ArrowRight } from 'lucide-react';

import { EnhancedMarkdown } from '@/components/intelligence/enhanced-markdown-v2';
import { ArticleNav } from '@/components/intelligence/article-nav';
import { extractSectionsFromMarkdown } from '@/lib/extract-sections';
import { SignalDisclaimer } from '@/components/intelligence/signal-disclaimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentCard, NewsletterSignup, PodcastPlayer, ArticleReadTracker } from '@/components/intelligence';
import {
  getContentBySlugHybrid,
  getRelatedContentHybrid,
  generateContentPathsHybrid,
  toCardProps,
} from '@/lib/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';
import type { PodcastMeta, PublicationMeta, SignalMeta } from '@/types/intelligence';
import { getSeriesForSlug, getPrevNextInSeries, getPositionInSeries } from '@/lib/config/series';
import { SeriesNavigation } from '@/components/intelligence/series-navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Generate static paths for all content */
export async function generateStaticParams() {
  return generateContentPathsHybrid();
}

/** Generate metadata for SEO */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- slug from params required before content fetch
  const { slug } = await params;
  const content = await getContentBySlugHybrid(slug);

  if (!content) {
    return {
      title: 'Not Found — Intelligence',
    };
  }

  const { meta } = content;

  return {
    title: `${meta.title} — Intelligence`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://algovigilance.com/intelligence/${meta.slug}`,
      siteName: 'AlgoVigilance',
      type: 'article',
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt,
      authors: [meta.author],
      images: meta.image ? [meta.image] : ['/og-intelligence.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: meta.image ? [meta.image] : ['/og-intelligence.png'],
    },
  };
}

export default async function ContentPage({ params }: PageProps) {
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- slug from params required before content fetch
  const { slug } = await params;
  const content = await getContentBySlugHybrid(slug);

  if (!content) {
    notFound();
  }

  const { meta, content: mdxContent } = content;

  // Extract sections for navigation
  const articleSections = extractSectionsFromMarkdown(mdxContent);
  const typeConfig = CONTENT_TYPE_CONFIG[meta.type];
  const relatedContent = await getRelatedContentHybrid(content, 3);

  const formattedDate = new Date(meta.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Check if this article is part of a series
  const series = getSeriesForSlug(slug);

  // Calculate total articles in series (for progress tracking)
  const seriesTotalArticles = series
    ? series.sections.reduce((acc, section) => acc + section.slugs.length, 0)
    : 0;

  // Get prev/next articles for series navigation
  const { prev: prevSlug, next: nextSlug } = series
    ? getPrevNextInSeries(slug, series.slug)
    : { prev: null, next: null };

  // Get position in series for indicator
  const seriesPosition = series ? getPositionInSeries(slug, series.slug) : null;

  // Type-specific rendering helpers
  const isPodcast = meta.type === 'podcast';
  const isPublication = meta.type === 'publication';
  const isSignal = meta.type === 'signal';
  const podcastMeta = isPodcast ? (meta as PodcastMeta) : null;
  const publicationMeta = isPublication ? (meta as PublicationMeta) : null;
  const signalMeta = isSignal ? (meta as SignalMeta) : null;

  return (
    <div className="min-h-screen bg-nex-background">
      {/* Article Navigation Sidebar */}
      <ArticleNav
        title={meta.title}
        sections={articleSections}
        label="In This Article"
      />

      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Back link */}
        <Link
          href="/intelligence"
          className="inline-flex items-center text-slate-dim hover:text-cyan transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Intelligence
        </Link>

        {/* Series Banner */}
        {series && (
          <>
            <Link
              href={`/intelligence/series/${series.slug}`}
              className="block mb-8 p-4 rounded-xl bg-gradient-to-r from-cyan/10 via-nex-surface to-nex-surface border border-cyan/20 hover:border-cyan/40 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan/20">
                    <BookOpen className="h-5 w-5 text-cyan" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan font-medium uppercase tracking-wide">Part of Series</p>
                    <p className="text-white font-semibold">{series.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-dim group-hover:text-cyan transition-colors">
                  <span className="text-sm hidden sm:inline">View full series</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
            {/* Auto-track reading progress for series articles */}
            <ArticleReadTracker
              seriesSlug={series.slug}
              articleSlug={slug}
              totalArticles={seriesTotalArticles}
            />
          </>
        )}

        <article className="max-w-4xl mx-auto">
          {/* Header with Frosted Glass Background */}
          <header className="mb-10 p-6 md:p-8 rounded-2xl backdrop-blur-md bg-nex-surface/60 border border-white/10 shadow-lg">
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="gap-1.5">
                {typeConfig.icon} {typeConfig.label}
              </Badge>
              {isPodcast && podcastMeta && (
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  Episode {podcastMeta.episodeNumber}
                </Badge>
              )}
              {isPublication && publicationMeta && (
                <Badge variant="outline" className="capitalize">
                  {publicationMeta.publicationType}
                </Badge>
              )}
              {isSignal && signalMeta && (
                <>
                  <Badge
                    variant="outline"
                    className={
                      signalMeta.signalStrength === 'confirmed'
                        ? 'text-red-400 border-red-500/30 bg-red-500/10'
                        : signalMeta.signalStrength === 'developing'
                          ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                          : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    }
                  >
                    {signalMeta.signalStrength.charAt(0).toUpperCase() + signalMeta.signalStrength.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-slate-400 border-slate-500/30">
                    {signalMeta.signalSource}
                  </Badge>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline text-white mb-6">
              {meta.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-slate-light mb-6">{meta.description}</p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-dim">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                AlgoVigilance Intelligence Team
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
              {meta.readingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {meta.readingTime} min {isPodcast ? '' : 'read'}
                </span>
              )}
            </div>

            {/* Tags */}
            {meta.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Tag className="h-4 w-4 text-slate-dim" />
                {meta.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-nex-surface text-slate-dim"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image - different layout for podcasts vs articles */}
          {meta.image && !isPodcast && (
            <div className="relative aspect-[2/1] mb-10 rounded-xl overflow-hidden">
              <Image
                src={meta.image}
                alt={meta.imageAlt ?? meta.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Podcast Cover Art - centered square layout */}
          {meta.image && isPodcast && (
            <div className="flex justify-center mb-10">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20">
                <Image
                  src={meta.image}
                  alt={meta.imageAlt ?? meta.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Podcast Player */}
          {isPodcast && podcastMeta && (
            <div className="mb-10">
              <PodcastPlayer episode={podcastMeta} />
            </div>
          )}

          {/* Publication Download */}
          {isPublication && publicationMeta?.pdfUrl && (
            <div className="mb-10 p-6 rounded-xl bg-nex-surface border border-nex-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Download Full Publication</p>
                  {publicationMeta.pageCount && (
                    <p className="text-sm text-slate-dim">{publicationMeta.pageCount} pages</p>
                  )}
                </div>
                <Button asChild className="bg-cyan hover:bg-cyan/90 text-nex-background touch-target">
                  <a href={publicationMeta.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Executive Summary for Publications */}
          {isPublication && publicationMeta?.executiveSummary && (
            <div className="mb-10 p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h2 className="text-lg font-semibold text-white mb-3">Executive Summary</h2>
              <p className="text-slate-light">{publicationMeta.executiveSummary}</p>
            </div>
          )}

          {/* Pull Quote for Perspectives */}
          {meta.type === 'perspective' && (meta as { pullQuote?: string }).pullQuote && (
            <blockquote className="text-2xl font-headline text-cyan border-l-4 border-cyan pl-6 my-10">
              "{(meta as { pullQuote: string }).pullQuote}"
            </blockquote>
          )}

          {/* Content Body */}
          <div className="prose prose-invert prose-cyan max-w-none">
            <EnhancedMarkdown content={mdxContent} enableAutoVisuals={true} />
          </div>

          {/* Signal Disclaimer and CTA */}
          {isSignal && signalMeta && (
            <SignalDisclaimer
              signalStrength={signalMeta.signalStrength}
              validationStatus={signalMeta.validationStatus}
              impactAreas={signalMeta.impactAreas}
            />
          )}

          {/* Author Sign-off */}
          <footer className="mt-12 pt-8 border-t border-nex-light">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan to-teal-500 flex items-center justify-center text-white font-bold">
                {meta.author.toLowerCase().includes('nexvigilant') ? 'NV' : meta.author.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium">{meta.author}</p>
                <p className="text-sm text-slate-dim">AlgoVigilance Intelligence Team</p>
              </div>
            </div>
          </footer>

          {/* Original source for cross-posts */}
          {meta.type === 'signal' && (meta as { originalUrl?: string }).originalUrl && (
            <div className="mt-8">
              <a
                href={(meta as { originalUrl: string }).originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-cyan hover:text-cyan/80"
              >
                View original post <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </div>
          )}

          {/* Series Navigation */}
          {series && (
            <SeriesNavigation
              prevSlug={prevSlug}
              nextSlug={nextSlug}
              seriesTitle={series.title}
              position={seriesPosition?.position}
              total={seriesPosition?.total}
            />
          )}
        </article>

        {/* Related Content */}
        {relatedContent.length > 0 && (
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-headline text-white mb-6">Related Content</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedContent.map((item) => (
                <ContentCard key={item.meta.slug} {...toCardProps(item)} />
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="mt-16 max-w-2xl mx-auto">
          <NewsletterSignup />
        </section>
      </div>
    </div>
  );
}

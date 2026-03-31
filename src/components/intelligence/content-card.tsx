'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, Headphones, FileText, Lightbulb, PenLine, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ContentCardProps, ContentType } from '@/types/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';

/** Icon mapping for content types */
const TYPE_ICONS: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  podcast: Headphones,
  publication: FileText,
  perspective: Lightbulb,
  'field-note': PenLine,
  signal: Link2,
};

/** Color classes for content types */
const TYPE_COLORS: Record<ContentType, string> = {
  podcast: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  publication: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  perspective: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  'field-note': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  signal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

interface Props extends ContentCardProps {
  /** Card size variant */
  variant?: 'default' | 'featured' | 'compact';
  /** Additional class names */
  className?: string;
}

/**
 * Content card for Intelligence hub
 * Adapts display based on content type and variant
 */
export function ContentCard({
  slug,
  title,
  description,
  type,
  publishedAt,
  author: _author,
  image,
  imageAlt,
  tags,
  readingTime,
  featured,
  episodeNumber,
  duration,
  publicationType,
  platform,
  variant = 'default',
  className,
}: Props) {
  const Icon = TYPE_ICONS[type];
  const config = CONTENT_TYPE_CONFIG[type];
  const colorClass = TYPE_COLORS[type];

  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Determine the time/duration display
  const timeDisplay =
    type === 'podcast' && duration
      ? `${duration} min`
      : readingTime
        ? `${readingTime} min read`
        : null;

  // Featured variant - large hero card
  if (variant === 'featured') {
    return (
      <Link href={`/intelligence/${slug}`} className="block group">
        <Card
          className={cn(
            'relative overflow-hidden bg-nex-surface border-nex-light',
            'transition-all duration-300 hover:border-cyan/50 hover:shadow-glow-cyan/20',
            className
          )}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            {image && (
              <div className="relative aspect-[16/10] md:aspect-auto">
                <Image
                  src={image}
                  alt={imageAlt ?? title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-nex-background/80 to-transparent md:bg-gradient-to-r" />
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={cn('gap-1.5', colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
                {featured && (
                  <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                    Featured
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl md:text-3xl font-headline text-white group-hover:text-cyan transition-colors mb-3">
                {title}
              </CardTitle>

              <CardDescription className="text-slate-light line-clamp-3 mb-4">
                {description}
              </CardDescription>

              <div className="flex items-center gap-4 text-sm text-slate-dim">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                {timeDisplay && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {timeDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Compact variant - minimal card for lists
  if (variant === 'compact') {
    return (
      <Link href={`/intelligence/${slug}`} className="block group">
        <div
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            'transition-colors hover:bg-nex-surface/50',
            className
          )}
        >
          <Icon className={cn('h-5 w-5 mt-0.5', TYPE_COLORS[type].replace('bg-', 'text-').split(' ')[1])} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white group-hover:text-cyan transition-colors line-clamp-2">
              {title}
            </p>
            <p className="text-sm text-slate-dim mt-1">
              {formattedDate}
              {timeDisplay && ` · ${timeDisplay}`}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - standard card
  return (
    <Link href={`/intelligence/${slug}`} className="block group h-full">
      <Card
        className={cn(
          'h-full overflow-hidden bg-nex-surface border-nex-light',
          'transition-all duration-300 hover:border-cyan/50 hover:shadow-glow-cyan/20',
          className
        )}
      >
        {/* Image */}
        {image && (
          <div className="relative aspect-[16/9]">
            <Image
              src={image}
              alt={imageAlt ?? title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-nex-surface to-transparent" />
          </div>
        )}

        <CardHeader className={cn(image ? 'pt-4' : 'pt-6')}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('gap-1.5 text-xs', colorClass)}>
              <Icon className="h-3 w-3" />
              {type === 'podcast' && episodeNumber
                ? `Ep. ${episodeNumber}`
                : config.label}
            </Badge>
            {publicationType && (
              <Badge variant="outline" className="text-xs capitalize">
                {publicationType}
              </Badge>
            )}
            {platform && (
              <Badge variant="outline" className="text-xs capitalize">
                {platform}
              </Badge>
            )}
          </div>

          <CardTitle className="text-lg font-headline text-white group-hover:text-cyan transition-colors line-clamp-2">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="text-slate-light line-clamp-2 mb-4">
            {description}
          </CardDescription>

          <div className="flex items-center justify-between text-sm text-slate-dim">
            <span>{formattedDate}</span>
            {timeDisplay && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeDisplay}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-nex-background/50 text-slate-dim"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

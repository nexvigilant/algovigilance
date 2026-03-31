'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Users,
  BookOpen,
  FileText,
  Shield,
  Accessibility,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import changelog from '@/data/changelog.json';
import type { ChangelogEntry, HighlightedFeature, ChangeCategory } from '@/types/changelog';

const SEEN_VERSION_KEY = 'nexvigilant-whats-new-seen';

// Icon mapping for categories
const CATEGORY_ICONS: Record<ChangeCategory, React.ComponentType<{ className?: string }>> = {
  academy: BookOpen,
  community: Users,
  intelligence: FileText,
  platform: Sparkles,
  security: Shield,
  accessibility: Accessibility,
};

// Category styling
const CATEGORY_STYLES: Record<ChangeCategory, { bg: string; text: string; border: string }> = {
  academy: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  community: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  intelligence: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  platform: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  security: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  accessibility: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
};

interface WhatsNewModalProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Modal that shows highlights from the latest release.
 * Controlled component - parent manages open state via props.
 */
export function WhatsNewModal({ open = false, onOpenChange }: WhatsNewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const latestEntry = changelog.entries[0] as unknown as ChangelogEntry & { highlights?: HighlightedFeature[] };
  const currentVersion = changelog.currentVersion;

  // Generate highlights from features if not explicitly defined
  // Guard against missing/empty features array
  const features = latestEntry?.changes?.features ?? [];
  const highlights: HighlightedFeature[] = latestEntry?.highlights ||
    features.slice(0, 5).map(f => ({
      title: f.title || f.description?.split(' ').slice(0, 4).join(' ') || 'New Feature',
      description: f.description || '',
      category: f.category,
      image: f.image,
    }));

  const handleClose = () => {
    localStorage.setItem(SEEN_VERSION_KEY, currentVersion);
    onOpenChange?.(false);
  };

  // Handle any dismissal (clicking outside, ESC key, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Save to localStorage on any form of dismissal
      localStorage.setItem(SEEN_VERSION_KEY, currentVersion);
    }
    onOpenChange?.(newOpen);
  };

  const handleViewChangelog = () => {
    localStorage.setItem(SEEN_VERSION_KEY, currentVersion);
    onOpenChange?.(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % highlights.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + highlights.length) % highlights.length);
  };

  if (highlights.length === 0) return null;

  const currentHighlight = highlights[currentSlide];
  const CategoryIcon = CATEGORY_ICONS[currentHighlight.category] || Sparkles;
  const categoryStyle = CATEGORY_STYLES[currentHighlight.category] || CATEGORY_STYLES.platform;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-nex-surface border-cyan/30 text-white p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-cyan/20 via-nex-dark to-nex-surface px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/20">
              <Sparkles className="h-4 w-4 text-cyan" />
            </div>
            <Badge variant="outline" className="border-cyan/30 text-cyan text-xs">
              v{currentVersion}
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs">
              beta
            </Badge>
          </div>

          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-white">
              What&apos;s New
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {latestEntry.title} — {new Date(latestEntry.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature carousel */}
        <div className="px-6 py-4">
          <div className="relative flex items-center">
            {/* Navigation arrow - left */}
            {highlights.length > 1 && (
              <button
                onClick={prevSlide}
                className="flex-shrink-0 mr-3 p-2 rounded-full bg-nex-dark border border-cyan/20 hover:bg-nex-light transition-colors"
                aria-label="Previous feature"
              >
                <ChevronLeft className="h-4 w-4 text-cyan" />
              </button>
            )}

            {/* Feature card */}
            <div className="min-h-[200px] flex flex-col flex-1">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', categoryStyle.bg)}>
                  <CategoryIcon className={cn('h-4 w-4', categoryStyle.text)} />
                </div>
                <Badge className={cn('text-xs', categoryStyle.bg, categoryStyle.text, 'border', categoryStyle.border)}>
                  {currentHighlight.category.charAt(0).toUpperCase() + currentHighlight.category.slice(1)}
                </Badge>
              </div>

              {/* Feature title and description */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentHighlight.title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">
                {currentHighlight.description}
              </p>

              {/* Optional image */}
              {currentHighlight.image && (
                <div className="mt-4 rounded-lg overflow-hidden border border-cyan/20">
                  <Image
                    src={currentHighlight.image}
                    alt={currentHighlight.title}
                    width={400}
                    height={225}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Navigation arrow - right */}
            {highlights.length > 1 && (
              <button
                onClick={nextSlide}
                className="flex-shrink-0 ml-3 p-2 rounded-full bg-nex-dark border border-cyan/20 hover:bg-nex-light transition-colors"
                aria-label="Next feature"
              >
                <ChevronRight className="h-4 w-4 text-cyan" />
              </button>
            )}
          </div>

          {/* Slide indicators - min 24px touch targets for accessibility */}
          {highlights.length > 1 && (
            <div className="flex justify-center gap-1 mt-4">
              {highlights.map((highlight, index) => (
                <button
                  key={highlight.title}
                  onClick={() => setCurrentSlide(index)}
                  className="flex items-center justify-center w-6 h-6 -mx-0.5"
                  aria-label={`Go to feature ${index + 1}`}
                >
                  <span
                    className={cn(
                      'block rounded-full transition-all',
                      index === currentSlide
                        ? 'bg-cyan w-6 h-2'
                        : 'bg-slate-600 hover:bg-slate-500 w-2 h-2'
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-nex-dark/50 border-t border-cyan/10">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-slate-400">
              {currentSlide + 1} of {highlights.length} highlights
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                Maybe later
              </Button>
              <Button
                asChild
                onClick={handleViewChangelog}
                className="bg-cyan text-nex-deep hover:bg-cyan-glow"
              >
                <Link href="/changelog">
                  View All Changes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

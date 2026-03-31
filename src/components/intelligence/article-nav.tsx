'use client';

import { useState, useEffect } from 'react';
import { Check, BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ArticleSection } from '@/lib/extract-sections';

export type { ArticleSection };

interface ArticleNavProps {
  /** Article title for the nav header */
  title?: string;
  /** Sections extracted from the article */
  sections: ArticleSection[];
  /** Optional label for the nav (defaults to "In This Article") */
  label?: string;
}

function NavContent({
  title,
  label = 'In This Article',
  sections,
  activeSection,
  passedSections,
  scrollProgress,
  onNavigate
}: {
  title?: string;
  label?: string;
  sections: ArticleSection[];
  activeSection: string;
  passedSections: Set<string>;
  scrollProgress: number;
  onNavigate?: () => void;
}) {
  const activeIndex = sections.findIndex(s => s.id === activeSection);

  return (
    <nav className="relative">
      {/* Header with progress */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-dim uppercase tracking-wider mb-1">
          {label}
        </h2>
        {title && (
          <p className="text-xs text-slate-dim/70 line-clamp-2 mb-2">{title}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-nex-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="text-xs text-slate-dim tabular-nums">{Math.round(scrollProgress)}%</span>
        </div>
      </div>

      {/* Vertical progress line */}
      <div className="absolute left-[7px] top-[88px] bottom-2 w-0.5 bg-nex-surface rounded-full overflow-hidden">
        <div
          className="w-full bg-gradient-to-b from-cyan to-cyan-glow transition-all duration-300"
          style={{ height: activeIndex >= 0 ? `${((activeIndex + 1) / sections.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Section list */}
      <div className="space-y-0.5 relative">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const isPassed = passedSections.has(section.id) && !isActive;
          const isH3 = section.level === 3;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                onNavigate?.();
              }}
              className={cn(
                'flex items-center gap-2 pr-2 py-2 rounded-md text-sm transition-all relative',
                'hover:bg-nex-surface hover:text-slate-light',
                isActive && 'bg-cyan/10 text-cyan font-medium',
                isPassed && 'text-slate-light',
                !isActive && !isPassed && 'text-slate-dim',
                isH3 ? 'pl-10' : 'pl-6' // Indent h3 sections
              )}
            >
              {/* Progress node - only for h2 */}
              {!isH3 && (
                <div className={cn(
                  "absolute left-0 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center",
                  isActive && "bg-cyan border-cyan shadow-glow-cyan",
                  isPassed && "bg-nex-surface border-cyan",
                  !isActive && !isPassed && "bg-nex-dark border-nex-light"
                )}>
                  {isPassed && <Check className="h-2 w-2 text-cyan" />}
                </div>
              )}

              {/* Small dot for h3 subsections */}
              {isH3 && (
                <div className={cn(
                  "absolute left-6 w-1.5 h-1.5 rounded-full transition-all",
                  isActive && "bg-cyan",
                  isPassed && "bg-cyan/50",
                  !isActive && !isPassed && "bg-nex-light"
                )} />
              )}

              <span className="line-clamp-2 leading-snug">{section.title}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/** Minimized timeline showing just progress dots */
function MinimizedTimeline({
  sections,
  activeSection,
  passedSections,
  scrollProgress
}: {
  sections: ArticleSection[];
  activeSection: string;
  passedSections: Set<string>;
  scrollProgress: number;
}) {
  // Only show h2 sections in minimized view
  const h2Sections = sections.filter(s => s.level === 2);

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {/* Progress percentage */}
      <span className="text-[10px] text-cyan font-medium tabular-nums mb-2">
        {Math.round(scrollProgress)}%
      </span>

      {/* Vertical timeline dots */}
      <div className="relative flex flex-col items-center gap-2">
        {/* Background line */}
        <div className="absolute inset-y-0 w-0.5 bg-nex-light/30 rounded-full" />

        {h2Sections.map((section) => {
          const isActive = activeSection === section.id;
          const isPassed = passedSections.has(section.id) && !isActive;

          return (
            <div
              key={section.id}
              className={cn(
                "relative z-10 w-2 h-2 rounded-full transition-all duration-200",
                isActive && "bg-cyan shadow-glow-cyan scale-125",
                isPassed && "bg-cyan/60",
                !isActive && !isPassed && "bg-nex-light/50"
              )}
              title={section.title}
            />
          );
        })}
      </div>

      {/* Expand hint icon */}
      <ChevronLeft className="h-3 w-3 text-slate-dim mt-2" />
    </div>
  );
}

export function ArticleNav({ title, sections, label }: ArticleNavProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [passedSections, setPassedSections] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNearFooter, setIsNearFooter] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only show after scrolling past the header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Show after scrolling 200px
      setIsVisible(scrollTop > 200);

      // Hide near footer (last 8% of page or within 300px of bottom)
      const distanceFromBottom = docHeight - scrollTop;
      setIsNearFooter(progress > 92 || distanceFromBottom < 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.id;
            setActiveSection(currentId);

            // Mark previous sections as passed
            const currentIndex = sections.findIndex(s => s.id === currentId);
            if (currentIndex > 0) {
              setPassedSections(prev => {
                const newPassed = new Set(prev);
                for (let i = 0; i < currentIndex; i++) {
                  newPassed.add(sections[i].id);
                }
                return newPassed;
              });
            }
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Don't render if no sections
  if (sections.length === 0) return null;

  return (
    <>
      {/* Mobile Navigation Button */}
      <div className={cn(
        "lg:hidden fixed top-24 right-4 z-50 transition-all duration-300",
        !isVisible && "opacity-0 pointer-events-none translate-y-2",
        isNearFooter && "opacity-0 pointer-events-none"
      )}>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shadow-lg border-cyan/50 bg-nex-surface/95 backdrop-blur-sm text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">{Math.round(scrollProgress)}%</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-nex-deep">
            <div className="mt-6">
              <NavContent
                title={title}
                label={label}
                sections={sections}
                activeSection={activeSection}
                passedSections={passedSections}
                scrollProgress={scrollProgress}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation - Right side, hover to expand */}
      <div
        className={cn(
          "hidden lg:block fixed top-32 right-4 z-50 transition-all duration-300",
          (!isVisible || isNearFooter) && "opacity-0 pointer-events-none translate-x-4"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed state - just timeline */}
        <div
          className={cn(
            "bg-nex-deep rounded-xl border border-nex-light/30 shadow-xl transition-all duration-300 overflow-hidden",
            isHovered ? "w-[280px] opacity-0 pointer-events-none" : "w-10 opacity-100"
          )}
        >
          <MinimizedTimeline
            sections={sections}
            activeSection={activeSection}
            passedSections={passedSections}
            scrollProgress={scrollProgress}
          />
        </div>

        {/* Expanded state - full navigation */}
        <div
          className={cn(
            "absolute top-0 right-0 bg-nex-deep rounded-xl border border-cyan/30 shadow-2xl transition-all duration-300 overflow-hidden",
            isHovered
              ? "w-[280px] opacity-100 translate-x-0"
              : "w-[280px] opacity-0 pointer-events-none translate-x-4"
          )}
        >
          <ScrollArea className="h-[calc(100vh-12rem)] p-4">
            <NavContent
              title={title}
              label={label}
              sections={sections}
              activeSection={activeSection}
              passedSections={passedSections}
              scrollProgress={scrollProgress}
            />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

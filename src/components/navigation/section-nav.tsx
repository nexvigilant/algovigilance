'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SectionNavProps {
  sections: { id: string; label: string }[];
  className?: string;
}

/**
 * SectionNav - Sticky table of contents with active state tracking
 *
 * Accessibility features:
 * - aria-current="true" on the currently visible section
 * - Clear focus-visible ring for keyboard navigation
 * - Semantic nav landmark with descriptive label
 */
export function SectionNav({ sections, className }: SectionNavProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Create an observer for each section
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When section enters viewport from top, mark as active
            if (entry.isIntersecting && entry.boundingClientRect.top < window.innerHeight / 2) {
              setActiveSection(id);
            }
          });
        },
        {
          rootMargin: '-20% 0px -60% 0px', // Trigger when section is in upper portion of viewport
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      className={cn('sticky top-20 z-20 mb-8 overflow-x-auto', className)}
    >
      <ul className="flex justify-center gap-2 py-3">
        {sections.map(({ id, label }) => {
          const isActive = activeSection === id;

          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center px-4 py-2 touch-target text-sm font-medium rounded-full border backdrop-blur-sm transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-nex-deep',
                  isActive
                    ? 'text-cyan border-cyan/50 bg-cyan/10'
                    : 'text-slate-dim border-nex-light bg-nex-surface/80 hover:text-cyan hover:border-cyan/50'
                )}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

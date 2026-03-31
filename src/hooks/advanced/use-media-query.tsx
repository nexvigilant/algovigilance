'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for responsive breakpoint detection using CSS media queries
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * return (
 *   <div>
 *     {isMobile && <MobileNav />}
 *     {!isMobile && <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR compatibility
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Common breakpoint utilities
 */
export const breakpoints = {
  /** Mobile: < 768px */
  mobile: '(max-width: 767px)',

  /** Tablet: 768px - 1023px */
  tablet: '(min-width: 768px) and (max-width: 1023px)',

  /** Desktop: >= 1024px */
  desktop: '(min-width: 1024px)',

  /** Large desktop: >= 1280px */
  desktopLarge: '(min-width: 1280px)',

  /** Not mobile: >= 768px */
  notMobile: '(min-width: 768px)',

  /** Touch device */
  touch: '(hover: none) and (pointer: coarse)',

  /** Mouse/trackpad device */
  mouse: '(hover: hover) and (pointer: fine)',

  /** Prefers reduced motion */
  reducedMotion: '(prefers-reduced-motion: reduce)',

  /** Dark mode preference */
  darkMode: '(prefers-color-scheme: dark)',

  /** Light mode preference */
  lightMode: '(prefers-color-scheme: light)',
} as const;

/**
 * Hook for common breakpoint detection
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.desktop);
  const isDesktopLarge = useMediaQuery(breakpoints.desktopLarge);
  const isTouch = useMediaQuery(breakpoints.touch);
  const prefersReducedMotion = useMediaQuery(breakpoints.reducedMotion);
  const prefersDarkMode = useMediaQuery(breakpoints.darkMode);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isDesktopLarge,
    isTouch,
    prefersReducedMotion,
    prefersDarkMode,
  };
}

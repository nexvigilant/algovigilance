/**
 * Style Presets
 *
 * Centralized style configurations for consistent visual effects across the site.
 * Includes text shadows, gradients, and other reusable style objects.
 *
 * @module lib/style-presets
 */

import type { CSSProperties } from 'react';

/**
 * Text shadow presets for hero sections and headlines
 */
export const TEXT_SHADOWS = {
  /** Gold glow effect for premium/founding content */
  goldGlow: '0 0 40px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)',
  /** Cyan glow effect for CTAs and highlights */
  cyanGlow: '0 0 40px rgba(0, 229, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)',
  /** Subtle white glow for standard headlines */
  subtleWhite: '0 0 20px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.8)',
  /** Strong drop shadow for maximum readability */
  strong: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.4)',
} as const;

/**
 * Complete style objects for hero headlines
 */
export const HERO_HEADLINE_STYLES: Record<string, CSSProperties> = {
  /** Gold-themed hero (membership, premium features) */
  gold: {
    textShadow: TEXT_SHADOWS.goldGlow,
    lineHeight: 1.15,
  },
  /** Cyan-themed hero (technology, intelligence) */
  cyan: {
    textShadow: TEXT_SHADOWS.cyanGlow,
    lineHeight: 1.15,
  },
  /** Standard hero with subtle effect */
  standard: {
    textShadow: TEXT_SHADOWS.subtleWhite,
    lineHeight: 1.15,
  },
  /** High contrast for dark backgrounds */
  highContrast: {
    textShadow: TEXT_SHADOWS.strong,
    lineHeight: 1.15,
  },
} as const;

/**
 * Background gradient presets
 */
export const BACKGROUND_GRADIENTS = {
  /** Gold radial gradient for premium sections */
  goldRadial: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.1), transparent 70%)',
  /** Cyan radial gradient for tech sections */
  cyanRadial: 'radial-gradient(ellipse at center, rgba(0, 229, 255, 0.1), transparent 70%)',
  /** Top-down fade for hero sections */
  goldTopFade: 'linear-gradient(to bottom, rgba(212, 175, 55, 0.05), transparent)',
  /** Top-down fade cyan variant */
  cyanTopFade: 'linear-gradient(to bottom, rgba(0, 229, 255, 0.05), transparent)',
} as const;

/**
 * Box shadow presets
 */
export const BOX_SHADOWS = {
  /** Glow effect for buttons and interactive elements */
  cyanGlow: '0 0 20px rgba(0, 229, 255, 0.2)',
  /** Gold glow for premium elements */
  goldGlow: '0 0 20px rgba(212, 175, 55, 0.2)',
  /** Elevated card shadow */
  elevated: '0 4px 20px rgba(0, 0, 0, 0.3)',
  /** Subtle card shadow */
  subtle: '0 2px 10px rgba(0, 0, 0, 0.2)',
} as const;

/**
 * Animation timing presets
 */
export const ANIMATION_TIMING = {
  /** Fast micro-interactions */
  fast: '150ms',
  /** Standard transitions */
  normal: '200ms',
  /** Slower, more deliberate animations */
  slow: '300ms',
  /** Page transitions */
  page: '500ms',
} as const;

/**
 * Helper to apply hero headline styles
 */
export function getHeroStyle(variant: keyof typeof HERO_HEADLINE_STYLES = 'standard'): CSSProperties {
  return HERO_HEADLINE_STYLES[variant];
}

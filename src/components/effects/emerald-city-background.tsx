'use client';

import React from 'react';
import { AmbientParticles } from './ambient-particles';
import { CircuitBackground } from './circuit-background';
import { PrismaticRays } from './prismatic-rays';

export interface EmeraldCityBackgroundProps {
  /**
   * Overall intensity of all effects
   * - subtle: Minimal distraction, professional feel (admin, nucleus work areas)
   * - medium: Balanced brand presence (marketing, ecosystem)
   * - vibrant: Maximum visual impact (hero sections, landing pages)
   */
  intensity?: 'subtle' | 'medium' | 'vibrant';

  /**
   * Show prismatic light rays (cityscape spire effect)
   * Best for: marketing pages, auth pages, hero sections
   */
  showPrismaticRays?: boolean;

  /**
   * Show circuit board traces (tech/infrastructure feel)
   * Best for: nucleus portal, admin dashboards, tech-focused pages
   */
  showCircuits?: boolean;

  /**
   * Show floating ambient particles (atmospheric depth)
   * Best for: most pages, adds subtle life to backgrounds
   */
  showParticles?: boolean;

  /**
   * Show animated glow orbs (bokeh depth-of-field effect)
   * Best for: marketing pages, hero sections
   */
  showGlowOrbs?: boolean;

  /**
   * Show the primary zircon glow at the top
   * Best for: pages with hero sections or prominent headers
   */
  showPrimaryGlow?: boolean;

  /**
   * Show fine grid texture overlay
   * Best for: all pages (very subtle architectural precision feel)
   */
  showGrid?: boolean;

  /**
   * Show bottom horizon fade and prismatic bar
   * Best for: pages with clear footer separation
   */
  showHorizon?: boolean;

  /**
   * Additional className for the container
   */
  className?: string;

  /**
   * Constrain circuits to a horizontal strip below header
   * Use for layouts where perimeter circuits interfere with content
   */
  circuitLayout?: 'perimeter' | 'top-strip';
}

/**
 * Emerald City Background System
 *
 * A unified, configurable background effect system inspired by the
 * glistening spires of Oz's Emerald City, translated into AlgoVigilance's
 * zircon blue and metallic gold palette.
 *
 * This component provides consistent visual branding across the platform
 * while allowing per-layout customization of effect intensity and visibility.
 *
 * @example
 * // Marketing pages - full effects
 * <EmeraldCityBackground intensity="medium" showPrismaticRays showCircuits showParticles showGlowOrbs />
 *
 * @example
 * // Nucleus work areas - subtle, focused
 * <EmeraldCityBackground intensity="subtle" showCircuits showParticles />
 *
 * @example
 * // Auth pages - clean, premium
 * <EmeraldCityBackground intensity="subtle" showPrismaticRays showPrimaryGlow />
 */
// Intensity configuration - static, defined outside component
const INTENSITY_CONFIG = {
  subtle: { opacity: 0.5, particleCount: 15, blur: 100 },
  medium: { opacity: 1, particleCount: 25, blur: 80 },
  vibrant: { opacity: 1.5, particleCount: 40, blur: 60 },
} as const;

export function EmeraldCityBackground({
  intensity = 'medium',
  showPrismaticRays = false,
  showCircuits = false,
  showParticles = false,
  showGlowOrbs = false,
  showPrimaryGlow = true,
  showGrid = true,
  showHorizon = false,
  className = '',
  circuitLayout = 'perimeter',
}: EmeraldCityBackgroundProps) {
  const config = INTENSITY_CONFIG[intensity];

  // Map intensity to component props - respect intensity levels
  const circuitOpacity = intensity === 'subtle' ? 'low' : intensity === 'vibrant' ? 'high' : 'medium';
  const particleOpacity = intensity === 'subtle' ? 'low' : intensity === 'vibrant' ? 'high' : 'medium';
  const raysIntensity = intensity;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Layer 1: Crystal facet highlights - sharp specular reflections */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(125deg, rgba(255,255,255,${0.04 * config.opacity}) 0%, transparent 25%),
            linear-gradient(235deg, rgba(255,255,255,${0.02 * config.opacity}) 0%, transparent 20%)
          `,
        }}
      />

      {/* Layer 2: Primary crystal shine - polished surface reflection */}
      <div
        className="absolute top-0 left-0 w-full h-[60%]"
        style={{
          background: `linear-gradient(
            155deg,
            rgba(255, 255, 255, ${0.06 * config.opacity}) 0%,
            rgba(0, 229, 255, ${0.08 * config.opacity}) 15%,
            transparent 40%
          )`,
        }}
      />

      {/* Layer 3: Full Spectrum Prismatic Edge - 8-color rainbow refraction (top-right) */}
      <div
        className="absolute top-0 right-0 w-[45%] h-[35%]"
        style={{
          background: `conic-gradient(
            from 180deg at 100% 0%,
            transparent 0deg,
            rgba(255, 80, 80, ${0.025 * config.opacity}) 10deg,
            rgba(255, 160, 80, ${0.03 * config.opacity}) 25deg,
            rgba(255, 220, 80, ${0.035 * config.opacity}) 40deg,
            rgba(80, 220, 100, ${0.03 * config.opacity}) 55deg,
            rgba(0, 229, 255, ${0.06 * config.opacity}) 70deg,
            rgba(80, 120, 255, ${0.04 * config.opacity}) 90deg,
            rgba(160, 80, 255, ${0.035 * config.opacity}) 110deg,
            rgba(255, 80, 180, ${0.025 * config.opacity}) 130deg,
            transparent 150deg
          )`,
          filter: `blur(${intensity === 'subtle' ? 35 : 25}px)`,
        }}
      />

      {/* Layer 3b: Secondary Full Spectrum Edge - bottom-left corner */}
      <div
        className="absolute bottom-0 left-0 w-[35%] h-[30%]"
        style={{
          background: `conic-gradient(
            from 45deg at 0% 100%,
            transparent 0deg,
            rgba(244, 208, 63, ${0.04 * config.opacity}) 15deg,
            rgba(255, 160, 80, ${0.025 * config.opacity}) 30deg,
            rgba(0, 229, 255, ${0.05 * config.opacity}) 50deg,
            rgba(80, 120, 255, ${0.03 * config.opacity}) 70deg,
            transparent 90deg
          )`,
          filter: `blur(${intensity === 'subtle' ? 30 : 20}px)`,
        }}
      />

      {/* Layer 4: Specular Flash Points - Small facet catches that twinkle */}
      {intensity !== 'subtle' && (
        <>
          <div
            className="absolute animate-specular-flash"
            style={{
              left: '25%',
              top: '18%',
              width: '4px',
              height: '4px',
              background: `radial-gradient(circle, rgba(255, 255, 255, ${0.8 * config.opacity}) 0%, rgba(0, 229, 255, ${0.4 * config.opacity}) 50%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(1px)',
              animationDelay: '0s',
            }}
          />
          <div
            className="absolute animate-specular-flash"
            style={{
              right: '35%',
              top: '12%',
              width: '3px',
              height: '3px',
              background: `radial-gradient(circle, rgba(255, 255, 255, ${0.7 * config.opacity}) 0%, rgba(244, 208, 63, ${0.3 * config.opacity}) 50%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(1px)',
              animationDelay: '3.3s',
            }}
          />
          <div
            className="absolute animate-specular-flash"
            style={{
              left: '60%',
              top: '25%',
              width: '5px',
              height: '5px',
              background: `radial-gradient(circle, rgba(255, 255, 255, ${0.9 * config.opacity}) 0%, rgba(0, 229, 255, ${0.5 * config.opacity}) 50%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(1px)',
              animationDelay: '6.6s',
            }}
          />
        </>
      )}

      {/* Layer 5: Fine grid texture - architectural precision */}
      {showGrid && (
        <div
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.012 * config.opacity }}
        >
          <div className="bg-grid-white/100 absolute inset-0 h-full w-full" />
        </div>
      )}

      {/* Layer 6: Prismatic light rays - Emerald City spires */}
      {showPrismaticRays && <PrismaticRays intensity={raysIntensity} />}

      {/* Layer 7: (moved to top layer) */}

      {/* Layer 8: Ambient particles - sparkling crystal dust */}
      {showParticles && (
        <AmbientParticles count={config.particleCount} opacity={particleOpacity} />
      )}

      {/* Layer 9: Primary crystal glow - deep zircon brilliance */}
      {showPrimaryGlow && (
        <>
          {/* Main top glow */}
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: `${1400 * config.opacity}px`,
              height: `${500 * config.opacity}px`,
              background: `radial-gradient(ellipse 100% 100% at 50% 0%,
                rgba(0, 229, 255, ${0.15 * config.opacity}) 0%,
                rgba(0, 200, 255, ${0.08 * config.opacity}) 30%,
                rgba(0, 174, 239, ${0.04 * config.opacity}) 50%,
                transparent 70%)`,
              filter: `blur(${config.blur * 0.8}px)`,
            }}
          />
          {/* Sharp highlight accent */}
          <div
            className="absolute left-[40%] top-[5%]"
            style={{
              width: '200px',
              height: '100px',
              background: `radial-gradient(ellipse 100% 100% at 50% 50%,
                rgba(255, 255, 255, ${0.12 * config.opacity}) 0%,
                rgba(0, 229, 255, ${0.1 * config.opacity}) 30%,
                transparent 60%)`,
              filter: 'blur(20px)',
            }}
          />
        </>
      )}

      {/* Layer 10: Crystal glow orbs - faceted light points */}
      {showGlowOrbs && (
        <>
          {/* Gold facet reflection - left */}
          <div
            className="absolute left-[15%] top-[25%]"
            style={{
              width: `${250 * config.opacity}px`,
              height: `${200 * config.opacity}px`,
              background: `radial-gradient(ellipse 80% 60% at 30% 30%,
                rgba(255, 248, 220, ${0.1 * config.opacity}) 0%,
                rgba(244, 208, 63, ${0.08 * config.opacity}) 40%,
                transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
          {/* Cyan crystal reflection - right */}
          <div
            className="absolute right-[10%] top-[35%]"
            style={{
              width: `${300 * config.opacity}px`,
              height: `${250 * config.opacity}px`,
              background: `radial-gradient(ellipse 70% 80% at 70% 40%,
                rgba(200, 240, 255, ${0.08 * config.opacity}) 0%,
                rgba(0, 229, 255, ${0.06 * config.opacity}) 40%,
                transparent 70%)`,
              filter: 'blur(35px)',
            }}
          />
          {/* Small specular point - center */}
          <div
            className="absolute left-[55%] top-[15%]"
            style={{
              width: '80px',
              height: '80px',
              background: `radial-gradient(circle,
                rgba(255, 255, 255, ${0.15 * config.opacity}) 0%,
                rgba(0, 229, 255, ${0.1 * config.opacity}) 30%,
                transparent 60%)`,
              filter: 'blur(15px)',
            }}
          />
        </>
      )}

      {/* Layer 11: Bottom horizon fade and prismatic accent */}
      {showHorizon && (
        <>
          <div
            className="absolute bottom-0 left-0 z-20 h-40 w-full"
            style={{
              background: 'linear-gradient(to top, rgba(1, 10, 20, 1) 0%, rgba(1, 10, 20, 0.7) 50%, transparent 100%)',
            }}
          />
          {/* Full Spectrum Prismatic Horizon Line */}
          <div
            className="absolute bottom-10 left-[10%] right-[10%] h-[2px] z-20"
            style={{
              opacity: 0.5 * config.opacity,
              background: `linear-gradient(90deg,
                transparent 0%,
                rgba(255, 80, 80, 0.2) 8%,
                rgba(255, 160, 80, 0.3) 16%,
                rgba(255, 220, 80, 0.35) 24%,
                rgba(80, 220, 100, 0.3) 32%,
                rgba(0, 229, 255, 0.5) 40%,
                rgba(0, 229, 255, 0.5) 60%,
                rgba(80, 120, 255, 0.35) 68%,
                rgba(160, 80, 255, 0.3) 76%,
                rgba(255, 80, 180, 0.25) 84%,
                rgba(244, 208, 63, 0.3) 92%,
                transparent 100%
              )`,
              filter: 'blur(1px)',
            }}
          />
          {/* Horizon glow underlay */}
          <div
            className="absolute bottom-8 left-[15%] right-[15%] h-[8px] z-19"
            style={{
              opacity: 0.2 * config.opacity,
              background: `linear-gradient(90deg,
                transparent 0%,
                rgba(0, 229, 255, 0.4) 30%,
                rgba(0, 229, 255, 0.5) 50%,
                rgba(0, 229, 255, 0.4) 70%,
                transparent 100%
              )`,
              filter: 'blur(8px)',
            }}
          />
        </>
      )}

      {/* Layer 12: Circuit traces - rendered LAST to be on top of glows */}
      {showCircuits && circuitLayout === 'perimeter' && (
        <div className="absolute inset-0 z-30">
          <CircuitBackground opacity={circuitOpacity} animated={true} variant="mixed" />
        </div>
      )}

      {/* Layer 12b: Horizontal circuit strip - alternative layout for sidebar pages */}
      {showCircuits && circuitLayout === 'top-strip' && (
        <div
          className="absolute left-0 right-0 z-30 overflow-hidden"
          style={{
            top: '64px', // Below header
            height: '120px',
            maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
          }}
        >
          <CircuitBackground opacity={circuitOpacity} animated={true} variant="cyan" />
        </div>
      )}
    </div>
  );
}

/**
 * Preset configurations for common use cases
 */
export const EmeraldCityPresets = {
  /** Full marketing impact - all effects enabled */
  marketing: {
    intensity: 'medium' as const,
    showPrismaticRays: true,
    showCircuits: true,
    showParticles: true,
    showGlowOrbs: true,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: true,
  },

  /** Hero section - maximum visual impact */
  hero: {
    intensity: 'vibrant' as const,
    showPrismaticRays: true,
    showCircuits: true,
    showParticles: true,
    showGlowOrbs: true,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: true,
  },

  /** Nucleus portal - prominent circuits with crystal effects */
  nucleus: {
    intensity: 'medium' as const,
    showPrismaticRays: true,
    showCircuits: true,
    showParticles: true,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: false,
  },

  /** Auth pages - clean, premium feel (no circuits) */
  auth: {
    intensity: 'subtle' as const,
    showPrismaticRays: true,
    showCircuits: false,
    showParticles: false,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: false,
  },

  /** Legal pages - minimal, professional (no circuits) */
  legal: {
    intensity: 'subtle' as const,
    showPrismaticRays: false,
    showCircuits: false,
    showParticles: true,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: false,
  },

  /** Admin dashboards - tech-forward with prominent circuits */
  admin: {
    intensity: 'medium' as const,
    showPrismaticRays: false,
    showCircuits: true,
    showParticles: false,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: false,
  },

  /** Ecosystem pages - branded but focused */
  ecosystem: {
    intensity: 'medium' as const,
    showPrismaticRays: true,
    showCircuits: true,
    showParticles: false,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: true,
  },

  /** Work areas (admin, community) - minimal distraction, content-focused */
  work: {
    intensity: 'subtle' as const,
    showPrismaticRays: false,
    showCircuits: false,
    showParticles: false,
    showGlowOrbs: false,
    showPrimaryGlow: true,
    showGrid: true,
    showHorizon: false,
  },
} as const;

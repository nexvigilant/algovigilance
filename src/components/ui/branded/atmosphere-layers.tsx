'use client';

// ─── Atmosphere Layer System ────────────────────────────────────────────────
//
// Composable background layers that create depth and mood behind any visual.
// Each layer is independent — use all four or pick what you need.
//
// Layers (back to front):
//   1. RadialGlow       — colored light emanating from center
//   2. ConicBeams       — rotational light rays
//   3. GridOverlay      — subtle structural grid
//   4. Vignette         — edge darkening for focus
//   5. ParticleField    — ambient floating particles
//
// All layers are pointer-events-none and positioned absolute.

export interface AtmosphereConfig {
  /** Primary glow color as CSS rgba */
  glowColor: string;
  /** Secondary glow color as CSS rgba */
  glowColorSecondary: string;
  /** Conic beam segments — alternating primary/secondary */
  beamSegments: number;
  /** Grid line color as CSS rgba */
  gridColor: string;
  /** Grid cell size in px */
  gridSize: number;
  /** Vignette strength 0-1 */
  vignetteStrength: number;
  /** Particle color as CSS color */
  particleColor: string;
  /** Number of ambient particles */
  particleCount: number;
}

// ─── Presets ────────────────────────────────────────────────────────────────

/** Gold/cyan — the original Nucleus hub atmosphere */
export const ATMOSPHERE_NUCLEUS: AtmosphereConfig = {
  glowColor: 'rgba(212, 175, 55, 0.08)',
  glowColorSecondary: 'rgba(184, 115, 51, 0.04)',
  beamSegments: 6,
  gridColor: 'rgba(212, 175, 55, 0.02)',
  gridSize: 40,
  vignetteStrength: 0.6,
  particleColor: 'rgba(212, 175, 55, 0.4)',
  particleCount: 15,
};

/** Deep space — dark, expansive, cosmic */
export const ATMOSPHERE_DEEP_SPACE: AtmosphereConfig = {
  glowColor: 'rgba(0, 174, 239, 0.06)',
  glowColorSecondary: 'rgba(99, 102, 241, 0.03)',
  beamSegments: 8,
  gridColor: 'rgba(0, 174, 239, 0.015)',
  gridSize: 48,
  vignetteStrength: 0.7,
  particleColor: 'rgba(0, 174, 239, 0.3)',
  particleCount: 20,
};

/** Clinical — clean, precise */
export const ATMOSPHERE_CLINICAL: AtmosphereConfig = {
  glowColor: 'rgba(200, 210, 230, 0.06)',
  glowColorSecondary: 'rgba(0, 174, 239, 0.02)',
  beamSegments: 4,
  gridColor: 'rgba(200, 210, 230, 0.03)',
  gridSize: 32,
  vignetteStrength: 0.3,
  particleColor: 'rgba(200, 210, 230, 0.3)',
  particleCount: 8,
};

/** War room — red-shifted, intense */
export const ATMOSPHERE_WAR_ROOM: AtmosphereConfig = {
  glowColor: 'rgba(255, 80, 40, 0.08)',
  glowColorSecondary: 'rgba(255, 40, 0, 0.04)',
  beamSegments: 6,
  gridColor: 'rgba(255, 80, 40, 0.02)',
  gridSize: 36,
  vignetteStrength: 0.75,
  particleColor: 'rgba(255, 80, 40, 0.3)',
  particleCount: 12,
};

// ─── Components ─────────────────────────────────────────────────────────────

function RadialGlow({ config }: { config: AtmosphereConfig }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${config.glowColor} 0%, ${config.glowColorSecondary} 30%, transparent 60%)`,
      }}
    />
  );
}

function ConicBeams({ config }: { config: AtmosphereConfig }) {
  // Generate conic gradient stops — alternating glow colors with transparent gaps
  const stops: string[] = [];
  const segmentAngle = 360 / config.beamSegments;
  const beamWidth = 5; // degrees

  for (let i = 0; i < config.beamSegments; i++) {
    const start = i * segmentAngle;
    const color = i % 2 === 0 ? config.glowColor : config.glowColorSecondary;
    stops.push(`transparent ${start}deg`);
    stops.push(`${color.replace(/[\d.]+\)$/, '0.4)')} ${start + beamWidth / 2}deg`);
    stops.push(`transparent ${start + beamWidth}deg`);
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-15"
      style={{
        background: `conic-gradient(from 0deg at 50% 50%, ${stops.join(', ')})`,
      }}
    />
  );
}

function GridOverlay({ config }: { config: AtmosphereConfig }) {
  const s = config.gridSize;
  const c = config.gridColor;
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        backgroundSize: `${s}px ${s}px`,
      }}
    />
  );
}

function Vignette({ config }: { config: AtmosphereConfig }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        background: `radial-gradient(circle at 50% 50%, transparent 0%, transparent 35%, rgba(10, 25, 41, ${config.vignetteStrength}) 100%)`,
      }}
    />
  );
}

function ParticleField({ config }: { config: AtmosphereConfig }) {
  return (
    <>
      {Array.from({ length: config.particleCount }).map((_, i) => (
        <div
          key={`atm-particle-${i}`}
          className="absolute rounded-full opacity-20"
          style={{
            width: i % 2 === 0 ? '2px' : '3px',
            height: i % 2 === 0 ? '2px' : '3px',
            backgroundColor: config.particleColor,
            boxShadow: `0 0 6px ${config.particleColor}`,
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 100}%`,
            animationDuration: `${15 + (i % 10)}s`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Composed Layer ─────────────────────────────────────────────────────────

interface AtmosphereLayersProps {
  config: AtmosphereConfig;
  /** Which layers to render. Defaults to all. */
  layers?: ('glow' | 'beams' | 'grid' | 'vignette' | 'particles')[];
}

export function AtmosphereLayers({
  config,
  layers = ['glow', 'beams', 'grid', 'vignette', 'particles'],
}: AtmosphereLayersProps) {
  return (
    <>
      {layers.includes('glow') && <RadialGlow config={config} />}
      {layers.includes('beams') && <ConicBeams config={config} />}
      {layers.includes('grid') && <GridOverlay config={config} />}
      {layers.includes('vignette') && <Vignette config={config} />}
      {layers.includes('particles') && <ParticleField config={config} />}
    </>
  );
}

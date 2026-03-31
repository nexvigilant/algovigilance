'use client';

// ─── Circuit Board SVG Background ───────────────────────────────────────────
//
// Generates animated PCB-style traces around the perimeter of a viewport.
// Traces stay within a configurable margin from the edges, leaving the center
// clear for content (sphere, cards, etc).
//
// Features:
//   - Gold/copper gradient strokes with glow filters
//   - Animated particles flowing along trace paths
//   - Reactive glow on hover (pass activeTraceId)
//   - Connection point dots at trace intersections

export interface CircuitTrace {
  id: string;
  paths: Array<{
    d: string;
    variant: 'gold' | 'copper';
    width?: string;
  }>;
}

export interface CircuitBackgroundConfig {
  /** Gold gradient stops: [start, mid, end] as hex colors */
  goldColors: [string, string, string];
  /** Copper gradient stops: [start, end] as hex colors */
  copperColors: [string, string];
  /** Trace definitions */
  traces: CircuitTrace[];
  /** Animated particle configs — paths that particles follow */
  particlePaths: Array<{
    d: string;
    color: string;
    radius: number;
    duration: number;
  }>;
  /** Connection point positions */
  connectionPoints: Array<{ cx: number; cy: number; r: number }>;
  /** SVG viewBox. Default "0 0 1000 1000" */
  viewBox?: string;
}

// ─── Presets ────────────────────────────────────────────────────────────────

/** The original Nucleus hub circuit board */
export const CIRCUIT_PRESET_NUCLEUS: CircuitBackgroundConfig = {
  goldColors: ['#D4AF37', '#B87333', '#D4AF37'],
  copperColors: ['#B87333', '#D4AF37'],
  traces: [
    { id: 'Ventures', paths: [
      { d: 'M 0 100 H 80 L 100 120 V 180', variant: 'gold', width: '1.5' },
      { d: 'M 0 160 H 60 L 80 180 H 120', variant: 'copper', width: '1' },
      { d: 'M 80 0 V 60 L 100 80 H 150', variant: 'gold', width: '1' },
    ]},
    { id: 'Solutions', paths: [
      { d: 'M 0 900 H 80 L 100 880 V 820', variant: 'gold', width: '1.5' },
      { d: 'M 0 840 H 60 L 80 820 H 120', variant: 'copper', width: '1' },
      { d: 'M 80 1000 V 940 L 100 920 H 150', variant: 'gold', width: '1' },
    ]},
    { id: 'Academy', paths: [
      { d: 'M 1000 100 H 920 L 900 120 V 180', variant: 'gold', width: '1.5' },
      { d: 'M 1000 160 H 940 L 920 180 H 880', variant: 'copper', width: '1' },
      { d: 'M 920 0 V 60 L 900 80 H 850', variant: 'gold', width: '1' },
    ]},
    { id: 'Careers', paths: [
      { d: 'M 1000 900 H 920 L 900 880 V 820', variant: 'gold', width: '1.5' },
      { d: 'M 1000 840 H 940 L 920 820 H 880', variant: 'copper', width: '1' },
      { d: 'M 920 1000 V 940 L 900 920 H 850', variant: 'gold', width: '1' },
    ]},
    { id: 'Community', paths: [
      { d: 'M 350 0 V 80 L 380 110 H 450 L 480 130 V 150', variant: 'gold', width: '1.5' },
      { d: 'M 500 0 V 100', variant: 'copper', width: '1' },
      { d: 'M 650 0 V 80 L 620 110 H 550 L 520 130 V 150', variant: 'gold', width: '1.5' },
    ]},
    { id: 'Guardian', paths: [
      { d: 'M 350 1000 V 920 L 380 890 H 450 L 480 870 V 850', variant: 'gold', width: '1.5' },
      { d: 'M 500 1000 V 900', variant: 'copper', width: '1' },
      { d: 'M 650 1000 V 920 L 620 890 H 550 L 520 870 V 850', variant: 'gold', width: '1.5' },
    ]},
  ],
  particlePaths: [
    { d: 'M 0 100 H 80 L 100 120 V 180', color: '#D4AF37', radius: 4, duration: 3 },
    { d: 'M 0 500 H 100', color: '#F5D78E', radius: 5, duration: 4 },
    { d: 'M 0 900 H 80 L 100 880 V 820', color: '#B87333', radius: 4, duration: 3.5 },
    { d: 'M 1000 100 H 920 L 900 120 V 180', color: '#D4AF37', radius: 4, duration: 3.2 },
    { d: 'M 1000 500 H 900', color: '#F5D78E', radius: 5, duration: 4.2 },
    { d: 'M 1000 900 H 920 L 900 880 V 820', color: '#B87333', radius: 4, duration: 3.8 },
    { d: 'M 500 0 V 100', color: '#D4AF37', radius: 4, duration: 2 },
    { d: 'M 500 1000 V 900', color: '#D4AF37', radius: 4, duration: 2 },
  ],
  connectionPoints: [
    { cx: 100, cy: 120, r: 3 }, { cx: 100, cy: 80, r: 2 },
    { cx: 100, cy: 880, r: 3 }, { cx: 100, cy: 920, r: 2 },
    { cx: 900, cy: 120, r: 3 }, { cx: 900, cy: 80, r: 2 },
    { cx: 900, cy: 880, r: 3 }, { cx: 900, cy: 920, r: 2 },
    { cx: 480, cy: 140, r: 2 }, { cx: 520, cy: 140, r: 2 },
    { cx: 480, cy: 860, r: 2 }, { cx: 520, cy: 860, r: 2 },
    { cx: 100, cy: 420, r: 2 }, { cx: 100, cy: 580, r: 2 },
    { cx: 900, cy: 420, r: 2 }, { cx: 900, cy: 580, r: 2 },
  ],
};

/** Minimal — fewer traces, cleaner look */
export const CIRCUIT_PRESET_MINIMAL: CircuitBackgroundConfig = {
  goldColors: ['#D4AF37', '#B87333', '#D4AF37'],
  copperColors: ['#B87333', '#D4AF37'],
  traces: [
    { id: 'top-left', paths: [
      { d: 'M 0 100 H 80 L 100 120 V 180', variant: 'gold', width: '1.5' },
    ]},
    { id: 'bottom-right', paths: [
      { d: 'M 1000 900 H 920 L 900 880 V 820', variant: 'gold', width: '1.5' },
    ]},
  ],
  particlePaths: [
    { d: 'M 0 100 H 80 L 100 120 V 180', color: '#D4AF37', radius: 4, duration: 3 },
    { d: 'M 1000 900 H 920 L 900 880 V 820', color: '#D4AF37', radius: 4, duration: 3 },
  ],
  connectionPoints: [
    { cx: 100, cy: 120, r: 3 },
    { cx: 900, cy: 880, r: 3 },
  ],
};

/** Deep space — cyan/violet traces for Observatory and cosmic themes */
export const CIRCUIT_PRESET_DEEP_SPACE: CircuitBackgroundConfig = {
  goldColors: ['#00AEEF', '#6366F1', '#00AEEF'],
  copperColors: ['#6366F1', '#00AEEF'],
  traces: [
    { id: 'top-left', paths: [
      { d: 'M 0 80 H 60 L 80 100 V 160', variant: 'gold', width: '1' },
      { d: 'M 60 0 V 50 L 80 70 H 120', variant: 'copper', width: '0.8' },
    ]},
    { id: 'top-right', paths: [
      { d: 'M 1000 80 H 940 L 920 100 V 160', variant: 'gold', width: '1' },
      { d: 'M 940 0 V 50 L 920 70 H 880', variant: 'copper', width: '0.8' },
    ]},
    { id: 'bottom-left', paths: [
      { d: 'M 0 920 H 60 L 80 900 V 840', variant: 'gold', width: '1' },
    ]},
    { id: 'bottom-right', paths: [
      { d: 'M 1000 920 H 940 L 920 900 V 840', variant: 'gold', width: '1' },
    ]},
    { id: 'top-center', paths: [
      { d: 'M 400 0 V 60 L 430 90 H 500', variant: 'copper', width: '0.8' },
      { d: 'M 600 0 V 60 L 570 90 H 500', variant: 'copper', width: '0.8' },
    ]},
    { id: 'bottom-center', paths: [
      { d: 'M 400 1000 V 940 L 430 910 H 500', variant: 'copper', width: '0.8' },
      { d: 'M 600 1000 V 940 L 570 910 H 500', variant: 'copper', width: '0.8' },
    ]},
  ],
  particlePaths: [
    { d: 'M 0 80 H 60 L 80 100 V 160', color: '#00AEEF', radius: 3, duration: 2.5 },
    { d: 'M 1000 80 H 940 L 920 100 V 160', color: '#00AEEF', radius: 3, duration: 2.8 },
    { d: 'M 400 0 V 60 L 430 90 H 500', color: '#6366F1', radius: 3, duration: 2 },
    { d: 'M 600 0 V 60 L 570 90 H 500', color: '#6366F1', radius: 3, duration: 2.2 },
    { d: 'M 0 920 H 60 L 80 900 V 840', color: '#00AEEF', radius: 3, duration: 3 },
    { d: 'M 1000 920 H 940 L 920 900 V 840', color: '#00AEEF', radius: 3, duration: 3.2 },
  ],
  connectionPoints: [
    { cx: 80, cy: 100, r: 2.5 }, { cx: 80, cy: 70, r: 1.5 },
    { cx: 920, cy: 100, r: 2.5 }, { cx: 920, cy: 70, r: 1.5 },
    { cx: 80, cy: 900, r: 2.5 }, { cx: 920, cy: 900, r: 2.5 },
    { cx: 430, cy: 90, r: 1.5 }, { cx: 570, cy: 90, r: 1.5 },
    { cx: 500, cy: 90, r: 2 },
    { cx: 430, cy: 910, r: 1.5 }, { cx: 570, cy: 910, r: 1.5 },
    { cx: 500, cy: 910, r: 2 },
  ],
};

// ─── Component ──────────────────────────────────────────────────────────────

interface CircuitBackgroundProps {
  config: CircuitBackgroundConfig;
  /** ID of trace group to highlight (e.g., hovered service name) */
  activeTraceId?: string | null;
}

export function CircuitBackground({ config, activeTraceId }: CircuitBackgroundProps) {
  const viewBox = config.viewBox ?? '0 0 1000 1000';
  const [g0, g1, g2] = config.goldColors;
  const [c0, c1] = config.copperColors;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox={viewBox}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="cb-goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={g0} stopOpacity="0.6" />
          <stop offset="50%" stopColor={g1} stopOpacity="0.4" />
          <stop offset="100%" stopColor={g2} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="cb-copperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c0} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c1} stopOpacity="0.5" />
        </linearGradient>
        <filter id="cb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cb-glowActive" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feColorMatrix
            in="coloredBlur"
            type="matrix"
            values="1.5 0 0 0 0  0 1.2 0 0 0  0 0 0.5 0 0  0 0 0 1.5 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cb-particleGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Trace groups */}
      {config.traces.map((trace) => {
        const isActive = activeTraceId === trace.id;
        return (
          <g
            key={trace.id}
            filter={isActive ? 'url(#cb-glowActive)' : 'url(#cb-glow)'}
            style={{ transition: 'filter 0.3s ease', opacity: isActive ? 1 : 0.7 }}
          >
            {trace.paths.map((path, idx) => (
              <path
                key={idx}
                d={path.d}
                stroke={path.variant === 'gold' ? 'url(#cb-goldGrad)' : 'url(#cb-copperGrad)'}
                strokeWidth={path.width ?? (path.variant === 'gold' ? '1.5' : '1')}
                fill="none"
              />
            ))}
          </g>
        );
      })}

      {/* Connection points */}
      <g fill={g0} opacity="0.6">
        {config.connectionPoints.map((pt, i) => (
          <circle key={i} cx={pt.cx} cy={pt.cy} r={pt.r} />
        ))}
      </g>

      {/* Animated particles */}
      <g filter="url(#cb-particleGlow)">
        {config.particlePaths.map((p, i) => (
          <g key={i}>
            <circle r={p.radius} fill={p.color}>
              <animateMotion dur={`${p.duration}s`} repeatCount="indefinite">
                <mpath href={`#cb-ppath-${i}`} />
              </animateMotion>
            </circle>
            <path id={`cb-ppath-${i}`} d={p.d} fill="none" />
          </g>
        ))}
      </g>
    </svg>
  );
}

'use client';

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-neural-circuit';

interface CircuitBackgroundProps {
  className?: string;
  opacity?: 'low' | 'medium' | 'high';
  /** Enable animated data pulses along circuits */
  animated?: boolean;
  /** Color theme variant */
  variant?: 'cyan' | 'gold' | 'mixed';
  /** Fade out in center to avoid overlapping text */
  centerFade?: boolean;
}

export function CircuitBackground({
  className = '',
  opacity = 'medium',
  animated = true,
  variant = 'mixed',
  centerFade = false
}: CircuitBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Disable animations if user prefers reduced motion
  const shouldAnimate = animated && !prefersReducedMotion;
  // High opacity for clearly visible circuits
  const opacityValue = opacity === 'low' ? 0.5 : opacity === 'high' ? 0.9 : 0.7;

  // Color configurations
  const colors = {
    cyan: { primary: '#00E5FF', secondary: '#00AEEF', accent: '#00D4FF' },
    gold: { primary: '#F4D03F', secondary: '#D4AF37', accent: '#B8962F' },
    mixed: { primary: '#00E5FF', secondary: '#D4AF37', accent: '#00AEEF' }
  }[variant];

  // Center fade mask to avoid overlapping hero text
  const centerFadeStyle = centerFade ? {
    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, transparent 0%, black 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, transparent 0%, black 100%)'
  } : {};

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={centerFadeStyle}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Enhanced cyan gradient with glow */}
          <linearGradient id="circuit-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
            <stop offset="15%" stopColor={colors.primary} stopOpacity={opacityValue * 0.8} />
            <stop offset="50%" stopColor={colors.accent} stopOpacity={opacityValue} />
            <stop offset="85%" stopColor={colors.primary} stopOpacity={opacityValue * 0.8} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="circuit-cyan-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
            <stop offset="15%" stopColor={colors.primary} stopOpacity={opacityValue * 0.8} />
            <stop offset="50%" stopColor={colors.accent} stopOpacity={opacityValue} />
            <stop offset="85%" stopColor={colors.primary} stopOpacity={opacityValue * 0.8} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </linearGradient>

          {/* Gold gradient for premium traces */}
          <linearGradient id="circuit-gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0" />
            <stop offset="20%" stopColor={colors.secondary} stopOpacity={opacityValue * 0.9} />
            <stop offset="80%" stopColor={colors.secondary} stopOpacity={opacityValue * 0.9} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="circuit-gold-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0" />
            <stop offset="20%" stopColor={colors.secondary} stopOpacity={opacityValue * 0.9} />
            <stop offset="80%" stopColor={colors.secondary} stopOpacity={opacityValue * 0.9} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>

          {/* Crisp PCB-style glow filter - tight 2px outer glow */}
          <filter id="circuit-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated pulse gradient for data flow */}
          <linearGradient id="data-pulse-h" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0">
              {shouldAnimate && <animate attributeName="offset" values="0;1" dur="2s" repeatCount="indefinite" />}
            </stop>
            <stop offset="10%" stopColor={colors.primary} stopOpacity="1">
              {shouldAnimate && <animate attributeName="offset" values="0.1;1.1" dur="2s" repeatCount="indefinite" />}
            </stop>
            <stop offset="20%" stopColor={colors.primary} stopOpacity="0">
              {shouldAnimate && <animate attributeName="offset" values="0.2;1.2" dur="2s" repeatCount="indefinite" />}
            </stop>
          </linearGradient>

          {/* Node glow - tight crisp solder point style */}
          <radialGradient id="node-glow-cyan">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="60%" stopColor={colors.primary} stopOpacity="0.9" />
            <stop offset="85%" stopColor={colors.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="node-glow-gold">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="1" />
            <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.9" />
            <stop offset="85%" stopColor={colors.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === LEFT EDGE - Crisp PCB-style traces === */}
        <g filter="url(#circuit-glow-strong)">
          {/* Main left vertical spine - 1px crisp trace */}
          <path
            d="M 20 45 L 20 200 L 32 220 L 32 380 L 20 400 L 20 600 L 32 620 L 32 800 L 20 820 L 20 955"
            stroke="url(#circuit-cyan-v)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Secondary left trace - 0.75px, closer to cyan */}
          <path
            d="M 28 100 L 28 250 L 38 270 L 38 450 L 28 470 L 28 650 L 38 670 L 38 850 L 28 870 L 28 980"
            stroke="url(#circuit-gold-v)"
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
          />

          {/* Left branching circuits - 0.75px traces - PERIMETER ONLY */}
          <path d="M 20 200 L 80 200 L 100 180 L 120 180" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 32 380 L 70 380 L 90 400 L 110 400" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 20 600 L 80 600 L 100 580 L 120 580" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 32 800 L 70 800 L 90 820 L 110 820" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />

          {/* Cross-connects - 0.5px fine traces */}
          <path d="M 28 300 L 60 300 L 60 350 L 38 350" stroke="url(#circuit-cyan)" strokeWidth="0.5" fill="none" strokeLinecap="square" />
          <path d="M 28 550 L 55 550 L 55 600 L 20 600" stroke="url(#circuit-gold)" strokeWidth="0.5" fill="none" strokeLinecap="square" />
          <path d="M 28 750 L 70 750 L 70 800 L 32 800" stroke="url(#circuit-cyan)" strokeWidth="0.5" fill="none" strokeLinecap="square" />

          {/* Left edge solder nodes - smaller 3-4px diameter */}
          <circle cx="20" cy="200" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="32" cy="380" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />
          <circle cx="20" cy="600" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="32" cy="800" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />

          {/* Animated pulse nodes - 1px crisp data pulses */}
          {shouldAnimate && (
            <>
              <circle cx="100" cy="200" r="1" fill={colors.primary} opacity="0">
                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="cx" values="20;160" dur="1.5s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="90" cy="380" r="1" fill={colors.secondary} opacity="0">
                <animate attributeName="opacity" values="0;0.9;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="cx" values="32;150" dur="2s" begin="0.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>

        {/* === RIGHT EDGE - Crisp PCB-style traces === */}
        <g filter="url(#circuit-glow-strong)">
          {/* Main right vertical spine - 1px crisp trace */}
          <path
            d="M 980 45 L 980 200 L 968 220 L 968 380 L 980 400 L 980 600 L 968 620 L 968 800 L 980 820 L 980 955"
            stroke="url(#circuit-cyan-v)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Secondary right trace - 0.75px, closer to cyan */}
          <path
            d="M 972 100 L 972 250 L 962 270 L 962 450 L 972 470 L 972 650 L 962 670 L 962 850 L 972 870 L 972 980"
            stroke="url(#circuit-gold-v)"
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
          />

          {/* Right branching circuits - 0.75px traces - PERIMETER ONLY */}
          <path d="M 980 200 L 920 200 L 900 180 L 880 180" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 968 380 L 930 380 L 910 400 L 890 400" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 980 600 L 920 600 L 900 580 L 880 580" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 968 800 L 930 800 L 910 820 L 890 820" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />

          {/* Cross-connects - 0.5px fine traces */}
          <path d="M 972 300 L 940 300 L 940 350 L 962 350" stroke="url(#circuit-cyan)" strokeWidth="0.5" fill="none" strokeLinecap="square" />
          <path d="M 972 550 L 945 550 L 945 600 L 980 600" stroke="url(#circuit-gold)" strokeWidth="0.5" fill="none" strokeLinecap="square" />
          <path d="M 972 750 L 930 750 L 930 800 L 968 800" stroke="url(#circuit-cyan)" strokeWidth="0.5" fill="none" strokeLinecap="square" />

          {/* Right edge solder nodes - smaller 3-4px diameter */}
          <circle cx="980" cy="200" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="968" cy="380" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />
          <circle cx="980" cy="600" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="968" cy="800" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />

          {/* Animated pulse nodes - 1px crisp data pulses */}
          {shouldAnimate && (
            <>
              <circle cx="900" cy="200" r="1" fill={colors.primary} opacity="0">
                <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="cx" values="980;840" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="910" cy="600" r="1" fill={colors.primary} opacity="0">
                <animate attributeName="opacity" values="0;0.9;0" dur="1.8s" begin="0.8s" repeatCount="indefinite" />
                <animate attributeName="cx" values="980;830" dur="1.8s" begin="0.8s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>

        {/* === TOP EDGE - Crisp PCB-style traces === */}
        <g filter="url(#circuit-glow-strong)">
          {/* Main top horizontal spine - 1px crisp trace */}
          <path
            d="M 50 20 L 200 20 L 220 32 L 400 32 L 420 20 L 580 20 L 600 32 L 780 32 L 800 20 L 950 20"
            stroke="url(#circuit-cyan)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Secondary top trace - 0.75px, closer to cyan */}
          <path
            d="M 100 28 L 250 28 L 270 38 L 450 38 L 470 28 L 530 28 L 550 38 L 730 38 L 750 28 L 900 28"
            stroke="url(#circuit-gold)"
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
          />

          {/* Top branching circuits - 0.75px traces - PERIMETER ONLY */}
          <path d="M 200 20 L 200 80 L 180 100 L 180 120" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 400 32 L 400 70 L 420 90 L 420 110" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 600 32 L 600 70 L 580 90 L 580 110" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 800 20 L 800 80 L 820 100 L 820 120" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />

          {/* Top edge solder nodes - smaller 3-4px diameter */}
          <circle cx="200" cy="20" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="400" cy="32" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />
          <circle cx="600" cy="32" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.3} />
          <circle cx="800" cy="20" r="1.5" fill="url(#node-glow-gold)" opacity={opacityValue * 1.2} />

          {/* Animated data flow - 1px crisp pulse */}
          {shouldAnimate && (
            <>
              <circle cx="50" cy="20" r="1" fill={colors.primary} opacity="0">
                <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="cx" values="50;950" dur="3s" begin="0s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>

        {/* === BOTTOM EDGE - Crisp PCB-style traces === */}
        <g filter="url(#circuit-glow-strong)">
          {/* Main bottom horizontal spine - 1px crisp trace */}
          <path
            d="M 50 980 L 200 980 L 220 968 L 400 968 L 420 980 L 580 980 L 600 968 L 780 968 L 800 980 L 950 980"
            stroke="url(#circuit-cyan)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Secondary bottom trace - 0.75px, closer to cyan */}
          <path
            d="M 100 972 L 250 972 L 270 962 L 450 962 L 470 972 L 530 972 L 550 962 L 730 962 L 750 972 L 900 972"
            stroke="url(#circuit-gold)"
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
          />

          {/* Bottom branching circuits - 0.75px traces - PERIMETER ONLY */}
          <path d="M 200 980 L 200 920 L 180 900 L 180 880" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 400 968 L 400 930 L 420 910 L 420 890" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 600 968 L 600 930 L 580 910 L 580 890" stroke="url(#circuit-gold)" strokeWidth="0.75" fill="none" strokeLinecap="square" />
          <path d="M 800 980 L 800 920 L 820 900 L 820 880" stroke="url(#circuit-cyan)" strokeWidth="0.75" fill="none" strokeLinecap="square" />

          {/* Bottom edge solder nodes - smaller 3-4px diameter */}
          <circle cx="200" cy="980" r="2" fill="url(#node-glow-gold)" opacity={opacityValue * 1.3} />
          <circle cx="400" cy="968" r="1.5" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.2} />
          <circle cx="600" cy="968" r="2" fill="url(#node-glow-gold)" opacity={opacityValue * 1.3} />
          <circle cx="800" cy="980" r="1.5" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.2} />

          {/* Animated data flow - 1px crisp pulse */}
          {shouldAnimate && (
            <>
              <circle cx="950" cy="980" r="1" fill={colors.secondary} opacity="0">
                <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="cx" values="950;50" dur="3s" begin="1.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>

        {/* === CORNER CONNECTORS - Crisp PCB style === */}
        <g filter="url(#circuit-glow-strong)">
          {/* Top-left corner - 0.75px trace with 2px node */}
          <path
            d="M 25 45 L 25 24 L 50 24 L 50 20"
            stroke={colors.primary}
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={opacityValue * 1.4}
          />
          <circle cx="37" cy="24" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.5} />

          {/* Top-right corner */}
          <path
            d="M 975 45 L 975 24 L 950 24 L 950 20"
            stroke={colors.primary}
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={opacityValue * 1.4}
          />
          <circle cx="963" cy="24" r="2" fill="url(#node-glow-cyan)" opacity={opacityValue * 1.5} />

          {/* Bottom-left corner */}
          <path
            d="M 20 955 L 20 976 L 50 976 L 50 980"
            stroke={colors.secondary}
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={opacityValue * 1.4}
          />
          <circle cx="37" cy="976" r="2" fill="url(#node-glow-gold)" opacity={opacityValue * 1.5} />

          {/* Bottom-right corner */}
          <path
            d="M 980 955 L 980 976 L 950 976 L 950 980"
            stroke={colors.secondary}
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={opacityValue * 1.4}
          />
          <circle cx="963" cy="976" r="2" fill="url(#node-glow-gold)" opacity={opacityValue * 1.5} />
        </g>

        {/* === PERIMETER FLOATING DATA POINTS === */}
        <g>
          {/* Perimeter-only nodes with pulse animation */}
          {[
            { cx: 80, cy: 300, delay: 0, color: colors.primary },
            { cx: 920, cy: 350, delay: 1, color: colors.secondary },
            { cx: 100, cy: 650, delay: 2, color: colors.primary },
            { cx: 900, cy: 700, delay: 0.5, color: colors.secondary },
            { cx: 60, cy: 500, delay: 1.5, color: colors.primary },
            { cx: 940, cy: 450, delay: 2.5, color: colors.secondary },
          ].map((node, i) => (
            <g key={i}>
              <circle
                cx={node.cx}
                cy={node.cy}
                r="2"
                fill={node.color}
                opacity={opacityValue * 0.6}
              >
                {shouldAnimate && (
                  <animate
                    attributeName="opacity"
                    values={`${opacityValue * 0.3};${opacityValue * 0.8};${opacityValue * 0.3}`}
                    dur="3s"
                    begin={`${node.delay}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              {shouldAnimate && (
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="2"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="0.5"
                  opacity="0"
                >
                  <animate attributeName="r" values="2;12" dur="2s" begin={`${node.delay}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0" dur="2s" begin={`${node.delay}s`} repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Zap,
  Users,
  Handshake,
} from 'lucide-react';
import { useUISounds } from '@/hooks/use-ui-sounds';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useGestures } from '@/hooks/use-gestures';
import { useBehaviorTracker } from '@/hooks/behavior-tracking';
import { type NucleusService, type OrbPosition } from '@/types/nucleus';
import { OrbitalServiceNode } from '@/components/ui/branded/nucleus/orbital-service-node';
import { CircuitTraceGroup } from '@/components/ui/branded/nucleus/circuit-trace-group';
import { useOrbitalLayout, type OrbitalItem } from '@/hooks/use-orbital-layout';
import dynamic from 'next/dynamic';

const NucleusSphere = dynamic(
  () => import('@/components/ui/branded/nucleus/nucleus-sphere').then(m => ({ default: m.NucleusSphere })),
  { ssr: false, loading: () => <div className="h-[200px] w-[200px] rounded-full bg-nex-dark/50 animate-pulse" /> }
);
import { BRANDED_STRINGS } from '@/lib/branded-strings';

const services: NucleusService[] = [
  {
    name: 'Community',
    href: '/nucleus/community',
    icon: Users,
    description: 'Connect with healthcare professionals',
    color: 'pcb-gold',
    angle: 0, // 12 o'clock
    delay: '0s',
    isLive: true,
  },
  {
    name: 'Academy',
    href: '/nucleus/academy',
    icon: BookOpen,
    description: 'Build pharmaceutical capabilities',
    color: 'pcb-gold',
    angle: 45, // 1:30
    delay: '0.2s',
    isLive: true,
  },
  {
    name: 'Careers',
    href: '/nucleus/careers',
    icon: Briefcase,
    description: 'Career opportunities and advancement',
    color: 'pcb-gold',
    angle: 90, // 3 o'clock
    delay: '0.4s',
  },
  {
    name: 'Guardian',
    href: '/nucleus/guardian',
    icon: ShieldCheck,
    description: 'Independent safety monitoring',
    color: 'pcb-gold',
    angle: 135, // 4:30
    delay: '0.6s',
  },
  {
    name: 'Vigilance',
    href: '/nucleus/vigilance',
    icon: Activity,
    description: 'Signal detection and safety analysis',
    color: 'pcb-gold',
    angle: 180, // 6 o'clock
    delay: '0.8s',
  },
  {
    name: 'Solutions',
    href: '/nucleus/solutions',
    icon: Handshake,
    description: 'Professional B2B consulting services',
    color: 'pcb-gold',
    angle: 225, // 7:30
    delay: '1.0s',
  },
  {
    name: 'Ventures',
    href: '/nucleus/ventures',
    icon: Zap,
    description: 'Innovation and entrepreneurship',
    color: 'pcb-gold',
    angle: 270, // 9 o'clock
    delay: '1.2s',
  },
  {
    name: 'Insights',
    href: '/nucleus/insights',
    icon: BarChart3,
    description: 'Platform analytics and trend data',
    color: 'pcb-gold',
    angle: 315, // 10:30
    delay: '1.4s',
  },
];

// Orbital items derived from services — stable reference
const ORBITAL_ITEMS: OrbitalItem[] = services.map(s => ({ id: s.name, angle: s.angle }));

const ORBITAL_CONFIG = {
  centerSize: [192, 256] as [number, number],
  centerTextHeight: 100,
  centerPadding: 25,
  orbSizes: [80, 100, 128, 160] as [number, number, number, number],
  minWidth: 500,
};

const circuitTraces: Array<{ id: string; paths: Array<{ d: string; variant: 'gold' | 'copper'; width?: string }> }> = [
  {
    id: 'Ventures',
    paths: [
      { d: "M 0 100 H 80 L 100 120 V 180", variant: 'gold', width: '1.5' },
      { d: "M 0 160 H 60 L 80 180 H 120", variant: 'copper', width: '1' },
      { d: "M 80 0 V 60 L 100 80 H 150", variant: 'gold', width: '1' }
    ]
  },
  {
    id: 'Solutions',
    paths: [
      { d: "M 0 900 H 80 L 100 880 V 820", variant: 'gold', width: '1.5' },
      { d: "M 0 840 H 60 L 80 820 H 120", variant: 'copper', width: '1' },
      { d: "M 80 1000 V 940 L 100 920 H 150", variant: 'gold', width: '1' }
    ]
  },
  {
    id: 'Academy',
    paths: [
      { d: "M 1000 100 H 920 L 900 120 V 180", variant: 'gold', width: '1.5' },
      { d: "M 1000 160 H 940 L 920 180 H 880", variant: 'copper', width: '1' },
      { d: "M 920 0 V 60 L 900 80 H 850", variant: 'gold', width: '1' }
    ]
  },
  {
    id: 'Careers',
    paths: [
      { d: "M 1000 900 H 920 L 900 880 V 820", variant: 'gold', width: '1.5' },
      { d: "M 1000 840 H 940 L 920 820 H 880", variant: 'copper', width: '1' },
      { d: "M 920 1000 V 940 L 900 920 H 850", variant: 'gold', width: '1' }
    ]
  },
  {
    id: 'Community',
    paths: [
      { d: "M 350 0 V 80 L 380 110 H 450 L 480 130 V 150", variant: 'gold', width: '1.5' },
      { d: "M 500 0 V 100", variant: 'copper', width: '1' },
      { d: "M 650 0 V 80 L 620 110 H 550 L 520 130 V 150", variant: 'gold', width: '1.5' }
    ]
  },
  {
    id: 'Guardian',
    paths: [
      { d: "M 350 1000 V 920 L 380 890 H 450 L 480 870 V 850", variant: 'gold', width: '1.5' },
      { d: "M 500 1000 V 900", variant: 'copper', width: '1' },
      { d: "M 650 1000 V 920 L 620 890 H 550 L 520 870 V 850", variant: 'gold', width: '1.5' }
    ]
  }
];

export function NucleusHub() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [currentServiceIndex, setCurrentServiceIndex] = useState<number>(0);
  const [activityLevel, setActivityLevel] = useState<number>(0); // 0-100 for weather system
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const orbitalPositions = useOrbitalLayout(ORBITAL_ITEMS, ORBITAL_CONFIG);

  // Bridge OrbitalPosition → OrbPosition (same shape, different source)
  const orbPositions = useMemo(() => {
    const result = new Map<string, OrbPosition>();
    for (const [id, pos] of orbitalPositions) {
      result.set(id, pos);
    }
    return result;
  }, [orbitalPositions]);
  const { playHover, playClick, playSuccess } = useUISounds({
    volume: 0.2,
    enabled: false,
  });
  const { lightTap, mediumTap, heavyTap } = useHapticFeedback({
    enabled: true,
  });

  // Behavior tracking integration - Simplified for analytics only
  const { trackNavigation, startSession, endSession } = useBehaviorTracker();

  // Start session on mount
  useEffect(() => {
    startSession();
    return () => endSession();
  }, [startSession, endSession]);

  // Track activity for ambient weather system
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (activityLevel > 0) {
      timeout = setTimeout(() => {
        setActivityLevel((prev) => Math.max(0, prev - 5));
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [activityLevel]);

  const increaseActivity = (amount: number = 10) => {
    setActivityLevel((prev) => Math.min(100, prev + amount));
  };

  // Gesture controls for touch navigation
  useGestures(
    containerRef as React.RefObject<HTMLElement>,
    {
      onSwipeLeft: () => {
        const nextIndex = (currentServiceIndex + 1) % services.length;
        setCurrentServiceIndex(nextIndex);
        setHoveredService(services[nextIndex].name);
        playHover();
        lightTap();
        increaseActivity(15);
      },
      onSwipeRight: () => {
        const prevIndex =
          (currentServiceIndex - 1 + services.length) % services.length;
        setCurrentServiceIndex(prevIndex);
        setHoveredService(services[prevIndex].name);
        playHover();
        lightTap();
        increaseActivity(15);
      },
      onDoubleTap: () => {
        // Navigate to currently selected service
        if (hoveredService) {
          const service = services.find((s) => s.name === hoveredService);
          if (service) {
            playSuccess();
            heavyTap();
            increaseActivity(30);
            router.push(service.href);
          }
        }
      },
      onPinchOut: () => {
        // Expand view - could be used for zoom in future
        increaseActivity(20);
      },
    },
    { threshold: 50, enabled: true }
  );

  const handleServiceHover = (serviceName: string) => {
    setHoveredService(serviceName);
    setCurrentServiceIndex(services.findIndex((s) => s.name === serviceName));
    playHover();
    lightTap();
    increaseActivity(10);
  };

  const handleServiceLeave = () => {
    setHoveredService(null);
  };

  const handleServiceClick = (serviceName: string, href: string) => {
    playClick();
    mediumTap();
    increaseActivity(20);
    trackNavigation(href, serviceName); // Track navigation
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-nex-deep"
    >
      {/* Circuit Board SVG Background - z-0 to stay behind all content */}
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gold gradient for main traces */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#B87333" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.6" />
          </linearGradient>

          {/* Copper gradient for secondary traces */}
          <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B87333" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.5" />
          </linearGradient>

          {/* Glow filter for traces */}
          <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Enhanced glow for active/hovered traces */}
          <filter
            id="traceGlowActive"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feColorMatrix
              in="coloredBlur"
              type="matrix"
              values="1.5 0 0 0 0
                      0 1.2 0 0 0
                      0 0 0.5 0 0
                      0 0 0 1.5 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Circuit traces with reactive lighting - PERIMETER ONLY */}
        {circuitTraces.map((trace) => (
          <CircuitTraceGroup
            key={trace.id}
            id={trace.id}
            isActive={hoveredService === trace.id}
            paths={trace.paths}
          />
        ))}

        {/* Left edge horizontal traces (ambient) - stays within 12% */}
        <g filter="url(#traceGlow)" style={{ opacity: 0.5 }}>
          <path
            d="M 0 400 H 80 L 100 420 H 120"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 0 500 H 100"
            stroke="url(#copperGradient)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 0 600 H 80 L 100 580 H 120"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* Right edge horizontal traces (ambient) - stays within 12% */}
        <g filter="url(#traceGlow)" style={{ opacity: 0.5 }}>
          <path
            d="M 1000 400 H 920 L 900 420 H 880"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 1000 500 H 900"
            stroke="url(#copperGradient)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 1000 600 H 920 L 900 580 H 880"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* Circuit nodes/connection points - perimeter only */}
        <g fill="#D4AF37" opacity="0.6">
          {/* Top-left corner */}
          <circle cx="100" cy="120" r="3" />
          <circle cx="100" cy="80" r="2" />
          {/* Bottom-left corner */}
          <circle cx="100" cy="880" r="3" />
          <circle cx="100" cy="920" r="2" />
          {/* Top-right corner */}
          <circle cx="900" cy="120" r="3" />
          <circle cx="900" cy="80" r="2" />
          {/* Bottom-right corner */}
          <circle cx="900" cy="880" r="3" />
          <circle cx="900" cy="920" r="2" />
          {/* Top edge */}
          <circle cx="480" cy="140" r="2" />
          <circle cx="520" cy="140" r="2" />
          {/* Bottom edge */}
          <circle cx="480" cy="860" r="2" />
          <circle cx="520" cy="860" r="2" />
          {/* Left edge */}
          <circle cx="100" cy="420" r="2" />
          <circle cx="100" cy="580" r="2" />
          {/* Right edge */}
          <circle cx="900" cy="420" r="2" />
          <circle cx="900" cy="580" r="2" />
        </g>

        {/* Animated particles flowing along traces */}
        <defs>
          <filter
            id="particleGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Particles flowing along perimeter traces */}
        <g filter="url(#particleGlow)">
          {/* Top-left corner particle */}
          <circle r="4" fill="#D4AF37">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href="#particlePath1" />
            </animateMotion>
          </circle>
          <path
            id="particlePath1"
            d="M 0 100 H 80 L 100 120 V 180"
            fill="none"
          />

          {/* Left edge particle */}
          <circle r="5" fill="#F5D78E">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath href="#particlePath2" />
            </animateMotion>
          </circle>
          <path id="particlePath2" d="M 0 500 H 100" fill="none" />

          {/* Bottom-left corner particle */}
          <circle r="4" fill="#B87333">
            <animateMotion dur="3.5s" repeatCount="indefinite">
              <mpath href="#particlePath3" />
            </animateMotion>
          </circle>
          <path
            id="particlePath3"
            d="M 0 900 H 80 L 100 880 V 820"
            fill="none"
          />

          {/* Top-right corner particle */}
          <circle r="4" fill="#D4AF37">
            <animateMotion dur="3.2s" repeatCount="indefinite">
              <mpath href="#particlePath4" />
            </animateMotion>
          </circle>
          <path
            id="particlePath4"
            d="M 1000 100 H 920 L 900 120 V 180"
            fill="none"
          />

          {/* Right edge particle */}
          <circle r="5" fill="#F5D78E">
            <animateMotion dur="4.2s" repeatCount="indefinite">
              <mpath href="#particlePath5" />
            </animateMotion>
          </circle>
          <path id="particlePath5" d="M 1000 500 H 900" fill="none" />

          {/* Bottom-right corner particle */}
          <circle r="4" fill="#B87333">
            <animateMotion dur="3.8s" repeatCount="indefinite">
              <mpath href="#particlePath6" />
            </animateMotion>
          </circle>
          <path
            id="particlePath6"
            d="M 1000 900 H 920 L 900 880 V 820"
            fill="none"
          />

          {/* Top edge particle */}
          <circle r="4" fill="#D4AF37">
            <animateMotion dur="2s" repeatCount="indefinite">
              <mpath href="#particlePath7" />
            </animateMotion>
          </circle>
          <path id="particlePath7" d="M 500 0 V 100" fill="none" />

          {/* Bottom edge particle */}
          <circle r="4" fill="#D4AF37">
            <animateMotion dur="2s" repeatCount="indefinite">
              <mpath href="#particlePath8" />
            </animateMotion>
          </circle>
          <path id="particlePath8" d="M 500 1000 V 900" fill="none" />
        </g>
      </svg>

      {/* Ambient Particle Field - Static */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="bg-pcb-gold/40 absolute rounded-full opacity-20 shadow-[0_0_6px_rgba(212,175,55,0.6)]"
          style={{
            width: i % 2 === 0 ? '2px' : '3px',
            height: i % 2 === 0 ? '2px' : '3px',
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 100}%`,
            animationDuration: `${15 + (i % 10)}s`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Ambient Weather System - Activity-responsive particles - TUNED FOR PROFESSIONAL SUBTLETY */}
      {activityLevel > 0 &&
        Array.from({ length: Math.floor(activityLevel / 10) }).map((_, i) => {
          // Reduced particle count (div 10 instead of 5)
          const seed = (i * 23 + 11) % 100;
          const size = 2 + activityLevel / 40; // Smaller particles
          const startX = (i * 37 + 7) % 100;
          const duration = 4 + (seed % 4); // Slower animation
          const delay = (i * 0.3) % 3;

          // Particle type based on activity level
          const isEnergized = activityLevel > 60; // Higher threshold
          const isSupercharged = activityLevel > 90; // Higher threshold

          return (
            <div
              key={`weather-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${startX}%`,
                bottom: '0%',
                background: isSupercharged
                  ? 'rgba(0, 174, 239, 0.6)' // Reduced opacity
                  : isEnergized
                    ? 'rgba(212, 175, 55, 0.5)' // Reduced opacity
                    : 'rgba(184, 115, 51, 0.3)', // Reduced opacity
                boxShadow: isSupercharged
                  ? '0 0 8px rgba(0, 174, 239, 0.5)' // Reduced glow
                  : isEnergized
                    ? '0 0 6px rgba(212, 175, 55, 0.4)'
                    : 'none',
                animation: `weatherRise ${duration}s ease-out ${delay}s forwards`,
                opacity: activityLevel / 150, // Lower overall opacity cap
              }}
            />
          );
        })}
      <style jsx global>{`
        @keyframes floatParticle {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(15px, -10px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: translate(-10px, 20px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translate(20px, 10px) scale(1.1);
            opacity: 0.5;
          }
        }
        .animate-float-particle {
          animation: floatParticle ease-in-out infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .shimmer-effect {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spinSlow linear infinite;
        }
        @keyframes weatherRise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes dataStreamToCenter {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          90% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.3);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
        }
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes eyeGlow {
          0%,
          100% {
            opacity: 0.6;
            box-shadow:
              0 0 40px rgba(0, 174, 239, 0.4),
              0 0 80px rgba(212, 175, 55, 0.2);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 80px rgba(0, 174, 239, 0.7),
              0 0 160px rgba(212, 175, 55, 0.5);
          }
        }
        @keyframes orbEntrance {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          60% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .orb-entrance {
          animation: orbEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
      `}</style>

      {/* Subtle grid overlay for depth - z-0 background layer */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Radial glow from center - gold tinted - z-0 background layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.08) 0%, rgba(184, 115, 51, 0.04) 30%, transparent 60%)',
        }}
      />

      {/* Radial light beams from center - gold/cyan mix - z-0 background layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(212, 175, 55, 0.4) 5deg, transparent 15deg, transparent 45deg, rgba(0, 174, 239, 0.3) 50deg, transparent 60deg, transparent 90deg, rgba(212, 175, 55, 0.4) 95deg, transparent 105deg, transparent 135deg, rgba(0, 174, 239, 0.3) 140deg, transparent 150deg, transparent 180deg, rgba(212, 175, 55, 0.4) 185deg, transparent 195deg, transparent 225deg, rgba(0, 174, 239, 0.3) 230deg, transparent 240deg, transparent 270deg, rgba(212, 175, 55, 0.4) 275deg, transparent 285deg, transparent 315deg, rgba(0, 174, 239, 0.3) 320deg, transparent 330deg, transparent 360deg)',
        }}
      />

      {/* Vignette effect - stronger for focus - z-[1] to sit just above backgrounds */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 0%, transparent 35%, rgba(10, 25, 41, 0.6) 100%)',
        }}
      />

      {/* Main content container - z-10 above all backgrounds */}
      <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center">
        {/* Desktop: Orbital layout, Mobile: Vertical stack */}
        <div className="relative h-full w-full">
          {/* Orbit Ring - Disabled for now
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className="absolute w-[300px] h-[300px] rounded-full animate-spin-slow"
              style={{
                marginLeft: '-150px',
                marginTop: '-150px',
                border: '2px dashed rgba(0, 174, 239, 0.3)',
                boxShadow: '0 0 20px rgba(0, 174, 239, 0.15)',
                animationDuration: '60s',
              }}
            />
          </div>
          */}

          {/* Data Stream Visualization - Particles flowing to center on hover */}
          {hoveredService && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ zIndex: 1 }}
            >
              {/* Generate multiple data particles */}
              {Array.from({ length: 8 }).map((_, i) => {
                const service = services.find((s) => s.name === hoveredService);
                if (!service) return null;

                // Use dynamic position from hook
                const position = orbPositions.get(service.name);
                if (!position) return null;

                const delay = i * 0.15;
                const duration = 1.5 + (i % 3) * 0.3;

                return (
                  <div
                    key={i}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                      background:
                        i % 2 === 0
                          ? 'rgba(0, 174, 239, 0.8)'
                          : 'rgba(212, 175, 55, 0.8)',
                      boxShadow:
                        i % 2 === 0
                          ? '0 0 8px rgba(0, 174, 239, 0.6), 0 0 16px rgba(0, 174, 239, 0.3)'
                          : '0 0 8px rgba(212, 175, 55, 0.6), 0 0 16px rgba(212, 175, 55, 0.3)',
                      animation: `dataStreamToCenter ${duration}s ease-in-out ${delay}s infinite`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Connection Lines (hover effect) - Behind orbs */}
          {hoveredService && (() => {
            const service = services.find((s) => s.name === hoveredService);
            const position = service ? orbPositions.get(service.name) : null;
            if (!service || !position) return null;

            // Gold gradient colors for each service
            const gradientColors: Record<string, string> = {
              Solutions: 'rgba(212, 175, 55, 0.7)',
              Academy: 'rgba(234, 179, 8, 0.7)',
              Community: 'rgba(245, 158, 11, 0.7)',
              Careers: 'rgba(180, 83, 9, 0.7)',
              Guardian: 'rgba(202, 138, 4, 0.7)',
              Vigilance: 'rgba(239, 68, 68, 0.7)',
              Ventures: 'rgba(250, 204, 21, 0.7)',
            };

            const color = gradientColors[service.name] || 'rgba(212, 175, 55, 0.7)';

            return (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '2px',
                  height: Math.sqrt(position.x ** 2 + position.y ** 2),
                  background: `linear-gradient(to top, ${color}, transparent)`,
                  transformOrigin: 'bottom center',
                  transform: `translate(-50%, -100%) rotate(${Math.atan2(position.x, -position.y) * (180 / Math.PI)}deg)`,
                  zIndex: 1,
                }}
              />
            );
          })()}

          {/* Central 3D Nucleus Sphere */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            {/* Ambient glow behind sphere */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                animation: 'eyeGlow 4s ease-in-out infinite',
                boxShadow:
                  '0 0 40px rgba(212, 175, 55, 0.5), 0 0 80px rgba(0, 174, 239, 0.3), 0 0 120px rgba(212, 175, 55, 0.15)',
              }}
            />

            {/* Three.js Sphere — replaces CSS gradient blob */}
            <div className="relative">
              <NucleusSphere className="rounded-full" />
            </div>

            {/* Nucleus title */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
              <h1
                className="font-headline text-lg font-bold text-white/90 md:text-xl"
                style={{
                  textShadow:
                    '0 0 20px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {BRANDED_STRINGS.nucleus.title}
              </h1>
              <p
                className="mt-1 text-xs font-semibold tracking-wide text-cyan/80 md:text-sm"
                style={{
                  textShadow:
                    '0 0 15px rgba(0, 174, 239, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {BRANDED_STRINGS.nucleus.subtitle}
              </p>
            </div>
          </div>

          {/* Service Orbs */}
          {services.map((service) => (
            <OrbitalServiceNode
              key={service.name}
              service={service}
              position={orbPositions.get(service.name) || { x: 0, y: 0, scale: 1, size: 128, visible: false }}
              onMouseEnter={() => handleServiceHover(service.name)}
              onMouseLeave={handleServiceLeave}
              onClick={() => handleServiceClick(service.name, service.href)}
            />
          ))}


          {/* Show hint to use navigation menu when orbs are hidden */}
          {!orbPositions.get('Solutions')?.visible && (
            <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 text-center">
              <p className="text-golden-sm text-slate-dim/70">
                {BRANDED_STRINGS.nucleus.navigationHint}
              </p>
            </div>
          )}

          {/* Scroll down hint */}
          <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-1 text-slate-dim/50 animate-bounce">
            <span className="text-xs font-mono uppercase tracking-widest">All Services</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}

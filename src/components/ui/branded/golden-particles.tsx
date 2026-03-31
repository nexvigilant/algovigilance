'use client';

import { useRef, useEffect, useCallback } from 'react';

/**
 * Golden Angle particle distribution.
 *
 * Each particle is placed at angle = i × 137.508° (the golden angle),
 * creating the same Fibonacci spiral pattern seen in sunflower seeds,
 * pinecones, and galaxy arms.
 *
 * Why 137.508°? It's 360° × (1 - 1/φ) where φ = 1.618033...
 * This angle maximizes the packing efficiency — no two particles
 * align radially, creating the most uniform distribution possible.
 *
 * STEM grounding:
 * - N (Quantity): particle count
 * - ν (Frequency): golden angle = 2π(2-φ) radians
 * - λ (Location): polar → cartesian mapping
 * - σ (Sequence): Fibonacci spiral ordering
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399963 rad = 137.508°
const PHI = (1 + Math.sqrt(5)) / 2; // 1.618033988749895

interface GoldenParticlesProps {
  /** Number of particles. Default: 80 */
  count?: number;
  /** Base color as [r, g, b] 0-255. Default: cyan [0, 174, 239] */
  color?: [number, number, number];
  /** Secondary color for alternating particles. Default: gold [212, 175, 55] */
  secondaryColor?: [number, number, number];
  /** Max particle radius in px. Default: 2.5 */
  maxRadius?: number;
  /** Animation speed multiplier. Default: 1.0 */
  speed?: number;
  className?: string;
}

export function GoldenParticles({
  count = 80,
  color = [0, 174, 239],
  secondaryColor = [212, 175, 55],
  maxRadius = 2.5,
  speed = 1.0,
  className,
}: GoldenParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  const animate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      particles: Array<{
        angle: number;
        radius: number;
        size: number;
        color: [number, number, number];
        speed: number;
        phase: number;
      }>
    ) => {
      const now = performance.now() * 0.001 * speed;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.45;

      for (const p of particles) {
        // Particles slowly orbit using golden angle rotation
        const angle = p.angle + now * p.speed * 0.05;
        const r = p.radius * maxR;

        // Gentle radial breathing (Langmuir-inspired saturation oscillation)
        const breathe = 1 + Math.sin(now * 0.3 + p.phase) * 0.08;
        const x = cx + Math.cos(angle) * r * breathe;
        const y = cy + Math.sin(angle) * r * breathe;

        // Alpha pulses with golden ratio period offset
        const alpha =
          0.15 + 0.35 * Math.pow(Math.sin(now * 0.5 + p.phase * PHI), 2);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${alpha})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(() =>
        animate(ctx, w, h, particles)
      );
    },
    [speed]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      return { w: rect.width, h: rect.height };
    };

    const dims = resize();
    if (!dims) return;

    // Generate particles using golden angle distribution
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = i * GOLDEN_ANGLE;
      // Square root spacing for uniform area distribution (Vogel's model)
      const radius = Math.sqrt(i / count);
      // Fibonacci-indexed size variation
      const fibIndex = (i * PHI) % 1;
      const size = maxRadius * (0.3 + 0.7 * fibIndex);
      // Alternate colors with golden ratio
      const useSecondary = (i * PHI) % 1 > 0.618;

      return {
        angle,
        radius,
        size,
        color: useSecondary ? secondaryColor : color,
        speed: 0.5 + fibIndex * 1.5,
        phase: i * GOLDEN_ANGLE,
      };
    });

    animate(ctx, dims.w, dims.h, particles);

    const handleResize = () => {
      cancelAnimationFrame(frameRef.current);
      const newDims = resize();
      if (newDims) {
        animate(ctx, newDims.w, newDims.h, particles);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [count, color, secondaryColor, maxRadius, speed, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}

'use client';

import { useCallback, useRef } from 'react';

/**
 * Damped harmonic oscillator for spring-like hover effects.
 *
 * Physics: x(t) = A × e^(-ζωt) × cos(ωd × t + φ)
 *
 * Where:
 * - ζ (zeta) = damping ratio (0 = no damping, 1 = critical, >1 = overdamped)
 * - ω = natural frequency = 2π/T
 * - ωd = damped frequency = ω × √(1 - ζ²)
 * - A = initial amplitude
 *
 * STEM grounding:
 * - stem_phys_period: T = 1/f (frequency → period conversion)
 * - stem_phys_amplitude: displacement with superposition
 * - stem_phys_inertia: resistance = mass × change
 *
 * Transfer: mechanical spring → UI element displacement
 * Confidence: 0.92 (direct physics → animation mapping)
 *
 * @example
 * ```tsx
 * const spring = useSpringPhysics({ stiffness: 300, damping: 0.6 });
 *
 * <div
 *   onMouseEnter={() => spring.trigger(el, { y: -4, scale: 1.02 })}
 *   onMouseLeave={() => spring.release(el)}
 *   ref={el => spring.register(el)}
 * />
 * ```
 */

interface SpringConfig {
  /** Spring stiffness (higher = faster oscillation). Default: 200 */
  stiffness?: number;
  /** Damping ratio (0-1). 0.6 = bouncy, 0.8 = smooth, 1.0 = no bounce. Default: 0.65 */
  damping?: number;
  /** Mass of the element (higher = more inertia). Default: 1.0 */
  mass?: number;
}

interface SpringTransform {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
}

/**
 * Physics-based spring animation hook using damped harmonic oscillator.
 *
 * More natural than CSS transitions — elements have mass, stiffness, and damping.
 * The spring oscillates and settles, creating organic micro-interactions.
 */
export function useSpringPhysics(config: SpringConfig = {}) {
  const { stiffness = 200, damping = 0.65, mass = 1.0 } = config;
  const animations = useRef<Map<HTMLElement, number>>(new Map());

  // Derived physics constants
  // ω = √(k/m) — natural angular frequency
  const omega = Math.sqrt(stiffness / mass);
  // ωd = ω × √(1 - ζ²) — damped frequency (only for underdamped ζ < 1)
  const omegaD = omega * Math.sqrt(Math.max(0, 1 - damping * damping));

  const animateSpring = useCallback(
    (
      element: HTMLElement,
      target: SpringTransform,
      from: SpringTransform,
      startTime: number
    ) => {
      const elapsed = (performance.now() - startTime) / 1000;

      // Damped oscillation: e^(-ζωt) × cos(ωd × t)
      const decay = Math.exp(-damping * omega * elapsed);
      const oscillation = damping < 1 ? Math.cos(omegaD * elapsed) : 1;
      const factor = 1 - decay * oscillation;

      // Interpolate each transform property
      const x = (from.x ?? 0) + ((target.x ?? 0) - (from.x ?? 0)) * factor;
      const y = (from.y ?? 0) + ((target.y ?? 0) - (from.y ?? 0)) * factor;
      const scale =
        (from.scale ?? 1) + ((target.scale ?? 1) - (from.scale ?? 1)) * factor;
      const rotate =
        (from.rotate ?? 0) +
        ((target.rotate ?? 0) - (from.rotate ?? 0)) * factor;

      element.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;

      // Continue until amplitude is negligible (< 0.001)
      if (decay > 0.001) {
        const frameId = requestAnimationFrame(() =>
          animateSpring(element, target, from, startTime)
        );
        animations.current.set(element, frameId);
      } else {
        // Snap to final position
        const fx = target.x ?? 0;
        const fy = target.y ?? 0;
        const fs = target.scale ?? 1;
        const fr = target.rotate ?? 0;
        element.style.transform = `translate(${fx}px, ${fy}px) scale(${fs}) rotate(${fr}deg)`;
        animations.current.delete(element);
      }
    },
    [damping, omega, omegaD]
  );

  const trigger = useCallback(
    (element: HTMLElement | null, target: SpringTransform) => {
      if (!element) return;

      // Cancel any in-progress animation
      const existing = animations.current.get(element);
      if (existing) cancelAnimationFrame(existing);

      const from: SpringTransform = { x: 0, y: 0, scale: 1, rotate: 0 };
      animateSpring(element, target, from, performance.now());
    },
    [animateSpring]
  );

  const release = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      const existing = animations.current.get(element);
      if (existing) cancelAnimationFrame(existing);

      // Parse current transform to spring back from
      const current = parseCurrentTransform(element);
      const rest: SpringTransform = { x: 0, y: 0, scale: 1, rotate: 0 };
      animateSpring(element, rest, current, performance.now());
    },
    [animateSpring]
  );

  return { trigger, release };
}

function parseCurrentTransform(element: HTMLElement): SpringTransform {
  const style = element.style.transform;
  if (!style) return { x: 0, y: 0, scale: 1, rotate: 0 };

  const translateMatch = style.match(
    /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/
  );
  const scaleMatch = style.match(/scale\(([-\d.]+)\)/);
  const rotateMatch = style.match(/rotate\(([-\d.]+)deg\)/);

  return {
    x: translateMatch ? parseFloat(translateMatch[1]) : 0,
    y: translateMatch ? parseFloat(translateMatch[2]) : 0,
    scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
    rotate: rotateMatch ? parseFloat(rotateMatch[1]) : 0,
  };
}

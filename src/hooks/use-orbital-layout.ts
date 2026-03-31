'use client';

import { useState, useEffect } from 'react';

// ─── Orbital Layout Hook ────────────────────────────────────────────────────
//
// Positions items on a responsive elliptical orbit around a protected center zone.
// Handles viewport resize, responsive sizing, and overlap prevention.

export interface OrbitalItem {
  id: string;
  /** Angle in degrees from top, clockwise. 0 = 12 o'clock, 90 = 3 o'clock */
  angle: number;
}

export interface OrbitalPosition {
  x: number;
  y: number;
  scale: number;
  size: number;
  visible: boolean;
}

export interface OrbitalLayoutConfig {
  /** Pixel size of the protected center element: [mobile, desktop] */
  centerSize: [number, number];
  /** Extra vertical space below center (e.g., for text). Default 100 */
  centerTextHeight?: number;
  /** Padding around protected zone. Default 25 */
  centerPadding?: number;
  /** Orb size breakpoints: [sm, md, lg, xl]. Default [80, 100, 128, 160] */
  orbSizes?: [number, number, number, number];
  /** Minimum viewport width to show orbital layout. Default 500 */
  minWidth?: number;
}

const DEFAULT_ORB_SIZES: [number, number, number, number] = [80, 100, 128, 160];

export function useOrbitalLayout(
  items: OrbitalItem[],
  config: OrbitalLayoutConfig
): Map<string, OrbitalPosition> {
  const [positions, setPositions] = useState<Map<string, OrbitalPosition>>(new Map());

  useEffect(() => {
    const calculate = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const [mobileCenterSize, desktopCenterSize] = config.centerSize;
      const centerSize = vw >= 768 ? desktopCenterSize : mobileCenterSize;
      const centerRadius = centerSize / 2;
      const textHeight = config.centerTextHeight ?? 100;
      const padding = config.centerPadding ?? 25;
      const orbSizes = config.orbSizes ?? DEFAULT_ORB_SIZES;
      const minWidth = config.minWidth ?? 500;

      // Protected ellipse
      const protectedRadiusX = centerRadius + padding;
      const protectedRadiusY = centerRadius + textHeight / 2 + padding;

      // Responsive orb size
      let baseOrbSize: number;
      if (vw >= 1280) baseOrbSize = orbSizes[3];
      else if (vw >= 1024) baseOrbSize = orbSizes[2];
      else if (vw >= 768) baseOrbSize = orbSizes[1];
      else baseOrbSize = orbSizes[0];

      const orbRadius = baseOrbSize / 2;

      // Orbital radius bounds
      const minOrbitalRadius = Math.max(protectedRadiusX, protectedRadiusY) + orbRadius + 5;
      const edgeMargin = orbRadius + 15;
      const maxOrbitalRadiusX = (vw / 2) - edgeMargin;
      const maxOrbitalRadiusY = (vh / 2) - edgeMargin;

      const hasEnoughSpace =
        maxOrbitalRadiusX >= minOrbitalRadius * 0.7 &&
        maxOrbitalRadiusY >= minOrbitalRadius * 0.7 &&
        vw >= minWidth;

      // Scale factor
      const spaceRatioX = maxOrbitalRadiusX / minOrbitalRadius;
      const spaceRatioY = maxOrbitalRadiusY / minOrbitalRadius;
      const spaceRatio = Math.min(spaceRatioX, spaceRatioY);
      const scale = spaceRatio < 1 ? Math.max(0.5, spaceRatio) : 1;

      const orbSize = baseOrbSize * scale;
      const orbitalRadiusX = Math.max(minOrbitalRadius * scale, Math.min(maxOrbitalRadiusX, vw * 0.28));
      const orbitalRadiusY = Math.max(minOrbitalRadius * scale, Math.min(maxOrbitalRadiusY, vh * 0.30));

      const result = new Map<string, OrbitalPosition>();

      for (const item of items) {
        const angleRad = ((item.angle - 90) * Math.PI) / 180;
        const x = Math.cos(angleRad) * orbitalRadiusX;
        const y = Math.sin(angleRad) * orbitalRadiusY;
        result.set(item.id, { x, y, scale, size: orbSize, visible: hasEnoughSpace });
      }

      setPositions(result);
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [items, config]);

  return positions;
}

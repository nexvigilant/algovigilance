'use client';

import { useMemo } from 'react';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface ConstellationConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

interface CompetencyNode {
  id: string;
  name: string;
  domain: string;
  mastery: number; // 0-100
  connections: string[]; // IDs of related competencies
  position?: { x: number; y: number };
}

interface ConstellationData {
  nodes: CompetencyNode[];
  clusters: { domain: string; center: { x: number; y: number } }[];
  gaps: { x: number; y: number; size: number }[];
}

export function useCompetencyConstellation(
  completedKSBs: CompetencyNode[],
  config: ConstellationConfig = {}
) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;

  // Generate constellation layout
  const constellation = useMemo((): ConstellationData => {
    if (!enabled || completedKSBs.length === 0) {
      return { nodes: [], clusters: [], gaps: [] };
    }

    // Group by domain
    const domains = new Map<string, CompetencyNode[]>();
    completedKSBs.forEach((ksb) => {
      const list = domains.get(ksb.domain) || [];
      list.push(ksb);
      domains.set(ksb.domain, list);
    });

    // Calculate cluster positions (circular layout)
    const clusters: { domain: string; center: { x: number; y: number } }[] = [];
    const domainArray = Array.from(domains.keys());
    const angleStep = (2 * Math.PI) / Math.max(domainArray.length, 1);

    domainArray.forEach((domain, i) => {
      const angle = i * angleStep - Math.PI / 2;
      clusters.push({
        domain,
        center: {
          x: 50 + Math.cos(angle) * 30,
          y: 50 + Math.sin(angle) * 30,
        },
      });
    });

    // Position nodes within clusters
    const nodes: CompetencyNode[] = [];
    clusters.forEach((cluster) => {
      const domainNodes = domains.get(cluster.domain) || [];
      const nodeAngleStep = (2 * Math.PI) / Math.max(domainNodes.length, 1);

      domainNodes.forEach((node, i) => {
        const angle = i * nodeAngleStep;
        const radius = 5 + Math.random() * 10;
        nodes.push({
          ...node,
          position: {
            x: cluster.center.x + Math.cos(angle) * radius,
            y: cluster.center.y + Math.sin(angle) * radius,
          },
        });
      });
    });

    // Identify gaps (areas without competencies)
    const gaps: { x: number; y: number; size: number }[] = [];
    // Simple gap detection - check grid points
    for (let x = 10; x <= 90; x += 20) {
      for (let y = 10; y <= 90; y += 20) {
        const nearbyNodes = nodes.filter((n) => {
          if (!n.position) return false;
          const dx = n.position.x - x;
          const dy = n.position.y - y;
          return Math.sqrt(dx * dx + dy * dy) < 15;
        });

        if (nearbyNodes.length === 0) {
          gaps.push({ x, y, size: 10 });
        }
      }
    }

    return { nodes, clusters, gaps };
  }, [enabled, completedKSBs]);

  // Effect based on constellation density
  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;
    const density = completedKSBs.length / 50; // Normalize to expected ~50 KSBs

    // More complete constellation = brighter, more connected effect
    if (density > 0.8) {
      return {
        primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
        secondaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
        glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.8})`,
        particleCount: Math.round(15 * effectIntensity),
        particleSpeed: 1.5,
        particleDirection: 'orbital',
        trailEffect: true,
        waveEffect: true,
        intensity: effectIntensity,
      };
    } else if (density > 0.4) {
      return {
        primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
        secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.5})`,
        glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.6})`,
        particleCount: Math.round(10 * effectIntensity),
        particleSpeed: 1,
        particleDirection: 'orbital',
        intensity: effectIntensity * 0.8,
      };
    } else {
      // Sparse - developing
      return {
        primaryColor: `rgba(184, 115, 51, ${effectIntensity})`,
        glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.4})`,
        particleCount: Math.round(5 * effectIntensity),
        particleSpeed: 0.5,
        particleDirection: 'inward',
        intensity: effectIntensity * 0.5,
      };
    }
  }, [enabled, tier, intensity, completedKSBs]);

  return {
    effect,
    constellation,
    totalNodes: constellation.nodes.length,
    gapCount: constellation.gaps.length,
    clusterCount: constellation.clusters.length,
  };
}

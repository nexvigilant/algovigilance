'use client'

/**
 * Semantic Zoom — Camera-distance-aware level-of-detail rendering.
 *
 * Section 5.2 of the Observatory 3D Rendering Architecture.
 *
 * Level 1 (>200): Cluster clouds with aggregate labels
 * Level 2 (>80):  Individual nodes with drug names
 * Level 3 (>20):  Detailed nodes with labels, halos, sparklines
 * Level 4 (<20):  Single-node focus with full data card
 */

import { useState, useCallback, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import type * as THREE from 'three'
import { COLORS, MATERIAL, GLOW, LABEL, GEOMETRY, SEMANTIC_ZOOM } from './observatory-constants'
import type { SemanticZoomLevel } from '@/lib/observatory/types'

// ─── LOD Geometry Segments ───────────────────────────────────────────────────

export const LOD_SEGMENTS = {
  medium: [8, 8] as const,
  close: [32, 32] as const,
} as const

// ─── useSemanticZoom Hook ────────────────────────────────────────────────────

/**
 * Returns the current semantic zoom level based on camera distance.
 */
export function useSemanticZoom(): SemanticZoomLevel {
  const { camera } = useThree()
  const [level, setLevel] = useState<SemanticZoomLevel>(2)
  const levelRef = useRef<SemanticZoomLevel>(2)

  useFrame(() => {
    const dist = camera.position.length()
    let newLevel: SemanticZoomLevel

    if (dist > SEMANTIC_ZOOM.level1) {
      newLevel = 1
    } else if (dist > SEMANTIC_ZOOM.level2) {
      newLevel = 2
    } else if (dist > SEMANTIC_ZOOM.level3) {
      newLevel = 3
    } else {
      newLevel = 4
    }

    if (newLevel !== levelRef.current) {
      levelRef.current = newLevel
      setLevel(newLevel)
    }
  })

  return level
}

// ─── Adaptive Node ───────────────────────────────────────────────────────────

interface AdaptiveNodeProps {
  position: THREE.Vector3
  label: string
  size: number
  color: string
  zoomLevel: SemanticZoomLevel
  onClick?: () => void
  active?: boolean
  detail?: string
}

/**
 * Renders different geometry and detail based on semantic zoom level.
 *
 * - Far: Points material (cheapest)
 * - Medium: Low-poly sphere + meshBasicMaterial
 * - Close: Full sphere + PBR material + Billboard label + glow + tooltip
 */
export function AdaptiveNode({
  position,
  label,
  size,
  color,
  zoomLevel,
  onClick,
  active = false,
  detail,
}: AdaptiveNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback(() => onClick?.(), [onClick])

  // Level 1: Point sprite — low-poly sphere with basic material (cheapest 3D)
  if (zoomLevel === 1) {
    return (
      <group position={position}>
        <mesh scale={size * 0.5}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    )
  }

  // Level 2: Low-poly sphere, basic material, drug name only
  if (zoomLevel === 2) {
    return (
      <group position={position}>
        <mesh
          scale={size}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1, ...LOD_SEGMENTS.medium]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? 1.0 : 0.85} />
        </mesh>
        <Billboard>
          <Text
            font="/fonts/inter-latin.woff2"
            position={[0, size + LABEL.offsetY * 0.6, 0]}
            fontSize={LABEL.fontSize * 0.7}
            color={COLORS.textPrimary}
            anchorX="center"
            anchorY="bottom"
          >
            {label}
          </Text>
        </Billboard>
      </group>
    )
  }

  // Level 3: Full sphere + PBR + label + glow
  if (zoomLevel === 3) {
    return (
      <group position={position}>
        <mesh
          ref={meshRef}
          scale={size}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1, ...LOD_SEGMENTS.close]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? MATERIAL.emissiveActive : hovered ? MATERIAL.emissiveHover : MATERIAL.emissiveIdle}
            roughness={MATERIAL.roughness}
            metalness={MATERIAL.metalness}
          />
        </mesh>
        {/* Glow halo */}
        <mesh scale={size * GLOW.nodeSphereScale}>
          <sphereGeometry args={[1, ...GEOMETRY.sphereDetailLow]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? GLOW.opacityHover : GLOW.opacityDefault} />
        </mesh>
        <Billboard>
          <Text
            font="/fonts/inter-latin.woff2"
            position={[0, size + LABEL.offsetY, 0]}
            fontSize={LABEL.fontSize}
            color={COLORS.textPrimary}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={LABEL.outlineWidth}
            outlineColor={LABEL.outlineColor}
          >
            {label}
          </Text>
        </Billboard>
      </group>
    )
  }

  // Level 4: Full detail with data card
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={size * 1.2}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, ...LOD_SEGMENTS.close]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={MATERIAL.emissiveActive}
          roughness={MATERIAL.roughnessSmooth}
          metalness={MATERIAL.metalnessHigh}
        />
      </mesh>
      {/* Prominent glow */}
      <mesh scale={size * GLOW.haloScaleHover}>
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetailLow]} />
        <meshBasicMaterial color={color} transparent opacity={GLOW.opacityHover} />
      </mesh>
      <Billboard>
        <Text
          font="/fonts/inter-latin.woff2"
          position={[0, size * 1.2 + LABEL.offsetY, 0]}
          fontSize={LABEL.titleFontSize}
          color={COLORS.goldBright}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={LABEL.outlineWidth}
          outlineColor={LABEL.outlineColor}
          fontWeight="bold"
        >
          {label}
        </Text>
        {detail && (
          <Text
            font="/fonts/inter-latin.woff2"
            position={[0, size * 1.2 + LABEL.offsetY - 0.4, 0]}
            fontSize={LABEL.stateFontSize}
            color={COLORS.textSecondary}
            anchorX="center"
            anchorY="top"
          >
            {detail}
          </Text>
        )}
      </Billboard>
    </group>
  )
}


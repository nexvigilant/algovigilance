'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Line } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS, MATERIAL, LABEL, GEOMETRY } from './observatory-constants'
import { surfaceColorScale } from '@/lib/observatory/oklab'

export interface SurfacePlot3DProps {
  /** Function z = f(x, y) */
  fn: (x: number, y: number) => number
  /** Range for x and y axes */
  range?: [number, number]
  /** Grid resolution (vertices per side) */
  resolution?: number
  /** Show wireframe overlay */
  wireframe?: boolean
  /** Color mode */
  colorMode?: 'height' | 'gradient' | 'contour'
  /** Animate the function with time parameter */
  animated?: boolean
  /** Axis labels */
  labels?: { x?: string; y?: string; z?: string }
  /** Title */
  title?: string
}

// Colors now computed via OKLab perceptual color space (see oklab.ts)

/**
 * Height-to-color mapping using OKLab perceptual color space.
 *
 * Gradient/height modes use `surfaceColorScale` (OKLab interpolation) for
 * perceptually uniform transitions. Contour mode uses stepped OKLab values.
 */
function heightToColor(height: number, min: number, max: number, mode: string): THREE.Color {
  if (mode === 'contour') {
    // Stepped contour lines via OKLab
    const t = max === min ? 0.5 : (height - min) / (max - min)
    const steps = 10
    const stepped = Math.floor(t * steps) / steps
    const steppedHeight = min + stepped * (max - min)
    return surfaceColorScale(steppedHeight, min, max)
  }

  // gradient and height modes both use OKLab perceptual interpolation
  return surfaceColorScale(height, min, max)
}

function AxisLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end])

  return (
    <Line points={points} color={color} transparent opacity={0.5} lineWidth={1} />
  )
}

export function SurfacePlot3D({
  fn,
  range = [-3, 3],
  resolution = 64,
  wireframe = false,
  colorMode = 'height',
  animated = false,
  labels,
  title,
}: SurfacePlot3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame(({ clock }) => {
    if (!animated || !meshRef.current) return
    timeRef.current = clock.elapsedTime
    const geo = meshRef.current.geometry
    const pos = geo.getAttribute('position')
    if (!pos) return
    const [lo, hi] = range
    const step = (hi - lo) / resolution
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = lo + i * step
        const y = lo + j * step
        const z = fn(x, y)
        const clamped = Number.isFinite(z) ? Math.max(GEOMETRY.zClampMin, Math.min(GEOMETRY.zClampMax, z)) : 0
        const idx = i * (resolution + 1) + j
        pos.setY(idx, clamped * 0.5)
      }
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })

  const { geometry, wireGeometry, zMin, zMax } = useMemo(() => {
    const [lo, hi] = range
    const step = (hi - lo) / resolution
    const vertices: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const normals: number[] = []
    const normalVec = new THREE.Vector3()

    // First pass: compute all z values
    const zValues: number[][] = []
    let minZ = Infinity
    let maxZ = -Infinity

    for (let i = 0; i <= resolution; i++) {
      zValues[i] = []
      for (let j = 0; j <= resolution; j++) {
        const x = lo + i * step
        const y = lo + j * step
        const z = fn(x, y)
        const clamped = Number.isFinite(z) ? Math.max(GEOMETRY.zClampMin, Math.min(GEOMETRY.zClampMax, z)) : 0
        zValues[i][j] = clamped
        minZ = Math.min(minZ, clamped)
        maxZ = Math.max(maxZ, clamped)
      }
    }

    // Second pass: build geometry
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = lo + i * step
        const y = lo + j * step
        const z = zValues[i][j]

        vertices.push(x, z * 0.5, y) // y-up convention

        const color = heightToColor(z, minZ, maxZ, colorMode)
        colors.push(color.r, color.g, color.b)

        // Simple normal estimation (reuses pre-allocated vector)
        const dzdx = i < resolution ? (zValues[i + 1][j] - z) / step : 0
        const dzdy = j < resolution ? (zValues[i][j + 1] - z) / step : 0
        normalVec.set(-dzdx * 0.5, 1, -dzdy * 0.5).normalize()
        normals.push(normalVec.x, normalVec.y, normalVec.z)

        if (i < resolution && j < resolution) {
          const a = i * (resolution + 1) + j
          const b = a + 1
          const c = (i + 1) * (resolution + 1) + j
          const d = c + 1
          indices.push(a, c, b)
          indices.push(b, c, d)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setIndex(indices)

    const wireGeo = geo.clone()

    return { geometry: geo, wireGeometry: wireGeo, zMin: minZ, zMax: maxZ }
  }, [fn, range, resolution, colorMode])

  const scale = range[1] - range[0]

  return (
    <group>
      {/* Surface mesh */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={MATERIAL.surfaceRoughness}
          metalness={MATERIAL.surfaceMetalness}
        />
      </mesh>

      {/* Wireframe overlay */}
      {wireframe && (
        <mesh ref={wireRef} geometry={wireGeometry}>
          <meshBasicMaterial
            wireframe
            color={COLORS.wireframe}
            transparent
            opacity={MATERIAL.wireframeOpacity}
          />
        </mesh>
      )}

      {/* Axes */}
      <AxisLine start={[range[0], 0, 0]} end={[range[1], 0, 0]} color={COLORS.cyan} />
      <AxisLine start={[0, zMin * 0.5, 0]} end={[0, zMax * 0.5, 0]} color={COLORS.gold} />
      <AxisLine start={[0, 0, range[0]]} end={[0, 0, range[1]]} color={COLORS.cyanGlow} />

      {/* Axis labels */}
      {labels?.x && (
        <Billboard position={[range[1] + 0.5, 0, 0]}>
          <Text font="/fonts/inter-latin.woff2" fontSize={LABEL.fontSize} color={COLORS.cyan}>{labels.x}</Text>
        </Billboard>
      )}
      {labels?.z && (
        <Billboard position={[0, zMax * 0.5 + 0.5, 0]}>
          <Text font="/fonts/inter-latin.woff2" fontSize={LABEL.fontSize} color={COLORS.gold}>{labels.z}</Text>
        </Billboard>
      )}
      {labels?.y && (
        <Billboard position={[0, 0, range[1] + 0.5]}>
          <Text font="/fonts/inter-latin.woff2" fontSize={LABEL.fontSize} color={COLORS.cyanGlow}>{labels.y}</Text>
        </Billboard>
      )}

      {/* Title */}
      {title && (
        <Billboard position={[0, zMax * 0.5 + 1.2, 0]}>
          <Text font="/fonts/inter-latin.woff2" fontSize={LABEL.titleFontSize} color={COLORS.textPrimary} outlineWidth={LABEL.outlineWidth} outlineColor={LABEL.outlineColor}>
            {title}
          </Text>
        </Billboard>
      )}

      {/* Grid floor */}
      <gridHelper
        args={[scale, GEOMETRY.gridDensity, COLORS.grid, COLORS.grid]}
        position={[0, zMin * 0.5 - GEOMETRY.gridFloorOffset, 0]}
      />
    </group>
  )
}

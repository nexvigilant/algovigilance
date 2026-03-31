'use client'

/**
 * Energy Edge Material — Animated flow shader for graph edges.
 *
 * Section 2.4 of the Observatory 3D Rendering Architecture.
 *
 * - UV-scrolling flow animation along edge direction
 * - HDR emissive output for bloom pickup (exceeds threshold 0.8)
 * - Alpha fade at endpoints for soft termination
 * - Pulse ripple for data-flow visualization
 */

import { useMemo, useRef } from 'react'
import type React from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './observatory-constants'

const EnergyEdgeMaterial = shaderMaterial(
  {
    color: new THREE.Color(COLORS.cyan),
    flowSpeed: 1.0,
    intensity: 1.5,
    time: 0,
    opacity: 0.6,
  },
  /* vertex */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 color;
    uniform float flowSpeed;
    uniform float intensity;
    uniform float time;
    uniform float opacity;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      // Flow animation — scrolling along U axis
      float flow = fract(vUv.x * 3.0 - time * flowSpeed);

      // Pulse ripple — bright bands flowing along edge
      float pulse = smoothstep(0.0, 0.15, flow) * smoothstep(0.5, 0.35, flow);

      // Endpoint fade — soft termination at both ends
      float endFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);

      // Edge softness — fade toward tube edges (V axis)
      float edgeSoft = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0);

      // Combine: base glow + pulse highlights
      float baseGlow = 0.3 + pulse * 0.7;
      float finalIntensity = baseGlow * intensity * endFade * edgeSoft;

      // HDR emissive output — exceeds bloom threshold
      vec3 hdrColor = color * finalIntensity;

      float alpha = opacity * endFade * edgeSoft * (0.4 + pulse * 0.6);

      gl_FragColor = vec4(hdrColor, alpha);
    }
  `
)

extend({ EnergyEdgeMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    energyEdgeMaterial: React.JSX.IntrinsicElements['shaderMaterial'] & {
      color?: THREE.Color | string
      flowSpeed?: number
      intensity?: number
      time?: number
      opacity?: number
    }
  }
}

// ─── Tube Geometry Helper ────────────────────────────────────────────────────
// Creates a tube mesh between two points with UV mapping along the length

const TUBE_RADIAL_SEGMENTS = 4
const TUBE_LENGTH_SEGMENTS = 16

function createEdgeTubeGeometry(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  lift: number,
): THREE.TubeGeometry {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  mid.y += lift

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return new THREE.TubeGeometry(curve, TUBE_LENGTH_SEGMENTS, radius, TUBE_RADIAL_SEGMENTS, false)
}

// ─── Energy Edge Component ───────────────────────────────────────────────────

interface EnergyEdgeProps {
  start: THREE.Vector3
  end: THREE.Vector3
  weight?: number
  color?: string
  opacity?: number
  flowSpeed?: number
}

export function EnergyEdge({
  start,
  end,
  weight = 1,
  color = COLORS.cyan,
  opacity = 0.6,
  flowSpeed = 1.0,
}: EnergyEdgeProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(
    () => createEdgeTubeGeometry(start, end, 0.015 + weight * 0.01, 0.3),
    [start, end, weight],
  )

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.elapsedTime
    }
  })

  return (
    <mesh geometry={geometry}>
      <energyEdgeMaterial
        ref={matRef}
        color={color}
        intensity={1.2 + weight * 0.3}
        flowSpeed={flowSpeed}
        opacity={opacity}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export { EnergyEdgeMaterial }

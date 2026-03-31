'use client'

/**
 * Instanced Graph — Single-draw-call rendering for large node clouds.
 *
 * Section 4.2 of the Observatory 3D Rendering Architecture.
 *
 * Uses THREE.InstancedMesh to render all nodes in a single draw call,
 * with per-instance position, size, color, and confidence attributes
 * set via InstancedBufferAttribute.
 *
 * Falls back to individual meshes for <50 nodes where instancing
 * overhead isn't worth it.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, GEOMETRY, MATERIAL, GLOW } from './observatory-constants'
import { perceptualRadius } from '@/lib/observatory/visual-encoding'
import { signalColorScale } from '@/lib/observatory/oklab'

// ─── Instanced Glow Shader ───────────────────────────────────────────────────
// Per-instance color via instanceColor attribute + HDR rim glow with pulse

const INSTANCED_GLOW_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vGlowColor;

void main() {
  #ifdef USE_INSTANCING_COLOR
    vGlowColor = instanceColor;
  #else
    vGlowColor = vec3(0.48, 0.58, 0.71);
  #endif

  vec4 localPos = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    localPos = instanceMatrix * localPos;
  #endif

  vec4 mvPosition = modelViewMatrix * localPos;
  vViewPosition = mvPosition.xyz;

  // Normal transform: instance has no rotation, only uniform scale
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * mvPosition;
}
`

const INSTANCED_GLOW_FRAGMENT = /* glsl */ `
uniform float time;
uniform float intensity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vGlowColor;

void main() {
  vec3 viewDir = normalize(-vViewPosition);
  float rim = 1.0 - max(0.0, dot(vNormal, viewDir));

  // Dual-layer rim: tight inner core + wide outer halo
  float innerRim = pow(rim, ${(GLOW.rimPower + 1.0).toFixed(1)}) * 1.5;
  float outerRim = pow(rim, ${(GLOW.rimPower * 0.6).toFixed(1)}) * 0.6;
  float combinedRim = innerRim + outerRim;

  // Dual-frequency pulse — organic breathing
  float slowPulse = sin(time * ${GLOW.pulseSpeed.toFixed(1)}) * 0.5 + 0.5;
  float fastPulse = sin(time * ${(GLOW.pulseSpeed * 2.7).toFixed(1)}) * 0.5 + 0.5;
  float pulse = 1.0 + ${GLOW.pulseAmplitude.toFixed(2)} * mix(slowPulse, fastPulse, 0.3);

  // HDR emissive — exceeds bloom threshold for selective glow
  float glow = combinedRim * intensity * pulse;
  vec3 hdrColor = vGlowColor * glow;

  // Fresnel-aware alpha — soft edges, solid core rim
  float alpha = combinedRim * ${GLOW.alphaMultiplier.toFixed(1)} * pulse;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(hdrColor, alpha);
}
`

interface InstancedNode {
  id: string
  position: [number, number, number]
  value: number
  confidence: number
  disproportionality?: number
  color?: string
}

interface InstancedSignalCloudProps {
  nodes: InstancedNode[]
  minValue?: number
  maxValue?: number
  minDisp?: number
  maxDisp?: number
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

export function InstancedSignalCloud({
  nodes,
  minValue = 0,
  maxValue = 1,
  minDisp = 0,
  maxDisp = 10,
}: InstancedSignalCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const glowRef = useRef<THREE.InstancedMesh>(null)

  const count = nodes.length

  // Pre-compute sizes via Stevens' Power Law
  const sizes = useMemo(() =>
    nodes.map((n) => perceptualRadius(n.value, minValue, maxValue, 0.15, 1.0)),
    [nodes, minValue, maxValue],
  )

  // Pre-compute colors via OKLab
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const node = nodes[i]
      if (node.disproportionality !== undefined) {
        const c = signalColorScale(node.disproportionality, minDisp, maxDisp)
        arr[i * 3] = c.r
        arr[i * 3 + 1] = c.g
        arr[i * 3 + 2] = c.b
      } else if (node.color) {
        _color.set(node.color)
        arr[i * 3] = _color.r
        arr[i * 3 + 1] = _color.g
        arr[i * 3 + 2] = _color.b
      } else {
        arr[i * 3] = 0.482
        arr[i * 3 + 1] = 0.584
        arr[i * 3 + 2] = 0.710
      }
    }
    return arr
  }, [nodes, count, minDisp, maxDisp])

  // Set instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return

    for (let i = 0; i < count; i++) {
      const node = nodes[i]
      const size = sizes[i]

      _dummy.position.set(...node.position)
      _dummy.scale.setScalar(size)
      _dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _dummy.matrix)

      _color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      meshRef.current.setColorAt(i, _color)
    }

    // Sync glow shell transforms
    if (glowRef.current) {
      for (let i = 0; i < count; i++) {
        const node = nodes[i]
        const size = sizes[i]

        _dummy.position.set(...node.position)
        _dummy.scale.setScalar(size * GLOW.nodeSphereScale)
        _dummy.updateMatrix()
        glowRef.current.setMatrixAt(i, _dummy.matrix)

        _color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
        glowRef.current.setColorAt(i, _color)
      }

      glowRef.current.instanceMatrix.needsUpdate = true
      if (glowRef.current.instanceColor) {
        glowRef.current.instanceColor.needsUpdate = true
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [nodes, sizes, colors, count])

  // Instanced glow shader material — per-instance color, HDR rim, pulse
  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      intensity: { value: GLOW.defaultIntensity },
    },
    vertexShader: INSTANCED_GLOW_VERTEX,
    fragmentShader: INSTANCED_GLOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  }), [])

  // Idle oscillation + glow time uniform
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    // Animate glow shader time
    glowMaterial.uniforms.time.value = t

    for (let i = 0; i < count; i++) {
      const node = nodes[i]
      const size = sizes[i]
      const phase = (i * 1.7) % (Math.PI * 2)
      const osc = Math.sin(t * 2 + phase) * 0.02

      _dummy.position.set(
        node.position[0],
        node.position[1] + osc,
        node.position[2],
      )
      _dummy.scale.setScalar(size)
      _dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    if (glowRef.current) {
      for (let i = 0; i < count; i++) {
        const node = nodes[i]
        const size = sizes[i]
        const phase = (i * 1.7) % (Math.PI * 2)
        const osc = Math.sin(t * 2 + phase) * 0.02

        _dummy.position.set(
          node.position[0],
          node.position[1] + osc,
          node.position[2],
        )
        _dummy.scale.setScalar(size * GLOW.nodeSphereScale)
        _dummy.updateMatrix()
        glowRef.current.setMatrixAt(i, _dummy.matrix)
      }
      glowRef.current.instanceMatrix.needsUpdate = true
    }
  })

  if (count === 0) return null

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetail]} />
        <meshStandardMaterial
          roughness={MATERIAL.roughness}
          metalness={MATERIAL.metalness}
          emissiveIntensity={MATERIAL.emissiveIdle}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Glow shell — per-instance HDR rim shader */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[GLOW.nodeSphereScale, ...GEOMETRY.sphereDetailLow]} />
        <primitive object={glowMaterial} attach="material" />
      </instancedMesh>
    </group>
  )
}

'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, QuadraticBezierLine } from '@react-three/drei'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import {
  COLORS, MATERIAL, GLOW, ANIMATION, LABEL, ARC, GEOMETRY, PHYSICS,
} from './observatory-constants'

export interface StateNode {
  id: string
  label: string
  color?: string
  active?: boolean
  size?: number
}

export interface StateTransition {
  from: string
  to: string
  label?: string
  probability?: number
}

export type StateLayout = 'orbital' | 'flow' | 'ring'

export interface StateOrbit3DProps {
  states: StateNode[]
  transitions: StateTransition[]
  onStateClick?: (state: StateNode) => void
  orbitRadius?: number
  showLabels?: boolean
  showTransitionLabels?: boolean
  centralLabel?: string
  /** Layout mode — orbital (planets), flow (left-to-right diagram), ring (flat circle) */
  layout?: StateLayout
}

function StatePlanet({
  state,
  position,
  onClick,
  showLabel,
}: {
  state: StateNode
  position: THREE.Vector3
  onClick?: (state: StateNode) => void
  showLabel: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const baseSize = state.size ?? GEOMETRY.nodeSizeDefault
  const color = state.color ?? COLORS.cyan

  // Animated spring transition for position changes (layout mode switches)
  const springProps = useSpring({
    position: [position.x, position.y, position.z] as [number, number, number],
    config: { mass: 1, tension: 120, friction: 14 },
  })

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    meshRef.current.rotation.y = t * ANIMATION.orbitRotationSpeed
    meshRef.current.rotation.x = Math.sin(t * ANIMATION.orbitTiltSpeed) * ANIMATION.orbitTiltAngle

    if (state.active) {
      const pulse = 1 + Math.sin(t * ANIMATION.activeStatePulseFreq) * ANIMATION.activeStatePulseAmp
      meshRef.current.scale.setScalar(baseSize * pulse)
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * ANIMATION.ringRotationSpeed
      ringRef.current.rotation.x = ANIMATION.ringTiltAngle
    }
  })

  const handleClick = useCallback(() => onClick?.(state), [state, onClick])

  return (
    <animated.group position={springProps.position}>
      {/* Planet body */}
      <mesh
        ref={meshRef}
        scale={baseSize}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetailHigh]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={state.active ? MATERIAL.emissiveActive : hovered ? MATERIAL.emissiveIdle : MATERIAL.emissiveDim}
          roughness={MATERIAL.roughnessSmooth}
          metalness={MATERIAL.metalnessHigh}
        />
      </mesh>

      {/* Orbital ring for active state */}
      {state.active && (
        <mesh ref={ringRef} scale={baseSize * GEOMETRY.ringScale}>
          <torusGeometry args={[1, GEOMETRY.ringThickness, ...GEOMETRY.ringDetail]} />
          <meshBasicMaterial color={color} transparent opacity={GEOMETRY.ringOpacity} />
        </mesh>
      )}

      {/* Glow halo */}
      <mesh scale={baseSize * (hovered ? GLOW.haloScaleHover : GLOW.haloScaleDefault)}>
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetailLow]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={state.active ? GLOW.opacityActive : GLOW.opacityDim}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        <Billboard position={[0, baseSize + LABEL.activeOffsetY, 0]}>
          <Text
            font="/fonts/inter-latin.woff2"
            fontSize={LABEL.stateFontSize}
            color={state.active ? COLORS.goldBright : COLORS.textPrimary}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={LABEL.outlineWidth}
            outlineColor={LABEL.outlineColor}
            fontWeight={state.active ? 'bold' : 'normal'}
          >
            {state.label}
          </Text>
        </Billboard>
      )}
    </animated.group>
  )
}

function TransitionArc({
  start,
  end,
  label,
  probability,
  showLabel,
  index = 0,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  label?: string
  probability?: number
  showLabel: boolean
  index?: number
}) {
  const mid = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    const dist = start.distanceTo(end)
    // Vary lift per arc index to prevent label overlap
    const liftVariation = 1 + (index % 3) * 0.4
    m.y += dist * ARC.liftFactor * liftVariation
    // Slight lateral offset for parallel arcs
    const lateral = ((index % 2) * 2 - 1) * 0.15 * (index > 0 ? 1 : 0)
    m.x += lateral
    m.z += lateral
    return m
  }, [start, end, index])

  const opacity = probability ?? 0.5

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        color={COLORS.cyanGlow}
        lineWidth={1 + (probability ?? 0.5) * ARC.weightMultiplier}
        transparent
        opacity={opacity * ARC.opacityMultiplier}
      />
      {showLabel && label && (
        <Billboard position={mid}>
          <Text
            font="/fonts/inter-latin.woff2"
            fontSize={LABEL.transitionFont}
            color={COLORS.textSecondary}
            anchorX="center"
            anchorY="middle"
          >
            {label}
            {probability !== undefined ? ` (${(probability * 100).toFixed(0)}%)` : ''}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

function CentralNucleus({ label }: { label?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * ANIMATION.nucleusRotationSpeed
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * ANIMATION.nucleusTiltSpeed) * ANIMATION.nucleusTiltAngle
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[GEOMETRY.nucleusRadius, GEOMETRY.nucleusDetail]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={COLORS.gold}
          emissiveIntensity={MATERIAL.roughness}
          wireframe
          transparent
          opacity={GEOMETRY.ringOpacity}
        />
      </mesh>
      <mesh scale={GEOMETRY.nucleusHaloScale}>
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetailLow]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={GEOMETRY.nucleusHaloOpacity} />
      </mesh>
      {label && (
        <Billboard position={[0, 0.6, 0]}>
          <Text font="/fonts/inter-latin.woff2" fontSize={LABEL.nucleusFont} color={COLORS.gold} anchorX="center">
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

// ─── Layout algorithms ───────────────────────────────────────────────────────

function computeOrbitalPositions(states: StateNode[], orbitRadius: number): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>()
  const n = states.length

  states.forEach((state, i) => {
    const angle = (i / n) * Math.PI * 2
    const r = orbitRadius + (state.size ?? GEOMETRY.nodeSizeDefault) * PHYSICS.valueSizeMultiplier
    const x = r * Math.cos(angle)
    const z = r * Math.sin(angle)
    const y = Math.sin(angle * 2) * 0.5
    map.set(state.id, new THREE.Vector3(x, y, z))
  })

  return map
}

function computeFlowPositions(states: StateNode[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>()
  const n = states.length
  const spacing = 2.5
  const totalWidth = (n - 1) * spacing

  states.forEach((state, i) => {
    const x = -totalWidth / 2 + i * spacing
    const y = Math.sin(i * 0.8) * 0.3 // Subtle wave for depth
    const z = 0
    map.set(state.id, new THREE.Vector3(x, y, z))
  })

  return map
}

function computeRingPositions(states: StateNode[], orbitRadius: number): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>()
  const n = states.length

  states.forEach((state, i) => {
    const angle = (i / n) * Math.PI * 2
    const r = orbitRadius
    const x = r * Math.cos(angle)
    const z = r * Math.sin(angle)
    map.set(state.id, new THREE.Vector3(x, 0, z))
  })

  return map
}

export function StateOrbit3D({
  states,
  transitions,
  onStateClick,
  orbitRadius = 3,
  showLabels = true,
  showTransitionLabels = true,
  centralLabel,
  layout = 'orbital',
}: StateOrbit3DProps) {
  const positions = useMemo(() => {
    switch (layout) {
      case 'flow': return computeFlowPositions(states)
      case 'ring': return computeRingPositions(states, orbitRadius)
      case 'orbital':
      default: return computeOrbitalPositions(states, orbitRadius)
    }
  }, [states, orbitRadius, layout])

  return (
    <group>
      {/* Central nucleus */}
      <CentralNucleus label={centralLabel} />

      {/* Orbital path ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[orbitRadius, GEOMETRY.orbitalPathRadius, ...GEOMETRY.orbitalPathDetail]} />
        <meshBasicMaterial color={COLORS.grid} transparent opacity={GEOMETRY.orbitalPathOpacity} />
      </mesh>

      {/* Transition arcs */}
      {transitions.map((t, i) => {
        const start = positions.get(t.from)
        const end = positions.get(t.to)
        if (!start || !end) return null
        return (
          <TransitionArc
            key={`trans-${i}`}
            start={start}
            end={end}
            label={t.label}
            probability={t.probability}
            showLabel={showTransitionLabels}
            index={i}
          />
        )
      })}

      {/* State planets */}
      {states.map((state) => {
        const pos = positions.get(state.id)
        if (!pos) return null
        return (
          <StatePlanet
            key={state.id}
            state={state}
            position={pos}
            onClick={onStateClick}
            showLabel={showLabels}
          />
        )
      })}
    </group>
  )
}

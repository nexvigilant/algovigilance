'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Stats, Sparkles } from '@react-three/drei'
import { SafeEnvironment } from './safe-environment'
import * as THREE from 'three'
import { Suspense, useMemo, type ReactNode, Component, type ErrorInfo, type ReactElement } from 'react'
import { COLORS, LIGHTING, STARS as STARS_CONFIG, CAMERA, ANIMATION, POST_PROCESSING } from './observatory-constants'
import type { ObservatoryTheme } from '@/lib/observatory/themes'
import { ObservatoryPostProcessing } from './post-processing'
import { ATMOSPHERES, applyThemeShift } from '@/lib/observatory/atmospheres'
import type { AtmosphereId } from '@/lib/observatory/types'

// ─── WebGL Error Boundary ─────────────────────────────────────────────
// Class component required — React has no hook-based error boundary API

interface WebGLErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactElement
}

interface WebGLErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Observatory] WebGL Error:', error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-nex-border bg-nex-surface">
          <div className="text-center p-golden-3 max-w-sm">
            <div className="w-10 h-10 mx-auto mb-golden-2 border border-cyan/30 bg-cyan/5 flex items-center justify-center">
              <span className="text-cyan text-lg" aria-hidden="true">!</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-golden-1">3D Rendering Unavailable</h3>
            <p className="text-xs text-slate-dim/70 leading-golden">
              WebGL is required for 3D visualization. Check that your browser supports WebGL
              and hardware acceleration is enabled.
            </p>
            {this.state.error && (
              <code className="mt-golden-2 text-[10px] text-slate-dim/50 block truncate">
                {this.state.error.message}
              </code>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-golden-2 px-3 py-1.5 text-xs border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Loading Skeleton ─────────────────────────────────────────────────

export function SceneLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-nex-border bg-nex-surface animate-pulse">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-golden-2 border border-cyan/20 bg-cyan/5 animate-spin" />
        <p className="text-xs text-slate-dim/50 font-mono">Initializing 3D scene...</p>
      </div>
    </div>
  )
}

// ─── Scene Container ──────────────────────────────────────────────────

interface SceneContainerProps {
  children: ReactNode
  className?: string
  showStars?: boolean
  showStats?: boolean
  cameraPosition?: [number, number, number]
  controlsEnabled?: boolean
  background?: string
  postProcessing?: boolean
  enableBloom?: boolean
  enableSSAO?: boolean
  enableVignette?: boolean
  enableDoF?: boolean
  enableChromaticAberration?: boolean
  theme?: ObservatoryTheme
  /** Atmosphere preset — defines lighting rig, fog, stars, sparkles, and environment. */
  atmosphereId?: AtmosphereId
  /** Accessible label describing the 3D visualization for screen readers */
  sceneLabel?: string
  /** Star count — maps to quality preset starCount. Defaults to STARS_CONFIG.count (3000). */
  starCount?: number
  /** Whether to render sparkle particles. Defaults to true. */
  showSparkles?: boolean
  /** SSAO sample count — maps to quality preset ssaoSamples. Defaults to POST_PROCESSING.ssaoSamples (32). */
  ssaoSamples?: number
}

function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={COLORS.cyan} wireframe />
    </mesh>
  )
}

export function SceneContainer({
  children,
  className = '',
  showStars = true,
  showStats = false,
  cameraPosition = [...CAMERA.defaultPosition],
  controlsEnabled = true,
  background = COLORS.deep,
  postProcessing = false,
  enableBloom = true,
  enableSSAO = true,
  enableVignette = true,
  enableDoF = false,
  enableChromaticAberration = true,
  theme,
  atmosphereId,
  sceneLabel = '3D data visualization',
  starCount = STARS_CONFIG.count,
  showSparkles = true,
  ssaoSamples,
}: SceneContainerProps) {
  const atmosphere = useMemo(() => {
    if (!atmosphereId) return null
    const base = ATMOSPHERES[atmosphereId]
    return theme ? applyThemeShift(base, theme) : base
  }, [atmosphereId, theme])

  const bgColor = atmosphere?.background ?? theme?.colors.background ?? background
  const fogColor = atmosphere?.background ?? theme?.colors.background ?? LIGHTING.fogColor
  const ambientColor = theme?.colors.primary ?? undefined
  const fillColor = theme?.colors.secondary ?? LIGHTING.fillLightColor

  const keyLight = atmosphere?.keyLight ?? { color: LIGHTING.keyLightColor, intensity: LIGHTING.keyLightIntensity, position: LIGHTING.keyLightPosition }
  const fillLight = atmosphere?.fillLight ?? { color: fillColor, intensity: LIGHTING.fillLightIntensity, position: LIGHTING.fillLightPosition }
  const rimLight = atmosphere?.rimLight ?? { color: LIGHTING.rimLightColor, intensity: LIGHTING.rimLightIntensity, position: LIGHTING.rimLightPosition }
  const ambientIntensity = atmosphere?.ambient.intensity ?? LIGHTING.ambientIntensity
  const hemiSky = atmosphere?.hemisphere.sky ?? LIGHTING.hemiSkyColor
  const hemiGround = atmosphere?.hemisphere.ground ?? LIGHTING.hemiGroundColor
  const hemiIntensity = atmosphere?.hemisphere.intensity ?? LIGHTING.hemiIntensity
  const fogNear = atmosphere?.fog.near ?? LIGHTING.fogNear
  const fogFar = atmosphere?.fog.far ?? LIGHTING.fogFar
  const environmentPreset = (atmosphere?.environment ?? 'night') as 'night' | 'studio' | 'sunset' | 'city' | 'dawn' | 'forest' | 'lobby' | 'park' | 'warehouse' | 'apartment'
  const resolvedStarCount = atmosphere ? (atmosphere.stars.enabled ? atmosphere.stars.count : 0) : starCount
  const starSaturation = atmosphere?.stars.saturation ?? STARS_CONFIG.saturation
  const starSpeed = atmosphere?.stars.speed ?? STARS_CONFIG.speed
  const renderStars = showStars && (atmosphere ? atmosphere.stars.enabled : true)
  const sparkleEnabled = atmosphere ? atmosphere.sparkles.enabled : showSparkles
  const sparkleCount = atmosphere?.sparkles.count ?? 200
  const sparkleColor = atmosphere?.sparkles.color ?? COLORS.cyan
  const sparkleOpacity = atmosphere?.sparkles.opacity ?? 0.3

  return (
    <WebGLErrorBoundary>
      <div role="img" aria-label={sceneLabel} className={`relative w-full h-full min-h-[500px] overflow-hidden border border-nex-border ${className}`}>
        <Canvas
          camera={{ position: cameraPosition, fov: CAMERA.fov }}
          style={{ background: bgColor }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = POST_PROCESSING.toneMappingExposure
          }}
        >
          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
          <Suspense fallback={<SceneFallback />}>
            <ambientLight intensity={ambientIntensity} color={ambientColor} />
            <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
            <pointLight position={[...keyLight.position]} intensity={keyLight.intensity} color={keyLight.color} />
            <pointLight position={[...fillLight.position]} intensity={fillLight.intensity} color={fillLight.color} />
            <pointLight position={[...rimLight.position]} intensity={rimLight.intensity} color={rimLight.color} />
            <SafeEnvironment preset={environmentPreset} />
            {renderStars && (
              <>
                <Stars radius={STARS_CONFIG.radius} depth={STARS_CONFIG.depth} count={resolvedStarCount} factor={STARS_CONFIG.factor} saturation={starSaturation} fade speed={starSpeed} />
                {sparkleEnabled && <Sparkles count={sparkleCount} size={1.5} speed={0.3} opacity={sparkleOpacity} color={sparkleColor} scale={[20, 20, 20]} />}
              </>
            )}
            {children}
            {controlsEnabled && (
              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                autoRotate
                autoRotateSpeed={ANIMATION.autoRotateSpeed}
                dampingFactor={ANIMATION.dampingFactor}
                enableDamping
              />
            )}
            {showStats && <Stats />}
            {postProcessing && (
              <ObservatoryPostProcessing
                enableBloom={enableBloom}
                enableSSAO={enableSSAO}
                enableVignette={enableVignette}
                enableDoF={enableDoF}
                enableChromaticAberration={enableChromaticAberration}
                ssaoSamples={ssaoSamples}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  )
}

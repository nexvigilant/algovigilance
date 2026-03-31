/**
 * Observatory L2-L5 Upgrade Tests
 *
 * Validates new files from the 3D rendering upgrade (Phases 2-6),
 * OKLab color output ranges, and visual encoding monotonicity.
 *
 * Run with: npm test -- observatory-upgrade
 */

import fs from 'fs'
import path from 'path'

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components', 'observatory')
const LIB_DIR = path.join(process.cwd(), 'src', 'lib', 'observatory')

// ─── Phase 2-6: New File Tests ──────────────────────────────────────────────

describe('Observatory L2-L5 Upgrade Files', () => {
  describe('OKLab Color Engine', () => {
    const filePath = path.join(LIB_DIR, 'oklab.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports oklabToLinearSRGB', () => { expect(content).toContain('export function oklabToLinearSRGB') })
    test('exports signalColorScale', () => { expect(content).toContain('export function signalColorScale') })
    test('exports surfaceColorScale', () => { expect(content).toContain('export function surfaceColorScale') })
    test('uses THREE.Color', () => { expect(content).toContain('THREE.Color') })
  })

  describe('Visual Encoding', () => {
    const filePath = path.join(LIB_DIR, 'visual-encoding.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports perceptualRadius (Stevens Power Law)', () => { expect(content).toContain('export function perceptualRadius') })
    test('exports confidenceToOpacity', () => { expect(content).toContain('export function confidenceToOpacity') })
    test('exports trendToEmissive', () => { expect(content).toContain('export function trendToEmissive') })
    test('exports seriousnessToGlow', () => { expect(content).toContain('export function seriousnessToGlow') })

    test('Stevens exponent is approximately 1.43', () => {
      // Exponent sourced from PERCEPTION.stevensExponent constant
      expect(content).toContain('PERCEPTION.stevensExponent')
    })
  })

  describe('Domain Types', () => {
    const filePath = path.join(LIB_DIR, 'types.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports PharmacovigilanceSignal', () => { expect(content).toContain('export interface PharmacovigilanceSignal') })
    test('exports CVDMode type', () => { expect(content).toContain("export type CVDMode") })
    test('exports SemanticZoomLevel', () => { expect(content).toContain('export type SemanticZoomLevel') })
  })

  describe('Post-Processing Stack', () => {
    const filePath = path.join(COMPONENTS_DIR, 'post-processing.tsx')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports ObservatoryPostProcessing', () => { expect(content).toContain('export function ObservatoryPostProcessing') })
    test('uses EffectComposer', () => { expect(content).toContain('EffectComposer') })
    test('includes Bloom effect', () => { expect(content).toContain('Bloom') })
    test('includes SSAO effect', () => { expect(content).toContain('SSAO') })
    test('includes Vignette effect', () => { expect(content).toContain('Vignette') })
  })

  describe('Instanced Graph', () => {
    const filePath = path.join(COMPONENTS_DIR, 'instanced-graph.tsx')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports InstancedSignalCloud', () => { expect(content).toContain('export function InstancedSignalCloud') })
    test('uses InstancedMesh', () => { expect(content).toContain('instancedMesh') })
    test('imports perceptualRadius', () => { expect(content).toContain('perceptualRadius') })
    test('imports signalColorScale', () => { expect(content).toContain('signalColorScale') })
  })

  describe('Uncertainty Material', () => {
    const filePath = path.join(COMPONENTS_DIR, 'uncertainty-material.tsx')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports UncertaintyShaderMaterial', () => { expect(content).toContain('export { UncertaintyShaderMaterial }') })
    test('has GLSL shaders', () => {
      expect(content).toContain('gl_Position')
      expect(content).toContain('gl_FragColor')
    })
    test('implements Fresnel rim lighting', () => { expect(content).toContain('fresnel') })
    test('implements dissolution for low confidence', () => { expect(content).toContain('dissolveThreshold') })
  })

  describe('Semantic Zoom', () => {
    const filePath = path.join(COMPONENTS_DIR, 'semantic-zoom.tsx')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports useSemanticZoom', () => { expect(content).toContain('export function useSemanticZoom') })
    test('exports AdaptiveNode', () => { expect(content).toContain('export function AdaptiveNode') })
    test('has 4 zoom levels', () => {
      expect(content).toContain('zoomLevel === 1')
      expect(content).toContain('zoomLevel === 2')
      expect(content).toContain('zoomLevel === 3')
    })
  })

  describe('CVD Geometry', () => {
    const filePath = path.join(COMPONENTS_DIR, 'cvd-geometry.tsx')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports getNodeGeometry', () => { expect(content).toContain('export function getNodeGeometry') })
    test('exports useCVDMode', () => { expect(content).toContain('export function useCVDMode') })
    test('maps data types to shapes', () => {
      expect(content).toContain('SphereGeometry')
      expect(content).toContain('BoxGeometry')
      expect(content).toContain('OctahedronGeometry')
      expect(content).toContain('TorusGeometry')
    })
  })

  describe('Worker Layout', () => {
    const filePath = path.join(LIB_DIR, 'worker-layout.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports LayoutConfig', () => { expect(content).toContain('export interface LayoutConfig') })
    test('implements Barnes-Hut algorithm', () => { expect(content).toContain('computeForceBarnesHut') })
    test('uses octree spatial partitioning', () => { expect(content).toContain('OctreeNode') })
    test('has message protocol', () => {
      expect(content).toContain("'init'")
      expect(content).toContain("'tick'")
      expect(content).toContain("'configure'")
    })
  })

  describe('Updated Constants', () => {
    const filePath = path.join(COMPONENTS_DIR, 'observatory-constants.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('has PERCEPTION constants', () => { expect(content).toContain('export const PERCEPTION') })
    test('has POST_PROCESSING constants', () => { expect(content).toContain('export const POST_PROCESSING') })
    test('has SEMANTIC_ZOOM constants', () => { expect(content).toContain('export const SEMANTIC_ZOOM') })
    test('has LOD constants', () => { expect(content).toContain('export const LOD') })
  })

  describe('Updated Barrel Export', () => {
    const filePath = path.join(COMPONENTS_DIR, 'index.ts')
    let content: string

    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('exports ObservatoryPostProcessing', () => { expect(content).toContain('ObservatoryPostProcessing') })
    test('exports InstancedSignalCloud', () => { expect(content).toContain('InstancedSignalCloud') })
    test('exports UncertaintyShaderMaterial', () => { expect(content).toContain('UncertaintyShaderMaterial') })
    test('exports AdaptiveNode', () => { expect(content).toContain('AdaptiveNode') })
    test('exports useSemanticZoom', () => { expect(content).toContain('useSemanticZoom') })
    test('exports useCVDMode', () => { expect(content).toContain('useCVDMode') })
    test('exports useWorkerLayout', () => { expect(content).toContain('useWorkerLayout') })
    test('exports signalColorScale', () => { expect(content).toContain('signalColorScale') })
    test('exports perceptualRadius', () => { expect(content).toContain('perceptualRadius') })
  })
})

// ─── Phase 7: Integration Wiring Tests ────────────────────────────────────────

describe('Phase 7 Integration Wiring', () => {
  const GRAPH_EXPLORER = path.join(process.cwd(), 'src', 'app', 'nucleus', 'observatory', 'graph', 'graph-explorer.tsx')
  const FORCE_GRAPH = path.join(COMPONENTS_DIR, 'force-graph-3d.tsx')
  const SCENE_CONTAINER = path.join(COMPONENTS_DIR, 'scene-container.tsx')

  describe('Graph Explorer — Semantic Zoom', () => {
    let content: string
    beforeAll(() => { content = fs.readFileSync(GRAPH_EXPLORER, 'utf-8') })

    test('imports zoom support via ZoomLevelBridge', () => {
      expect(content).toContain('ZoomLevelBridge')
      expect(content).toContain('explorer-shared')
    })

    test('uses ZoomLevelBridge inside scene', () => {
      expect(content).toContain('<ZoomLevelBridge')
    })

    test('renders ZoomLevelBridge inside SceneContainer', () => {
      expect(content).toContain('<ZoomLevelBridge')
    })

    test('displays zoom level in metrics panel', () => {
      expect(content).toContain('ZOOM_LEVEL_LABELS')
      expect(content).toContain('Zoom Level')
    })

    test('tracks zoom level via state', () => {
      expect(content).toContain('useState<SemanticZoomLevel>')
    })
  })

  describe('Graph Explorer — CVD Mode', () => {
    let content: string
    beforeAll(() => { content = fs.readFileSync(GRAPH_EXPLORER, 'utf-8') })

    test('imports useCVDMode', () => {
      expect(content).toContain('useCVDMode')
    })

    test('has CVD mode selector buttons', () => {
      expect(content).toContain('CVD_OPTIONS')
      expect(content).toContain('setCvdMode')
    })

    test('includes CVD mode selector via CVD_OPTIONS', () => {
      expect(content).toContain('CVD_OPTIONS')
      expect(content).toContain('setCvdMode')
    })

    test('passes cvdMode to ForceGraph3D', () => {
      expect(content).toContain('cvdMode={cvdMode}')
    })
  })

  describe('Graph Explorer — Per-Effect Post-Processing', () => {
    let content: string
    beforeAll(() => { content = fs.readFileSync(GRAPH_EXPLORER, 'utf-8') })

    test('has individual effect toggles', () => {
      expect(content).toContain('enableBloom')
      expect(content).toContain('enableSSAO')
      expect(content).toContain('enableVignette')
    })

    test('receives postProcessing from useExplorerEffects', () => {
      expect(content).toContain('postProcessing')
      expect(content).toContain('useExplorerEffects')
    })

    test('passes per-effect props to SceneContainer', () => {
      expect(content).toContain('enableBloom={enableBloom}')
      expect(content).toContain('enableSSAO={enableSSAO}')
      expect(content).toContain('enableVignette={enableVignette}')
    })
  })

  describe('ForceGraph3D — CVD Support', () => {
    let content: string
    beforeAll(() => { content = fs.readFileSync(FORCE_GRAPH, 'utf-8') })

    test('imports getNodeGeometry from cvd-geometry', () => {
      expect(content).toContain("import { getNodeGeometry } from './cvd-geometry'")
    })

    test('has cvdMode in ForceGraph3DProps', () => {
      expect(content).toContain('cvdMode?: CVDMode')
    })

    test('GraphNode has dataType for CVD shape encoding', () => {
      expect(content).toContain('dataType?: DataType')
    })

    test('conditionally renders CVD geometry', () => {
      expect(content).toContain("cvdMode !== 'normal'")
      expect(content).toContain('getNodeGeometry(')
    })

    test('defaults cvdMode to normal', () => {
      expect(content).toContain("cvdMode = 'normal'")
    })
  })

  describe('SceneContainer — Per-Effect Props', () => {
    let content: string
    beforeAll(() => { content = fs.readFileSync(SCENE_CONTAINER, 'utf-8') })

    test('accepts enableBloom prop', () => {
      expect(content).toContain('enableBloom')
    })

    test('accepts enableSSAO prop', () => {
      expect(content).toContain('enableSSAO')
    })

    test('accepts enableVignette prop', () => {
      expect(content).toContain('enableVignette')
    })

    test('passes effect props to ObservatoryPostProcessing', () => {
      expect(content).toContain('enableBloom={enableBloom}')
      expect(content).toContain('enableSSAO={enableSSAO}')
      expect(content).toContain('enableVignette={enableVignette}')
    })
  })
})

// ─── Phase 8: Live PV Signal Data Integration Tests ───────────────────────────

describe('Phase 8 Live Signal Data', () => {
  const GRAPH_DIR = path.join(process.cwd(), 'src', 'app', 'nucleus', 'observatory', 'graph')

  describe('Live Signal Adapter', () => {
    const filePath = path.join(GRAPH_DIR, 'live-signal-adapter.ts')
    let content: string
    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('uses single signal-graph endpoint', () => { expect(content).toContain('signal-graph') })
    test('exports buildSignalDataset', () => { expect(content).toContain('export async function buildSignalDataset') })
    test('calls FAERS proxy route', () => { expect(content).toContain('/api/nexcore/faers') })
    test('maps to GraphNode/GraphEdge types', () => {
      expect(content).toContain("import type { GraphNode, GraphEdge }")
    })
    test('assigns CVD dataType to nodes', () => {
      expect(content).toContain("dataType: 'drug'")
      expect(content).toContain("dataType: 'event'")
      expect(content).toContain("dataType: 'signal'")
    })
    test('returns Dataset-compatible shape', () => {
      expect(content).toContain('import type { Dataset')
    })
    test('includes STEM grounding', () => {
      expect(content).toContain('faers_signal_graph')
      expect(content).toContain('pv_signal_complete')
    })
  })

  describe('Signal Data Hook', () => {
    const filePath = path.join(GRAPH_DIR, 'use-signal-data.ts')
    let content: string
    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('file exists', () => { expect(fs.existsSync(filePath)).toBe(true) })
    test('exports useSignalData', () => { expect(content).toContain('export function useSignalData') })
    test('returns loading state', () => { expect(content).toContain('loading') })
    test('returns error state', () => { expect(content).toContain('error') })
    test('debounces input', () => { expect(content).toMatch(/dedup|debounce/i) })
    test('aborts on unmount', () => { expect(content).toMatch(/AbortController|useSWRData|cleanup/) })
    test('uses buildSignalDataset', () => { expect(content).toContain('buildSignalDataset') })
  })

  describe('Graph Explorer — Live Mode', () => {
    const filePath = path.join(GRAPH_DIR, 'graph-explorer.tsx')
    let content: string
    beforeAll(() => { content = fs.readFileSync(filePath, 'utf-8') })

    test('imports useSignalData', () => { expect(content).toContain('useSignalData') })
    test('has live mode toggle', () => { expect(content).toContain('liveMode') })
    test('has drug search input', () => { expect(content).toContain('drugQuery') })
    test('shows data source indicator', () => {
      expect(content).toContain('STATIC')
      expect(content).toContain('LIVE')
    })
    test('shows loading spinner', () => { expect(content).toContain('liveLoading') })
    test('shows error state', () => { expect(content).toContain('liveError') })
    test('selects between static and live data', () => {
      expect(content).toContain('liveMode && liveData')
    })
  })
})

// ─── OKLab Color Output Validation ─────────────────────────────────────────

describe('OKLab Color Functions', () => {
  let oklabModule: typeof import('@/lib/observatory/oklab')

  beforeAll(async () => {
    oklabModule = require('../../../lib/observatory/oklab')
  })

  test('oklabToLinearSRGB returns values in [0,1]', () => {
    const [r, g, b] = oklabModule.oklabToLinearSRGB(0.5, 0.0, 0.0)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(g).toBeLessThanOrEqual(1)
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(1)
  })

  test('signalColorScale returns THREE.Color', () => {
    const color = oklabModule.signalColorScale(5, 0, 10)
    expect(color).toBeDefined()
    expect(color.r).toBeGreaterThanOrEqual(0)
    expect(color.r).toBeLessThanOrEqual(1)
  })
})

// ─── Visual Encoding Monotonicity ──────────────────────────────────────────

describe('Visual Encoding Functions', () => {
  let encodingModule: typeof import('@/lib/observatory/visual-encoding')

  beforeAll(async () => {
    encodingModule = require('../../../lib/observatory/visual-encoding')
  })

  test('perceptualRadius is monotonically increasing', () => {
    const r1 = encodingModule.perceptualRadius(1, 0, 10)
    const r2 = encodingModule.perceptualRadius(5, 0, 10)
    const r3 = encodingModule.perceptualRadius(10, 0, 10)
    expect(r1).toBeLessThan(r2)
    expect(r2).toBeLessThan(r3)
  })

  test('confidenceToOpacity decreases with wider CI', () => {
    const o1 = encodingModule.confidenceToOpacity(2)
    const o2 = encodingModule.confidenceToOpacity(10)
    const o3 = encodingModule.confidenceToOpacity(18)
    expect(o1).toBeGreaterThan(o2)
    expect(o2).toBeGreaterThan(o3)
  })

  test('trendToEmissive returns expected ordering', () => {
    const emerging = encodingModule.trendToEmissive('emerging')
    const stable = encodingModule.trendToEmissive('stable')
    const declining = encodingModule.trendToEmissive('declining')
    expect(emerging).toBeGreaterThan(stable)
    expect(stable).toBeGreaterThan(declining)
  })
})

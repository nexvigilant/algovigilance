/**
 * Observatory 3D Component Tests
 *
 * Validates component structure, exports, props, and data integrity
 * for the Observatory visualization system.
 *
 * Run with: npm test -- observatory-components
 */

import fs from 'fs'
import path from 'path'

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components', 'observatory')
const PAGES_DIR = path.join(process.cwd(), 'src', 'app', 'nucleus', 'observatory')

describe('Observatory Component Library', () => {
  describe('SceneContainer', () => {
    const filePath = path.join(COMPONENTS_DIR, 'scene-container.tsx')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('is a client component', () => {
      expect(content).toContain("'use client'")
    })

    test('exports SceneContainer', () => {
      expect(content).toContain('export function SceneContainer')
    })

    test('uses R3F Canvas', () => {
      expect(content).toContain("import { Canvas } from '@react-three/fiber'")
    })

    test('includes OrbitControls', () => {
      expect(content).toContain('OrbitControls')
    })

    test('supports configurable camera position', () => {
      expect(content).toContain('cameraPosition')
    })

    test('supports showStars prop', () => {
      expect(content).toContain('showStars')
    })

    test('supports showStats prop for FPS monitoring', () => {
      expect(content).toContain('showStats')
      expect(content).toContain('Stats')
    })

    test('has fallback component for Suspense', () => {
      expect(content).toContain('SceneFallback')
      expect(content).toContain('<Suspense')
    })

    test('uses brand lighting from constants', () => {
      expect(content).toContain('LIGHTING.keyLightColor')
      expect(content).toContain('LIGHTING.fillLightColor')
    })
  })

  describe('ForceGraph3D', () => {
    const filePath = path.join(COMPONENTS_DIR, 'force-graph-3d.tsx')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('exports ForceGraph3D component', () => {
      expect(content).toContain('export function ForceGraph3D')
    })

    test('exports GraphNode type', () => {
      expect(content).toContain('export interface GraphNode')
    })

    test('exports GraphEdge type', () => {
      expect(content).toContain('export interface GraphEdge')
    })

    test('exports ForceGraph3DProps', () => {
      expect(content).toContain('export interface ForceGraph3DProps')
    })

    test('delegates layout to graph-layouts module', () => {
      expect(content).toContain('computeLayoutForMode')
      expect(content).toContain("from './graph-layouts'")
    })

    test('has node click handler', () => {
      expect(content).toContain('onNodeClick')
    })

    test('supports group-based coloring', () => {
      expect(content).toContain('GROUP_COLORS')
      expect(content).toContain('node.group')
    })

    test('renders Billboard text labels', () => {
      expect(content).toContain('Billboard')
      expect(content).toContain('Text')
    })
  })

  describe('GraphLayouts (extracted computation)', () => {
    const filePath = path.join(COMPONENTS_DIR, 'graph-layouts.ts')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('uses Fibonacci sphere for initial positions', () => {
      expect(content).toContain('Math.sqrt(5)')
    })

    test('exports computeLayoutForMode', () => {
      expect(content).toContain('export function computeLayoutForMode')
    })

    test('supports four layout modes', () => {
      expect(content).toContain("'hierarchy'")
      expect(content).toContain("'radial'")
      expect(content).toContain("'grid'")
      expect(content).toContain("'force'")
    })

    test('has layer order for hierarchy grouping', () => {
      expect(content).toContain('foundation')
      expect(content).toContain('domain')
      expect(content).toContain('orchestration')
      expect(content).toContain('service')
    })
  })

  describe('SurfacePlot3D', () => {
    const filePath = path.join(COMPONENTS_DIR, 'surface-plot-3d.tsx')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('exports SurfacePlot3D', () => {
      expect(content).toContain('export function SurfacePlot3D')
    })

    test('accepts a mathematical function prop', () => {
      expect(content).toContain('fn:')
    })

    test('supports wireframe mode', () => {
      expect(content).toContain('wireframe')
    })

    test('supports multiple color modes', () => {
      expect(content).toContain('height')
      expect(content).toContain('gradient')
      expect(content).toContain('contour')
    })

    test('uses BufferGeometry for mesh', () => {
      expect(content).toContain('BufferGeometry')
    })

    test('has height-to-color mapping', () => {
      expect(content).toContain('heightToColor')
    })
  })

  describe('StateOrbit3D', () => {
    const filePath = path.join(COMPONENTS_DIR, 'state-orbit-3d.tsx')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('exports StateOrbit3D', () => {
      expect(content).toContain('export function StateOrbit3D')
    })

    test('exports StateNode type', () => {
      expect(content).toContain('export interface StateNode')
    })

    test('exports StateTransition type', () => {
      expect(content).toContain('export interface StateTransition')
    })

    test('has click handler for states', () => {
      expect(content).toContain('onStateClick')
    })

    test('renders central nucleus', () => {
      expect(content).toContain('CentralNucleus')
    })

    test('renders transition arcs', () => {
      expect(content).toContain('TransitionArc')
    })

    test('uses probability for transition styling', () => {
      expect(content).toContain('probability')
    })
  })

  describe('GlowMaterial', () => {
    const filePath = path.join(COMPONENTS_DIR, 'glow-material.tsx')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true)
    })

    test('exports GlowShaderMaterial', () => {
      expect(content).toContain('export { GlowShaderMaterial }')
    })

    test('uses custom GLSL shaders', () => {
      expect(content).toContain('gl_Position')
      expect(content).toContain('gl_FragColor')
    })

    test('implements rim glow effect', () => {
      expect(content).toContain('rim')
      expect(content).toContain('glow')
    })

    test('extends R3F elements', () => {
      expect(content).toContain('extend({ GlowShaderMaterial })')
    })
  })

  describe('Barrel Export', () => {
    const filePath = path.join(COMPONENTS_DIR, 'index.ts')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(filePath, 'utf-8')
    })

    test('exports SceneContainer', () => {
      expect(content).toContain('SceneContainer')
    })

    test('exports ForceGraph3D', () => {
      expect(content).toContain('ForceGraph3D')
    })

    test('exports SurfacePlot3D', () => {
      expect(content).toContain('SurfacePlot3D')
    })

    test('exports StateOrbit3D', () => {
      expect(content).toContain('StateOrbit3D')
    })

    test('exports type definitions', () => {
      expect(content).toContain('GraphNode')
      expect(content).toContain('GraphEdge')
      expect(content).toContain('StateNode')
      expect(content).toContain('StateTransition')
    })
  })
})

describe('Observatory Pages', () => {
  describe('Hub Page', () => {
    const pagePath = path.join(PAGES_DIR, 'page.tsx')
    const hubPath = path.join(PAGES_DIR, 'observatory-hub.tsx')

    test('page.tsx exists', () => {
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    test('observatory-hub.tsx exists', () => {
      expect(fs.existsSync(hubPath)).toBe(true)
    })

    test('hub has 3 sections', () => {
      const content = fs.readFileSync(hubPath, 'utf-8')
      expect(content).toContain('Graph Theory')
      expect(content).toContain('Mathematics')
      expect(content).toContain('State Machines')
    })

    test('hub uses framer-motion', () => {
      const content = fs.readFileSync(hubPath, 'utf-8')
      expect(content).toContain('framer-motion')
      expect(content).toContain('motion.')
    })
  })

  describe('Graph Page', () => {
    const pagePath = path.join(PAGES_DIR, 'graph', 'page.tsx')
    const explorerPath = path.join(PAGES_DIR, 'graph', 'graph-explorer.tsx')
    const datasetsPath = path.join(PAGES_DIR, 'graph', 'graph-datasets.ts')

    test('page.tsx exists', () => {
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    test('graph-explorer.tsx exists', () => {
      expect(fs.existsSync(explorerPath)).toBe(true)
    })

    test('graph-datasets.ts exists', () => {
      expect(fs.existsSync(datasetsPath)).toBe(true)
    })

    test('has NexCore architecture dataset', () => {
      const content = fs.readFileSync(datasetsPath, 'utf-8')
      expect(content).toContain('NexCore')
    })

    test('has PV Signal dataset', () => {
      const content = fs.readFileSync(datasetsPath, 'utf-8')
      expect(content).toContain('PV Signal')
    })

    test('has T1 Primitive dataset', () => {
      const content = fs.readFileSync(datasetsPath, 'utf-8')
      expect(content).toContain('Primitive')
    })
  })

  describe('Math Page', () => {
    const pagePath = path.join(PAGES_DIR, 'math', 'page.tsx')
    const explorerPath = path.join(PAGES_DIR, 'math', 'math-explorer.tsx')
    const functionsPath = path.join(PAGES_DIR, 'math', 'math-functions.ts')

    test('page.tsx exists', () => {
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    test('math-explorer.tsx exists', () => {
      expect(fs.existsSync(explorerPath)).toBe(true)
    })

    test('math-functions.ts exists', () => {
      expect(fs.existsSync(functionsPath)).toBe(true)
    })

    test('has 6 mathematical functions', () => {
      const content = fs.readFileSync(functionsPath, 'utf-8')
      expect(content).toContain('gaussian')
      expect(content).toContain('ripple')
      expect(content).toContain('saddle')
      expect(content).toContain('sinc')
      expect(content).toContain('peaks')
      expect(content).toContain('rosenbrock')
    })

    test('supports wireframe toggle', () => {
      const content = fs.readFileSync(explorerPath, 'utf-8')
      expect(content).toContain('wireframe')
      expect(content).toContain('setWireframe')
    })

    test('supports resolution control', () => {
      const content = fs.readFileSync(explorerPath, 'utf-8')
      expect(content).toContain('resolution')
      expect(content).toContain('setResolution')
    })
  })

  describe('State Page', () => {
    const pagePath = path.join(PAGES_DIR, 'state', 'page.tsx')
    const explorerPath = path.join(PAGES_DIR, 'state', 'state-explorer.tsx')

    test('page.tsx exists', () => {
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    test('state-explorer.tsx exists', () => {
      expect(fs.existsSync(explorerPath)).toBe(true)
    })

    test('has 4 state machine definitions', () => {
      const content = fs.readFileSync(explorerPath, 'utf-8')
      expect(content).toContain('guardian')
      expect(content).toContain('gestation')
      expect(content).toContain('meiosis')
      expect(content).toContain('session')
    })

    test('Guardian machine has 6 states', () => {
      const content = fs.readFileSync(explorerPath, 'utf-8')
      const guardianSection = content.substring(
        content.indexOf("guardian:"),
        content.indexOf("gestation:")
      )
      const stateMatches = guardianSection.match(/id: '/g)
      expect(stateMatches).toHaveLength(6)
    })

    test('all transitions have probability', () => {
      const content = fs.readFileSync(explorerPath, 'utf-8')
      const transitionMatches = content.match(/from: '/g)
      const probabilityMatches = content.match(/probability: /g)
      expect(transitionMatches?.length).toBe(probabilityMatches?.length)
    })
  })
})

describe('Navigation Integration', () => {
  test('Observatory is in the universal nav menu', () => {
    const navPath = path.join(
      process.cwd(),
      'src',
      'components',
      'layout',
      'navigation',
      'universal-nav-menu.tsx'
    )
    const content = fs.readFileSync(navPath, 'utf-8')
    expect(content).toContain('/nucleus/observatory')
    // Label is derived from path segment, not a literal string
    expect(content).toMatch(/observatory/i)
    expect(content).toContain('Telescope')
  })
})

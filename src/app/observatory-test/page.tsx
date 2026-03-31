'use client'

import dynamic from 'next/dynamic'

const SceneContainer = dynamic(
  () => import('@/components/observatory/scene-container').then(m => ({ default: m.SceneContainer })),
  { ssr: false }
)

const ForceGraph3D = dynamic(
  () => import('@/components/observatory/force-graph-3d').then(m => ({ default: m.ForceGraph3D })),
  { ssr: false }
)

const TEST_NODES = [
  { id: 'a', label: 'Node A', group: 'foundation', value: 1.5 },
  { id: 'b', label: 'Node B', group: 'domain', value: 1.2 },
  { id: 'c', label: 'Node C', group: 'orchestration', value: 1.0 },
  { id: 'd', label: 'Node D', group: 'service', value: 1.8 },
]

const TEST_EDGES = [
  { source: 'a', target: 'b', weight: 1.5 },
  { source: 'b', target: 'c', weight: 1.0 },
  { source: 'c', target: 'd', weight: 2.0 },
  { source: 'd', target: 'a', weight: 1.2 },
]

export default function ObservatoryTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0e1a' }}>
      <h1 style={{ color: 'white', padding: '1rem', position: 'absolute', zIndex: 10, fontFamily: 'monospace' }}>
        R3F Test Page
      </h1>
      <SceneContainer cameraPosition={[8, 6, 8]}>
        <ForceGraph3D
          nodes={TEST_NODES}
          edges={TEST_EDGES}
          nodeSize={0.4}
          showLabels={true}
          colorScheme="mixed"
        />
      </SceneContainer>
    </div>
  )
}

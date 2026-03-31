import { createMetadata } from '@/lib/metadata'
import { GraphExplorer } from './graph-explorer'

export const metadata = createMetadata({
  title: 'Graph Theory — Observatory',
  description: '3D force-directed graph visualization for exploring network structures and dependencies',
  path: '/nucleus/observatory/graph',
})

export default function GraphPage() {
  return <GraphExplorer />
}

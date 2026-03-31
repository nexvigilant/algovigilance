import { createMetadata } from '@/lib/metadata'
import { StateExplorer } from './state-explorer'

export const metadata = createMetadata({
  title: 'State Machines — Observatory',
  description: '3D orbital state machine visualization with probabilistic transitions',
  path: '/nucleus/observatory/state',
})

export default function StatePage() {
  return <StateExplorer />
}

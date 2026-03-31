import { createMetadata } from '@/lib/metadata'
import { ObservatoryHub } from './observatory-hub'

export const metadata = createMetadata({
  title: 'Observatory — 3D Data Visualization',
  description: 'Explore data through mathematics, state machines, and graph theory in immersive 3D',
  path: '/nucleus/observatory',
})

export default function ObservatoryPage() {
  return <ObservatoryHub />
}

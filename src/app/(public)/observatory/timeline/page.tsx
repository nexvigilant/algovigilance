import { createMetadata } from '@/lib/metadata'
import { TimelineExplorer } from './timeline-explorer'

export const metadata = createMetadata({
  title: 'Timeline — Observatory',
  description: 'Signal velocity and drift detection across the drug lifecycle timeline in 3D',
  path: '/observatory/timeline',
})

export default function TimelinePage() {
  return <TimelineExplorer />
}

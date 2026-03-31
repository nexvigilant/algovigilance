import { createMetadata } from '@/lib/metadata'
import { LearningExplorer } from './learning-explorer'

export const metadata = createMetadata({
  title: 'Learning Landscapes — Observatory',
  description: 'Visualize your learning progression as a 3D terrain with competency levels and prerequisites',
  path: '/observatory/learning',
})

export default function LearningPage() {
  return <LearningExplorer />
}

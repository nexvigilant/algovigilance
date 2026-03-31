import { createMetadata } from '@/lib/metadata'
import { CausalityExplorer } from './causality-explorer'

export const metadata = createMetadata({
  title: 'Causality — Observatory',
  description: 'Drug-event causality assessment: Naranjo scoring, Bradford Hill criteria, and WHO-UMC classification in 3D',
  path: '/observatory/causality',
})

export default function CausalityPage() {
  return <CausalityExplorer />
}

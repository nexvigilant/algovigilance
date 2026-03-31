import { createMetadata } from '@/lib/metadata'
import { ChemistryExplorer } from './chemistry-explorer'

export const metadata = createMetadata({
  title: 'Chemistry — Observatory',
  description: 'Pre-clinical compound analysis: ADME profiles, binding landscapes, and Hill response surfaces in 3D',
  path: '/observatory/chemistry',
})

export default function ChemistryPage() {
  return <ChemistryExplorer />
}

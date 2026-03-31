import type { Metadata } from 'next'
import { AtlasExplorer } from './atlas-explorer'

export const metadata: Metadata = {
  title: 'Domain Atlas — Observatory — AlgoVigilance',
  description: 'Cross-domain architecture visualization. See the same system through Biology, Clinical Trials, Chemistry, Military, and more professional lenses.',
}

export default function AtlasPage() {
  return <AtlasExplorer />
}

import { createMetadata } from '@/lib/metadata'
import { MoleculeExplorer } from './molecule-explorer'

export const metadata = createMetadata({
  title: 'Molecule — Observatory',
  description: '3D molecular structure visualization with atom-bond graphs, charge distributions, and conformational analysis',
  path: '/observatory/molecule',
})

export default function MoleculePage() {
  return <MoleculeExplorer />
}

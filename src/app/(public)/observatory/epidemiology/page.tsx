import { createMetadata } from '@/lib/metadata'
import { EpidemiologyExplorer } from './epidemiology-explorer'

export const metadata = createMetadata({
  title: 'Epidemiology — Observatory',
  description: 'Population-level drug safety: survival curves, incidence rates, and risk landscapes in 3D',
  path: '/observatory/epidemiology',
})

export default function EpidemiologyPage() {
  return <EpidemiologyExplorer />
}

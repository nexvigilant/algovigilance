import { createMetadata } from '@/lib/metadata'
import { RegulatoryExplorer } from './regulatory-explorer'

export const metadata = createMetadata({
  title: 'Regulatory — Observatory',
  description: 'Regulatory milestone tracking: ICH guidelines, FDA compliance, and approval pathway visualization',
  path: '/observatory/regulatory',
})

export default function RegulatoryPage() {
  return <RegulatoryExplorer />
}

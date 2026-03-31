import { createMetadata } from '@/lib/metadata'
import { CareerExplorer } from './career-explorer'

export const metadata = createMetadata({
  title: 'Career Pathways — Observatory',
  description: 'Explore pharmacovigilance career transitions and skill relationships in 3D',
  path: '/nucleus/observatory/careers',
})

export default function CareersPage() {
  return <CareerExplorer />
}

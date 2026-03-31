import { createMetadata } from '@/lib/metadata'
import { MathExplorer } from './math-explorer'

export const metadata = createMetadata({
  title: 'Mathematics — Observatory',
  description: '3D mathematical function surface visualization with parametric equations and gradients',
  path: '/nucleus/observatory/math',
})

export default function MathPage() {
  return <MathExplorer />
}

import { createMetadata } from '@/lib/metadata';
import { NeuralManifoldWrapper as NeuralManifoldVisualization } from '@/components/visualizations/neural-manifold';

export const metadata = createMetadata({
  title: 'Neural Manifold Visualization',
  description: 'Interactive 3D visualization of high-dimensional neural state space using Three.js. Demonstrates sparse coding, stochastic resonance, and manifold stabilization concepts.',
  path: '/design-system/neural-manifold',
  noIndex: true,
});

export default function NeuralManifoldPage() {
  return <NeuralManifoldVisualization />;
}

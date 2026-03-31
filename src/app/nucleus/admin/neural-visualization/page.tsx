import { createMetadata } from '@/lib/metadata';
import { NeuralVisualizationAdmin } from './neural-visualization-admin';

export const metadata = createMetadata({
  title: 'Neural Visualization Admin',
  description: 'Configure and preview neural visualization components for the Academy',
  path: '/nucleus/admin/neural-visualization',
});

export default function NeuralVisualizationAdminPage() {
  return <NeuralVisualizationAdmin />;
}

import { createMetadata } from '@/lib/metadata';
import { BioTelemetry } from './components/bio-telemetry';

export const metadata = createMetadata({
  title: 'Biological Telemetry',
  description: 'Real-time health monitoring across 8 biological crates — cytokine, hormones, immunity, energy, synapse, transcriptase, ribosome, phenotype',
  path: '/nucleus/vigilance/telemetry',
  keywords: ['telemetry', 'biological systems', 'monitoring', 'NexCore', 'biological architecture'],
});

export default function TelemetryPage() {
  return <BioTelemetry />;
}

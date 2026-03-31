import { createMetadata } from '@/lib/metadata';
import { NexCoreOS } from './components/nexcore-os';

export const metadata = createMetadata({
  title: 'Operating System',
  description: 'NexCore Operating System — unified access to 33 tools across 5 domains, powered by 175 Rust crates and 369 MCP endpoints.',
  path: '/nucleus/os',
  keywords: ['nexcore', 'operating system', 'tools', 'vigilance', 'guardian', 'engineering'],
});

export default function OSPage() {
  return <NexCoreOS />;
}

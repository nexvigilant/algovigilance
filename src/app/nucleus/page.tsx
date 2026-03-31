import { createMetadata } from '@/lib/metadata';
import { NucleusHub } from './components/nucleus-hub';
import { NucleusDirectory } from './components/nucleus-directory';

export const metadata = createMetadata({
  title: 'Nucleus',
  description: 'Access all AlgoVigilance services from your central hub.',
  path: '/nucleus',
});

export default function DashboardPage() {
  return (
    <>
      <NucleusHub />
      <NucleusDirectory />
    </>
  );
}

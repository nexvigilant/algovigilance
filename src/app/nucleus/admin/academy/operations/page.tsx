import { createMetadata } from '@/lib/metadata';
import { OperationsCommandCenter } from './operations-command-center';

export const metadata = createMetadata({
  title: 'Content Operations',
  description: 'Manage capability pathway content generation and publishing',
  path: '/nucleus/admin/academy/operations',
});

export default function OperationsPage() {
  return (
    <>
      <OperationsCommandCenter />
    </>
  );
}
